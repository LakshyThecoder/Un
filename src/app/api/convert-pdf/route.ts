import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Converts a PDF (by URL) to structured HTML using pdfjs-dist server-side.
 * The resulting HTML is uploaded to Supabase Storage and a manuscript_files
 * record is created so the workspace can use it automatically.
 *
 * POST /api/convert-pdf
 * Body: { file_url: string, manuscript_id: string, author_id: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { file_url, manuscript_id, author_id } = await req.json()
    if (!file_url || !manuscript_id) {
      return NextResponse.json({ error: 'file_url and manuscript_id required' }, { status: 400 })
    }

    // ── 1. Fetch the PDF bytes ──────────────────────────────────────────
    const pdfRes = await fetch(file_url, { cache: 'no-store' })
    if (!pdfRes.ok) {
      return NextResponse.json({ error: `Could not fetch PDF: ${pdfRes.status}` }, { status: 502 })
    }
    const pdfBuffer = await pdfRes.arrayBuffer()

    // ── 2. Parse with pdfjs-dist (no worker needed in Node) ───────────
    // Dynamic import lets the bundler skip this at compile time.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfjsLib = require('pdfjs-dist/build/pdf.min.mjs') as {
      getDocument: (src: { data: ArrayBuffer }) => { promise: Promise<PDFDocumentProxy> }
      GlobalWorkerOptions: { workerSrc: string }
    }
    pdfjsLib.GlobalWorkerOptions.workerSrc = ''

    const pdfDoc: PDFDocumentProxy = await pdfjsLib.getDocument({ data: pdfBuffer }).promise
    const html = await convertToHtml(pdfDoc)
    await pdfDoc.destroy()

    // ── 3. Upload HTML to Supabase Storage ─────────────────────────────
    const supabase = await createClient()
    const htmlPath = `${author_id || 'anon'}/${manuscript_id}/document.html`
    const htmlBytes = new TextEncoder().encode(html)

    const { error: uploadErr } = await supabase.storage
      .from('manuscripts')
      .upload(htmlPath, htmlBytes, {
        contentType: 'text/html; charset=utf-8',
        upsert: true,
      })

    if (uploadErr) {
      console.error('[convert-pdf] storage upload failed:', uploadErr)
      return NextResponse.json({ error: uploadErr.message }, { status: 500 })
    }

    const { data: { publicUrl: html_url } } = supabase.storage
      .from('manuscripts')
      .getPublicUrl(htmlPath)

    // ── 4. Upsert a manuscript_files record ────────────────────────────
    await supabase.from('manuscript_files').upsert({
      manuscript_id,
      name: 'document.html',
      type: 'html',
      url: html_url,
      size: htmlBytes.byteLength,
      is_primary: false,
    }, { onConflict: 'manuscript_id,name' }).then(({ error }) => {
      if (error) console.warn('[convert-pdf] upsert file record:', error.message)
    })

    return NextResponse.json({ html_url })
  } catch (err) {
    console.error('[convert-pdf] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ── Types ────────────────────────────────────────────────────────────────────
interface PDFDocumentProxy {
  numPages: number
  getPage(n: number): Promise<PDFPageProxy>
  destroy(): Promise<void>
}
interface PDFPageProxy {
  getViewport(opts: { scale: number }): { width: number; height: number }
  getTextContent(opts?: { includeMarkedContent?: boolean }): Promise<TextContent>
}
interface TextContent {
  items: TextItem[]
}
interface TextItem {
  str: string
  transform: [number, number, number, number, number, number]
  width: number
  height: number
  fontName?: string
  hasEOL?: boolean
}

// ── PDF → HTML ────────────────────────────────────────────────────────────────
async function convertToHtml(pdf: PDFDocumentProxy): Promise<string> {
  const pages: string[] = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const vp = page.getViewport({ scale: 1 })
    const textContent = await page.getTextContent()

    // Group text items into lines by their y-coordinate proximity
    const lines = groupIntoLines(textContent.items, vp.height)
    const pageBody = lines.map(lineToParagraph).join('\n')

    pages.push(
      `<div class="pdf-page" data-page="${pageNum}" aria-label="Page ${pageNum}">\n` +
      `  <div class="page-num">Page ${pageNum}</div>\n` +
      pageBody +
      `\n</div>`
    )
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Georgia', 'Times New Roman', serif;
    background: #f0f0f5;
    color: #0d0d14;
    padding: 32px 16px;
  }
  .pdf-page {
    background: white;
    width: 100%;
    max-width: 760px;
    margin: 0 auto 32px;
    padding: 64px 80px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.1);
    border-radius: 4px;
    position: relative;
    page-break-after: always;
  }
  .page-num {
    position: absolute;
    bottom: 20px;
    right: 28px;
    font-size: 11px;
    color: #9898b0;
    font-family: sans-serif;
    user-select: none;
  }
  .pdf-line {
    margin-bottom: 0.35em;
    line-height: 1.65;
    word-spacing: 0.05em;
  }
  .pdf-line.large {
    font-size: 1.25em;
    font-weight: 700;
    margin-bottom: 0.6em;
    margin-top: 0.8em;
  }
  .pdf-line.medium {
    font-size: 1.05em;
    font-weight: 600;
    margin-bottom: 0.4em;
    margin-top: 0.5em;
  }
  .pdf-line.small {
    font-size: 0.85em;
    color: #6b6b80;
  }
  p { margin-bottom: 0.9em; }
  ::selection { background: rgba(99,102,241,0.25); }
</style>
</head>
<body>
${pages.join('\n')}
</body>
</html>`
}

interface Line {
  y: number
  items: TextItem[]
  avgHeight: number
}

function groupIntoLines(items: TextItem[], pageHeight: number): Line[] {
  const lines: Line[] = []
  const THRESHOLD = 3 // px — items within this y distance are on the same line

  for (const item of items) {
    if (!item.str.trim() && !item.hasEOL) continue
    // PDF y-axis is bottom-up; convert to top-down
    const y = pageHeight - item.transform[5]

    const existing = lines.find(l => Math.abs(l.y - y) <= THRESHOLD)
    if (existing) {
      existing.items.push(item)
    } else {
      lines.push({ y, items: [item], avgHeight: item.height })
    }
  }

  // Sort lines top-to-bottom, items left-to-right
  lines.sort((a, b) => a.y - b.y)
  for (const line of lines) {
    line.items.sort((a, b) => a.transform[4] - b.transform[4])
    line.avgHeight = line.items.reduce((s, i) => s + (i.height || 10), 0) / line.items.length
  }

  return lines
}

function lineToParagraph(line: Line): string {
  const text = line.items.map(i => i.str).join(' ').trim()
  if (!text) return ''

  const h = line.avgHeight
  const sizeClass = h >= 16 ? 'large' : h >= 13 ? 'medium' : h <= 8 ? 'small' : ''
  const escaped = escapeHtml(text)

  return `  <div class="pdf-line${sizeClass ? ' ' + sizeClass : ''}">${escaped}</div>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
