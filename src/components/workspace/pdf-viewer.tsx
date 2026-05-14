'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { Comment } from '@/types'
import { cn, truncate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'

export interface HighlightRect { top: number; left: number; width: number; height: number }

interface PdfViewerProps {
  url: string
  comments: Comment[]
  onAddComment: (data: {
    quote: string; page: number; x: number; y: number; content: string
    highlight_rects?: HighlightRect[]
  }) => void
  onCommentClick: (id: string) => void
  activeCommentId?: string | null
  readOnly?: boolean
}

interface SelectionState {
  text: string
  bubbleX: number; bubbleY: number
  pctX: number; pctY: number
  page: number
  rects: HighlightRect[]
  pageEl: HTMLElement
}

const ACCENT: Record<string, string> = { '#FDE68A': '#f59e0b', '#BAE6FD': '#0ea5e9', default: '#6366f1' }
const BG:     Record<string, string> = { '#FDE68A': 'rgba(251,191,36,0.30)', '#BAE6FD': 'rgba(56,189,248,0.30)', default: 'rgba(99,102,241,0.22)' }
const accentFor = (c?: string) => c ? (ACCENT[c] ?? ACCENT.default) : ACCENT.default
const bgFor     = (c?: string) => c ? (BG[c]     ?? BG.default)     : BG.default

export function PdfViewer({
  url, comments, onAddComment, onCommentClick, activeCommentId, readOnly = false,
}: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0)
  const [scale, setScale] = useState(1.3)
  const [selection, setSelection] = useState<SelectionState | null>(null)
  const [composing, setComposing] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [useFallback, setUseFallback] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const containerRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  const [PDFComponents, setPDFComponents] = useState<{
    Document: React.ComponentType<{
      file: string
      onLoadSuccess: (pdf: { numPages: number }) => void
      onLoadError: (err: Error) => void
      children: React.ReactNode
    }>
    Page: React.ComponentType<{
      pageNumber: number; scale: number
      renderTextLayer?: boolean; renderAnnotationLayer?: boolean
      onRenderSuccess?: () => void
    }>
  } | null>(null)

  const proxiedUrl = url ? `/api/pdf-proxy?url=${encodeURIComponent(url)}` : ''

  useEffect(() => {
    import('react-pdf').then(m => {
      m.pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
      setPDFComponents({ Document: m.Document, Page: m.Page })
    }).catch(() => { setLoadState('error'); setErrorMsg('Could not load PDF renderer.') })
  }, [])

  // Scroll observer — track which page is visible
  useEffect(() => {
    const container = containerRef.current
    if (!container || loadState !== 'loaded') return
    const obs = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) {
          const p = parseInt((e.target as HTMLElement).dataset.page || '1')
          setCurrentPage(p)
        }
      }
    }, { root: container, threshold: 0.5 })
    pageRefs.current.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [loadState, numPages])

  // Build per-page comment lists
  const commentsByPage = (page: number) => comments.filter(c => c.page_number === page && !c.resolved)

  // Convert selection rects to % of the specific page element
  function getPageEl(page: number): HTMLDivElement | null {
    return pageRefs.current.get(page) ?? null
  }

  const handleMouseUp = useCallback(() => {
    if (readOnly || composing) return
    const sel = window.getSelection()
    const text = sel?.toString().trim() || ''
    if (text.length < 3) { setSelection(null); return }

    const range = sel!.getRangeAt(0)
    const domRects = range.getClientRects()
    if (!domRects.length) return

    // Find which page the selection is on
    let foundPage = 1
    let foundPageEl: HTMLElement | null = null
    pageRefs.current.forEach((el, p) => {
      const er = el.getBoundingClientRect()
      const sr = range.getBoundingClientRect()
      if (sr.top >= er.top - 8 && sr.top <= er.bottom) {
        foundPage = p
        foundPageEl = el
      }
    })
    if (!foundPageEl) return

    const pageRect = (foundPageEl as HTMLElement).getBoundingClientRect()

    const rects: HighlightRect[] = []
    for (const r of Array.from(domRects)) {
      if (r.width < 2 || r.height < 2) continue
      rects.push({
        top:    ((r.top    - pageRect.top)    / pageRect.height) * 100,
        left:   ((r.left   - pageRect.left)   / pageRect.width)  * 100,
        width:  (r.width   / pageRect.width)  * 100,
        height: (r.height  / pageRect.height) * 100,
      })
    }
    if (!rects.length) return

    const boundingRect = range.getBoundingClientRect()
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return

    setSelection({
      text,
      bubbleX: boundingRect.left - containerRect.left + boundingRect.width / 2,
      bubbleY: boundingRect.top  - containerRect.top  + (containerRef.current?.scrollTop || 0) - 8,
      pctX: ((boundingRect.left + boundingRect.width / 2 - pageRect.left) / pageRect.width) * 100,
      pctY: ((boundingRect.top - pageRect.top) / pageRect.height) * 100,
      page: foundPage,
      rects,
      pageEl: foundPageEl as HTMLElement,
    })
  }, [readOnly, composing])

  function submitComment() {
    if (!selection || !commentText.trim()) return
    onAddComment({ quote: selection.text, page: selection.page, x: selection.pctX, y: selection.pctY, content: commentText, highlight_rects: selection.rects })
    clearSelection()
  }
  function clearSelection() {
    setSelection(null); setComposing(false); setCommentText('')
    window.getSelection()?.removeAllRanges()
  }

  const { Document, Page } = PDFComponents || {}

  if (!url) return (
    <div className="flex flex-col items-center justify-center h-full bg-[#f4f4f8]">
      <div className="text-4xl mb-3">📄</div>
      <p className="font-semibold text-[#0d0d14]">No file attached</p>
    </div>
  )

  if (useFallback) return (
    <div className="flex flex-col h-full bg-[#f0f0f5]">
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-[#e2e2ec] flex-shrink-0">
        <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
          Native browser viewer — inline annotation unavailable
        </span>
        <a href={url} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs font-semibold text-indigo-600 hover:underline">Open ↗</a>
      </div>
      <iframe src={proxiedUrl} className="flex-1 w-full border-0" title="PDF" />
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-[#e8e8f0]">
      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2 bg-white border-b border-[#e2e2ec] flex-shrink-0 shadow-sm">
        {/* Page indicator */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0d0d14]">
          <svg className="w-3.5 h-3.5 text-[#9898b0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="tabular-nums">{numPages ? `${currentPage} / ${numPages}` : '—'}</span>
        </div>

        <div className="w-px h-4 bg-[#e2e2ec]" />

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <button onClick={() => setScale(s => Math.max(0.5, +(s - 0.15).toFixed(2)))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-[#6b6b80] hover:bg-[#f0f0f5] transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
          </button>
          <button onClick={() => setScale(1.3)}
                  className="text-xs font-bold text-[#6b6b80] tabular-nums w-11 text-center py-1 rounded-lg hover:bg-[#f0f0f5] transition-colors">
            {Math.round(scale * 100)}%
          </button>
          <button onClick={() => setScale(s => Math.min(4, +(s + 0.15).toFixed(2)))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-[#6b6b80] hover:bg-[#f0f0f5] transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {!readOnly && (
            <span className="flex items-center gap-1.5 text-[11px] text-[#9898b0]">
              <div className="w-2.5 h-2.5 rounded-sm border-b-2"
                   style={{ background: 'rgba(99,102,241,0.25)', borderColor: '#6366f1' }} />
              Select text to annotate
            </span>
          )}
          <a href={url} target="_blank" rel="noopener noreferrer"
             className="w-7 h-7 flex items-center justify-center rounded-lg text-[#6b6b80] hover:bg-[#f0f0f5] transition-colors" title="Open PDF">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
        </div>
      </div>

      {/* ── Document area ────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto relative select-text"
        onMouseUp={handleMouseUp}
      >
        {/* Loading */}
        {loadState === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-3 bg-white/80 backdrop-blur-sm px-8 py-6 rounded-2xl shadow-sm">
              <div className="w-8 h-8 rounded-full border-2 border-[#e2e2ec] border-t-indigo-500"
                   style={{ animation: 'spin 0.7s linear infinite' }} />
              <p className="text-xs font-semibold text-[#6b6b80]">Rendering document…</p>
            </div>
          </div>
        )}

        {/* Error */}
        {loadState === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white rounded-2xl border border-[#e2e2ec] p-8 max-w-sm text-center shadow-sm">
              <div className="text-3xl mb-3">⚠️</div>
              <div className="font-display font-bold text-[#0d0d14] mb-2">Could not render PDF</div>
              <p className="text-xs text-[#9898b0] mb-4">{errorMsg}</p>
              <div className="flex gap-2 justify-center">
                <Button size="sm" variant="gradient" onClick={() => { setUseFallback(true); setLoadState('loaded') }}>
                  Use browser viewer
                </Button>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline">Open PDF ↗</Button>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Pages */}
        <div className={cn('flex flex-col items-center py-8 gap-6 px-6', loadState !== 'loaded' && 'opacity-0')}>
          {Document && Page && (
            <Document
              file={proxiedUrl}
              onLoadSuccess={({ numPages }) => { setNumPages(numPages); setLoadState('loaded') }}
              onLoadError={(err: Error) => { setLoadState('error'); setErrorMsg(err.message) }}
            >
              {Array.from({ length: numPages }, (_, i) => i + 1).map(pageNum => (
                <PageWrapper
                  key={pageNum}
                  pageNum={pageNum}
                  scale={scale}
                  Page={Page}
                  comments={commentsByPage(pageNum)}
                  activeCommentId={activeCommentId}
                  hoveredId={hoveredId}
                  onCommentClick={onCommentClick}
                  setHoveredId={setHoveredId}
                  selection={selection?.page === pageNum ? selection : null}
                  onRef={el => el ? pageRefs.current.set(pageNum, el) : pageRefs.current.delete(pageNum)}
                />
              ))}
            </Document>
          )}
        </div>

        {/* ── Add comment bubble ── */}
        {selection && !composing && (
          <div style={{ position: 'absolute', left: selection.bubbleX, top: selection.bubbleY - 42, transform: 'translateX(-50%)', zIndex: 50 }}>
            <button
              onMouseDown={e => { e.preventDefault(); setComposing(true) }}
              className="flex items-center gap-1.5 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xl whitespace-nowrap hover:scale-105 transition-transform"
              style={{ background: 'linear-gradient(135deg, #0d0d14 0%, #1a1a2e 100%)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Annotate
            </button>
          </div>
        )}

        {/* ── Comment compose box ── */}
        {selection && composing && (
          <div
            style={{
              position: 'absolute',
              left: Math.min(Math.max(selection.bubbleX - 160, 8), (containerRef.current?.clientWidth || 600) - 336),
              top: selection.bubbleY,
              zIndex: 50,
              width: 320,
            }}
            className="bg-white rounded-2xl border border-[#e2e2ec] shadow-2xl p-4"
          >
            <div className="flex items-start gap-2 mb-3 p-2.5 rounded-xl bg-indigo-50 border border-indigo-100">
              <div className="w-0.5 self-stretch bg-indigo-400 rounded-full flex-shrink-0" />
              <p className="text-xs text-indigo-700 italic leading-relaxed line-clamp-3">
                "{truncate(selection.text, 120)}"
              </p>
            </div>
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              autoFocus
              placeholder="Add your comment or annotation…"
              rows={3}
              className="w-full text-sm border border-[#e2e2ec] rounded-xl px-3 py-2.5 resize-none outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 text-[#0d0d14] placeholder:text-[#9898b0] leading-relaxed"
            />
            <div className="flex gap-2 mt-3 justify-end">
              <button
                onMouseDown={e => { e.preventDefault(); clearSelection() }}
                className="text-xs text-[#9898b0] hover:text-[#6b6b80] px-3 py-1.5 border border-[#e2e2ec] rounded-lg transition-colors"
              >Cancel</button>
              <Button size="sm" variant="gradient" onMouseDown={e => { e.preventDefault(); submitComment() }} disabled={!commentText.trim()}>
                Save
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Per-page wrapper with highlight overlay ──────────────────────────────────
interface PageWrapperProps {
  pageNum: number
  scale: number
  Page: React.ComponentType<{ pageNumber: number; scale: number; renderTextLayer?: boolean; renderAnnotationLayer?: boolean; onRenderSuccess?: () => void }>
  comments: Comment[]
  activeCommentId?: string | null
  hoveredId: string | null
  onCommentClick: (id: string) => void
  setHoveredId: (id: string | null) => void
  selection: SelectionState | null
  onRef: (el: HTMLDivElement | null) => void
}

function PageWrapper({ pageNum, scale, Page, comments, activeCommentId, hoveredId, onCommentClick, setHoveredId, selection, onRef }: PageWrapperProps) {
  const [rendered, setRendered] = useState(false)

  return (
    <div
      ref={onRef}
      data-page={pageNum}
      className="relative bg-white shadow-2xl"
      style={{ borderRadius: 2 }}
    >
      <Page
        pageNumber={pageNum}
        scale={scale}
        renderTextLayer
        renderAnnotationLayer={false}
        onRenderSuccess={() => setRendered(true)}
      />

      {/* Persistent comment highlights */}
      {rendered && comments.map(c => {
        const rects = c.highlight_rects as HighlightRect[] | null
        if (!rects?.length) return null
        const isActive = c.id === activeCommentId || c.id === hoveredId
        const a = accentFor(c.color); const b = bgFor(c.color)

        return rects.map((r, ri) => (
          <div
            key={`${c.id}-${ri}`}
            style={{
              position: 'absolute',
              top:    `${r.top}%`,
              left:   `${r.left}%`,
              width:  `${r.width}%`,
              height: `${r.height}%`,
              background: b,
              borderBottom: `2px solid ${a}`,
              opacity: isActive ? 1 : 0.75,
              cursor: 'pointer',
              zIndex: 10,
              transition: 'opacity .15s',
              borderRadius: '1px',
              mixBlendMode: 'multiply',
              pointerEvents: ri === 0 ? 'auto' : 'none',
            }}
            onClick={e => { e.stopPropagation(); onCommentClick(c.id) }}
            onMouseEnter={() => setHoveredId(c.id)}
            onMouseLeave={() => setHoveredId(null)}
          />
        ))
      })}

      {/* Active comment popup */}
      {rendered && comments.filter(c => c.id === activeCommentId && (c.highlight_rects as HighlightRect[] | null)?.length).map(c => {
        const r = (c.highlight_rects as HighlightRect[])[0]
        return (
          <div key={`popup-${c.id}`} style={{
            position: 'absolute',
            top: `calc(${r.top}% - 82px)`,
            left: `${Math.min(r.left, 65)}%`,
            zIndex: 30,
            width: 260,
          }}>
            <div className="bg-white rounded-2xl border border-[#e2e2ec] p-3 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <Avatar name={c.author?.full_name || '?'} size="xs" />
                <span className="text-xs font-bold text-[#0d0d14] flex-1">{c.author?.full_name}</span>
                <span className="text-[10px] text-[#9898b0]">p.{pageNum}</span>
              </div>
              {c.quote && (
                <p className="text-[10px] text-[#9898b0] italic border-l-2 pl-2 mb-2 line-clamp-2 leading-relaxed"
                   style={{ borderColor: accentFor(c.color) }}>
                  "{truncate(c.quote, 80)}"
                </p>
              )}
              <p className="text-xs text-[#0d0d14] leading-relaxed">{c.content}</p>
            </div>
            <div className="w-3 h-3 bg-white border-r border-b border-[#e2e2ec] rotate-45 ml-5 -mt-1.5" />
          </div>
        )
      })}

      {/* Live selection highlight (while composing comment) */}
      {selection?.rects.map((r, i) => (
        <div
          key={`sel-${i}`}
          style={{
            position: 'absolute',
            top: `${r.top}%`, left: `${r.left}%`,
            width: `${r.width}%`, height: `${r.height}%`,
            background: 'rgba(99,102,241,0.22)',
            borderBottom: '2px solid #6366f1',
            zIndex: 15,
            borderRadius: '1px',
            mixBlendMode: 'multiply',
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  )
}
