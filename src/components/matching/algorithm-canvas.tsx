'use client'
import { useEffect, useRef, useState } from 'react'
import { SemanticConcept, ReviewerMatch } from '@/types'
import { Button } from '@/components/ui/button'

interface AlgorithmCanvasProps {
  concepts: SemanticConcept[]
  matches: ReviewerMatch[]
  onDone: () => void
}

interface Particle {
  pi: number; ri: number; str: number
  t: number; speed: number; r: number
  color: string; alpha: number
}

const COLORS = ['#22d3ee', '#a78bfa', '#fb923c', '#4ade80', '#f472b6']

export function AlgorithmCanvas({ concepts, matches, onDone }: AlgorithmCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const stateRef = useRef<{ particles: Particle[]; scores: number[]; lastSpawn: number; finished: boolean }>({
    particles: [], scores: matches.map(() => 0), lastSpawn: 0, finished: false,
  })
  const startRef = useRef<number | null>(null)
  const [dispScores, setDispScores] = useState<number[]>(matches.map(() => 0))
  const [showBtn, setShowBtn] = useState(false)

  const conceptNodes = concepts.slice(0, 6)
  // Use real matches if available, otherwise use placeholder nodes just for the animation visuals
  const animNodes = matches.slice(0, 5)
  const reviewerNodes = animNodes.length > 0 ? animNodes : [
    { reviewer: { full_name: 'Searching…' }, match_score: 75 },
    { reviewer: { full_name: 'Searching…' }, match_score: 85 },
    { reviewer: { full_name: 'Searching…' }, match_score: 65 },
  ] as ReviewerMatch[]

  function bez(t: number, ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number) {
    const u = 1 - t
    return { x: u*u*u*ax+3*u*u*t*bx+3*u*t*t*cx+t*t*t*dx, y: u*u*u*ay+3*u*u*t*by+3*u*t*t*cy+t*t*t*dy }
  }

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    let rafStarted = false

    function tryStart() {
      const w = canvas!.clientWidth, h = canvas!.clientHeight
      if (w > 0 && h > 0) {
        canvas!.width = w * dpr; canvas!.height = h * dpr
        if (!rafStarted) { rafStarted = true; rafRef.current = requestAnimationFrame(frame) }
      } else setTimeout(tryStart, 30)
    }
    tryStart()

    function spawn(elapsed: number, w: number) {
      const st = stateRef.current
      if (elapsed < 0.6 || elapsed > 5.5) return
      if (elapsed - st.lastSpawn < 0.05) return
      st.lastSpawn = elapsed
      const pi = Math.floor(Math.random() * conceptNodes.length)
      const ri = Math.floor(Math.random() * reviewerNodes.length)
      const str = reviewerNodes[ri].match_score / 100
      for (let k = 0; k < (Math.random() < 0.4 ? 2 : 1); k++) {
        st.particles.push({ pi, ri, str, t: Math.random()*0.08, speed: 0.18+Math.random()*0.22, r: (1.8+Math.random()*2.5)*dpr, color: COLORS[ri % COLORS.length], alpha: 0 })
      }
    }

    function frame(ts: number) {
      if (!startRef.current) startRef.current = ts
      const elapsed = (ts - startRef.current) / 1000
      const ctx = canvas!.getContext('2d')!
      const w = canvas!.width, h = canvas!.height, st = stateRef.current

      ctx.fillStyle = '#0a0f1e'; ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = 'rgba(255,255,255,.025)'; ctx.lineWidth = 1
      for (let x = 0; x < w; x += 44*dpr) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke() }
      for (let y = 0; y < h; y += 44*dpr) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke() }

      const pp = conceptNodes.map((_, i) => ({ x: 0.14*w, y: ((i+1)/(conceptNodes.length+1))*h }))
      const rp = reviewerNodes.map((_, i) => ({ x: 0.86*w, y: ((i+1)/(reviewerNodes.length+1))*h }))

      const laneA = Math.min(1, (elapsed-.4)*1.5)
      if (laneA > 0) {
        for (let pi = 0; pi < conceptNodes.length; pi++) {
          for (let ri = 0; ri < reviewerNodes.length; ri++) {
            const p = pp[pi], q = rp[ri]
            const str = reviewerNodes[ri].match_score / 100
            ctx.beginPath(); ctx.moveTo(p.x,p.y)
            ctx.bezierCurveTo(p.x+w*.22, p.y, q.x-w*.22, q.y, q.x, q.y)
            ctx.strokeStyle = COLORS[ri % COLORS.length]; ctx.lineWidth = str*1.5*dpr
            ctx.globalAlpha = laneA*str*0.1; ctx.stroke(); ctx.globalAlpha = 1
          }
        }
      }

      spawn(elapsed, w)
      const live: Particle[] = []
      st.particles.forEach(p => {
        p.t += p.speed*(1/60)
        if (p.t >= 1) { st.scores[p.ri] = Math.min(reviewerNodes[p.ri].match_score, st.scores[p.ri]+Math.ceil(Math.random()*2)); return }
        live.push(p)
        p.alpha = p.t<0.08?p.t/0.08:p.t>0.85?(1-p.t)/0.15:1
        const src=pp[p.pi], dst=rp[p.ri]
        const {x,y}=bez(p.t,src.x,src.y,src.x+w*.22,src.y,dst.x-w*.22,dst.y,dst.x,dst.y)
        const g=ctx.createRadialGradient(x,y,0,x,y,p.r*4)
        g.addColorStop(0,p.color+'cc'); g.addColorStop(.5,p.color+'55'); g.addColorStop(1,p.color+'00')
        ctx.globalAlpha=p.alpha*0.9; ctx.beginPath(); ctx.arc(x,y,p.r*4,0,Math.PI*2); ctx.fillStyle=g; ctx.fill()
        ctx.globalAlpha=p.alpha; ctx.beginPath(); ctx.arc(x,y,p.r,0,Math.PI*2); ctx.fillStyle='#fff'; ctx.fill(); ctx.globalAlpha=1
      })
      st.particles = live
      setDispScores([...st.scores])

      conceptNodes.forEach((n, i) => {
        const {x,y}=pp[i]; const a=Math.min(1,elapsed*2.5); const pulse=Math.sin(elapsed*2.2+i*1.1)*3*dpr
        const g=ctx.createRadialGradient(x,y,0,x,y,(24+pulse)*dpr)
        g.addColorStop(0,'rgba(34,211,238,.25)'); g.addColorStop(1,'rgba(34,211,238,0)')
        ctx.globalAlpha=a; ctx.beginPath(); ctx.arc(x,y,(24+pulse)*dpr,0,Math.PI*2); ctx.fillStyle=g; ctx.fill()
        ctx.beginPath(); ctx.arc(x,y,18*dpr,0,Math.PI*2); ctx.fillStyle='#0a0f1e'; ctx.fill()
        ctx.strokeStyle='rgba(34,211,238,.8)'; ctx.lineWidth=1.5*dpr; ctx.stroke(); ctx.globalAlpha=1
        ctx.globalAlpha=a; ctx.fillStyle='rgba(255,255,255,.9)'; ctx.font=`${8.5*dpr}px DM Sans,sans-serif`
        ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(n.tag.slice(0,14),x,y); ctx.globalAlpha=1
      })

      reviewerNodes.forEach((n, i) => {
        const {x,y}=rp[i]; const a=Math.min(1,Math.max(0,(elapsed-.3)*2)); const pulse=Math.sin(elapsed*1.8+i*.9)*4*dpr
        const color=COLORS[i%COLORS.length]; const scoreRatio=st.scores[i]/n.match_score
        const g=ctx.createRadialGradient(x,y,0,x,y,(40+pulse)*dpr)
        g.addColorStop(0,color+'44'); g.addColorStop(1,color+'00')
        ctx.globalAlpha=a; ctx.beginPath(); ctx.arc(x,y,(40+pulse)*dpr,0,Math.PI*2); ctx.fillStyle=g; ctx.fill()
        ctx.beginPath(); ctx.arc(x,y,26*dpr,0,Math.PI*2); ctx.fillStyle='#0a0f1e'; ctx.fill()
        ctx.strokeStyle=color; ctx.lineWidth=2*dpr; ctx.stroke(); ctx.globalAlpha=1
        if(scoreRatio>0){ ctx.beginPath(); ctx.arc(x,y,31*dpr,-Math.PI/2,-Math.PI/2+Math.PI*2*scoreRatio); ctx.strokeStyle=color; ctx.lineWidth=3.5*dpr; ctx.globalAlpha=a; ctx.stroke(); ctx.globalAlpha=1 }
        ctx.globalAlpha=a; ctx.fillStyle='rgba(255,255,255,.95)'; ctx.font=`bold ${8*dpr}px DM Sans,sans-serif`
        ctx.textAlign='center'; ctx.textBaseline='middle'
        ctx.fillText(n.reviewer.full_name.split(' ').pop()!.slice(0,10),x,y); ctx.globalAlpha=1
      })

      if (elapsed > .5) {
        const la = Math.min(1,(elapsed-.5)*2)
        ctx.globalAlpha=la*.4; ctx.fillStyle='#fff'; ctx.font=`${8*dpr}px DM Sans,sans-serif`; ctx.textBaseline='top'
        ctx.textAlign='left'; ctx.fillText('CONCEPTS',14*dpr,10*dpr)
        ctx.textAlign='right'; ctx.fillText('MATCHED REVIEWERS',w-14*dpr,10*dpr); ctx.globalAlpha=1
      }

      if (elapsed < 7 && !st.finished) {
        rafRef.current = requestAnimationFrame(frame)
      } else if (!st.finished) {
        st.finished = true
        setDispScores(reviewerNodes.map(n => n.match_score))
        setTimeout(() => setShowBtn(true), 400)
      }
    }

    return () => cancelAnimationFrame(rafRef.current)
  }, []) // eslint-disable-line

  return (
    <div className="flex flex-col h-full bg-[#0a0f1e]">
      <div className="px-6 py-4 border-b border-white/[0.07] flex items-center justify-between flex-shrink-0">
        <div>
          <div className="font-display text-lg font-bold text-white">Searching Researchers</div>
          <div className="text-xs text-white/40 mt-0.5">
            {animNodes.length > 0
              ? `Scoring ${animNodes.length} expert candidates from Semantic Scholar & OpenAlex`
              : 'Querying Semantic Scholar & OpenAlex for matching experts…'
            }
          </div>
        </div>
        {animNodes.length > 0 && (
          <div className="flex gap-5">
            {animNodes.slice(0, 5).map((n, i) => (
              <div key={i} className="text-center">
                <div className="text-xl font-bold tabular-nums transition-all duration-100" style={{ color: COLORS[i % COLORS.length] }}>
                  {dispScores[i] || 0}
                </div>
                <div className="text-[10px] text-white/30 mt-0.5">{n.reviewer.full_name.split(' ').pop()}</div>
              </div>
            ))}
          </div>
        )}
        {animNodes.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-white/40">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Searching live databases…
          </div>
        )}
      </div>
      <div className="flex-1 overflow-hidden min-h-0">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
      <div className="px-6 py-3.5 border-t border-white/[0.07] flex justify-end flex-shrink-0 min-h-[52px]">
        {showBtn && (
          <Button onClick={onDone} className="bg-cyan-500 hover:bg-cyan-400 text-white animate-in fade-in-0 slide-in-from-bottom-2">
            View Matched Reviewers →
          </Button>
        )}
      </div>
    </div>
  )
}
