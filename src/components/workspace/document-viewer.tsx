'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { Comment } from '@/types'
import { cn, truncate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { HighlightRect } from './pdf-viewer'

interface DocumentViewerProps {
  htmlUrl: string
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
  bubbleX: number
  bubbleY: number
  page: number
  rects: HighlightRect[]
}

const ACCENT: Record<string, string> = {
  '#FDE68A': '#f59e0b',
  '#BAE6FD': '#0ea5e9',
  default: '#6366f1',
}
const BG: Record<string, string> = {
  '#FDE68A': 'rgba(251,191,36,0.28)',
  '#BAE6FD': 'rgba(56,189,248,0.28)',
  default: 'rgba(99,102,241,0.2)',
}

function accent(c?: string) { return c ? (ACCENT[c] ?? ACCENT.default) : ACCENT.default }
function bg(c?: string) { return c ? (BG[c] ?? BG.default) : BG.default }

export function DocumentViewer({
  htmlUrl, comments, onAddComment, onCommentClick, activeCommentId, readOnly = false,
}: DocumentViewerProps) {
  const [html, setHtml] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selection, setSelection] = useState<SelectionState | null>(null)
  const [composing, setComposing] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Load the HTML document
  useEffect(() => {
    setLoading(true); setError(null)
    fetch(`/api/pdf-proxy?url=${encodeURIComponent(htmlUrl)}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.text()
      })
      .then(text => { setHtml(text); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [htmlUrl])

  // Inject highlight CSS + selection handler into the iframe document
  useEffect(() => {
    if (!html || !iframeRef.current) return
    const iframe = iframeRef.current
    const doc = iframe.contentDocument
    if (!doc) return

    doc.open(); doc.write(html); doc.close()

    // Inject highlight style
    const style = doc.createElement('style')
    style.textContent = `
      .uknow-hl { cursor: pointer; border-radius: 2px; transition: opacity .15s; }
      .uknow-hl:hover { opacity: 1 !important; }
    `
    doc.head.appendChild(style)
  }, [html])

  // Re-render highlights whenever comments or active state change
  useEffect(() => {
    const doc = iframeRef.current?.contentDocument
    if (!doc || !html) return
    renderHighlights(doc, comments, activeCommentId, hoveredId, onCommentClick)
  }, [comments, activeCommentId, hoveredId, html]) // eslint-disable-line

  // Listen for text selections inside the iframe
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    function handleMouseUp(e: MouseEvent) {
      if (readOnly || composing) return
      const doc = iframe!.contentDocument
      if (!doc) return
      const sel = doc.getSelection()
      const text = sel?.toString().trim() || ''
      if (text.length < 3) { setSelection(null); return }

      const range = sel!.getRangeAt(0)
      const iframeRect = iframe!.getBoundingClientRect()
      const rects: HighlightRect[] = []
      const docHeight = doc.documentElement.scrollHeight

      for (const r of Array.from(range.getClientRects())) {
        if (r.width < 2 || r.height < 2) continue
        rects.push({
          top:   ((r.top  + iframe!.contentWindow!.scrollY) / docHeight) * 100,
          left:  (r.left  / iframeRect.width) * 100,
          width: (r.width / iframeRect.width) * 100,
          height:(r.height/ docHeight) * 100,
        })
      }
      if (!rects.length) return

      const boundingRect = range.getBoundingClientRect()
      // Compute page number from position
      const pageEls = Array.from(doc.querySelectorAll('.pdf-page'))
      let page = 1
      for (const el of pageEls) {
        const er = el.getBoundingClientRect()
        if (boundingRect.top >= er.top) page = parseInt((el as HTMLElement).dataset.page || '1')
      }

      // Position bubble in container coords (outside iframe)
      const containerRect = containerRef.current?.getBoundingClientRect()
      const bubbleX = iframeRect.left - (containerRect?.left ?? 0) + boundingRect.left + boundingRect.width / 2
      const bubbleY = iframeRect.top  - (containerRect?.top  ?? 0) + boundingRect.top  - (containerRef.current?.scrollTop ?? 0) - 8

      setSelection({ text, bubbleX, bubbleY, page, rects })
    }

    const onLoad = () => {
      const doc = iframe!.contentDocument
      doc?.addEventListener('mouseup', handleMouseUp)
    }
    iframe.addEventListener('load', onLoad)
    // Also attach if already loaded
    if (iframe.contentDocument?.readyState === 'complete') {
      iframe.contentDocument.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      iframe.removeEventListener('load', onLoad)
      iframe.contentDocument?.removeEventListener('mouseup', handleMouseUp)
    }
  }, [readOnly, composing]) // eslint-disable-line

  function submitComment() {
    if (!selection || !commentText.trim()) return
    onAddComment({
      quote: selection.text,
      page: selection.page,
      x: selection.rects[0]?.left ?? 50,
      y: selection.rects[0]?.top ?? 50,
      content: commentText,
      highlight_rects: selection.rects,
    })
    setSelection(null); setComposing(false); setCommentText('')
    iframeRef.current?.contentDocument?.getSelection()?.removeAllRanges()
  }

  function cancelComment() {
    setComposing(false); setSelection(null); setCommentText('')
    iframeRef.current?.contentDocument?.getSelection()?.removeAllRanges()
  }

  return (
    <div className="flex flex-col h-full bg-[#f0f0f5]">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-[#e2e2ec] flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white"
               style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>H</div>
          <span className="text-xs font-bold text-[#0d0d14]">HTML Document</span>
          <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
            ✓ Inline comments enabled
          </span>
        </div>
        {!readOnly && (
          <div className="ml-auto flex items-center gap-1.5 text-xs text-[#9898b0]">
            <div className="w-2 h-2 rounded-sm" style={{ background: 'rgba(99,102,241,0.4)' }} />
            Select any text to annotate
          </div>
        )}
      </div>

      {/* Content area */}
      <div ref={containerRef} className="flex-1 overflow-auto relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#f0f0f5]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-[#e2e2ec] border-t-indigo-500"
                   style={{ animation: 'spin 0.8s linear infinite' }} />
              <p className="text-sm font-semibold text-[#6b6b80]">Loading document…</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white rounded-2xl border border-[#e2e2ec] p-8 text-center max-w-sm shadow-sm">
              <div className="text-3xl mb-3">⚠️</div>
              <div className="font-display font-bold text-[#0d0d14] mb-2">Could not load document</div>
              <p className="text-xs text-[#9898b0]">{error}</p>
            </div>
          </div>
        )}

        {html && !error && (
          <iframe
            ref={iframeRef}
            title="Manuscript"
            className="w-full border-0"
            style={{ height: '100%', minHeight: '600px', display: 'block' }}
            sandbox="allow-same-origin allow-scripts"
          />
        )}

        {/* ── "Add Comment" bubble ── */}
        {selection && !composing && (
          <div
            style={{
              position: 'absolute',
              left: selection.bubbleX,
              top: selection.bubbleY - 40,
              transform: 'translateX(-50%)',
              zIndex: 50,
              pointerEvents: 'auto',
            }}
          >
            <button
              onMouseDown={e => { e.preventDefault(); setComposing(true) }}
              className="flex items-center gap-1.5 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xl whitespace-nowrap hover:scale-105 transition-transform"
              style={{ background: 'linear-gradient(135deg, #0d0d14, #1a1a2e)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
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
              <div className="w-0.5 min-h-full bg-indigo-400 rounded-full flex-shrink-0 self-stretch" />
              <p className="text-xs text-indigo-700 italic leading-relaxed line-clamp-3">
                "{truncate(selection.text, 100)}"
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
                onMouseDown={e => { e.preventDefault(); cancelComment() }}
                className="text-xs text-[#9898b0] hover:text-[#6b6b80] px-3 py-1.5 border border-[#e2e2ec] rounded-lg transition-colors"
              >Cancel</button>
              <Button size="sm" variant="gradient" onMouseDown={e => { e.preventDefault(); submitComment() }} disabled={!commentText.trim()}>
                Save Comment
              </Button>
            </div>
          </div>
        )}

        {/* ── Active comment popup (overlaid over iframe) ── */}
        {activeCommentId && (() => {
          const c = comments.find(x => x.id === activeCommentId)
          if (!c?.highlight_rects?.length) return null
          const iframe = iframeRef.current
          if (!iframe) return null
          const r = c.highlight_rects[0]
          const iframeRect = iframe.getBoundingClientRect()
          const containerRect = containerRef.current?.getBoundingClientRect()
          const scrollY = iframe.contentWindow?.scrollY ?? 0
          const docH = iframe.contentDocument?.documentElement.scrollHeight ?? 1
          const absTop = (r.top / 100) * docH - scrollY
          const absLeft = (r.left / 100) * iframeRect.width

          return (
            <div
              key={`popup-${c.id}`}
              style={{
                position: 'absolute',
                top:  iframeRect.top - (containerRect?.top ?? 0) + absTop - 82,
                left: iframeRect.left - (containerRect?.left ?? 0) + absLeft,
                zIndex: 60,
                width: 260,
              }}
            >
              <div className="bg-white rounded-2xl border border-[#e2e2ec] p-3 shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar name={c.author?.full_name || 'User'} size="xs" />
                  <span className="text-xs font-bold text-[#0d0d14]">{c.author?.full_name}</span>
                </div>
                {c.quote && (
                  <p className="text-[10px] text-[#9898b0] italic border-l-2 pl-2 mb-2 line-clamp-2 leading-relaxed"
                     style={{ borderColor: accent(c.color) }}>
                    "{truncate(c.quote, 70)}"
                  </p>
                )}
                <p className="text-xs text-[#0d0d14] leading-relaxed">{c.content}</p>
              </div>
              <div className="w-3 h-3 bg-white border-r border-b border-[#e2e2ec] rotate-45 ml-4 -mt-1.5" />
            </div>
          )
        })()}
      </div>
    </div>
  )
}

// ── Inject persistent highlight spans into iframe DOM ─────────────────────────
function renderHighlights(
  doc: Document,
  comments: Comment[],
  activeId: string | null | undefined,
  hoveredId: string | null,
  onClick: (id: string) => void,
) {
  // Remove previous highlights
  doc.querySelectorAll('.uknow-hl').forEach(el => {
    const parent = el.parentNode
    if (!parent) return
    while (el.firstChild) parent.insertBefore(el.firstChild, el)
    parent.removeChild(el)
  })

  // Re-inject highlights using highlight_rects stored as % of docHeight / width
  const docH = doc.documentElement.scrollHeight
  const docW = doc.documentElement.scrollWidth

  for (const c of comments) {
    if (c.resolved) continue
    const rects = c.highlight_rects
    if (!rects?.length) continue

    const isActive = c.id === activeId || c.id === hoveredId
    const accentColor = accent(c.color)
    const bgColor = bg(c.color)

    for (const r of rects) {
      const el = doc.createElement('div')
      el.className = 'uknow-hl'
      el.dataset.commentId = c.id
      el.style.cssText = [
        'position:fixed',
        `top:${(r.top / 100) * docH}px`,
        `left:${(r.left / 100) * docW}px`,
        `width:${(r.width / 100) * docW}px`,
        `height:${(r.height / 100) * docH}px`,
        `background:${bgColor}`,
        `border-bottom:2px solid ${accentColor}`,
        `opacity:${isActive ? 1 : 0.7}`,
        'pointer-events:auto',
        'z-index:100',
      ].join(';')
      el.title = c.content
      el.addEventListener('click', () => onClick(c.id))
      doc.body.appendChild(el)
    }
  }
}
