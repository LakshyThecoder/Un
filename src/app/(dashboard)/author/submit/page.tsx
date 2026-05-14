'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Topbar } from '@/components/shared/topbar'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { AlgorithmCanvas } from '@/components/matching/algorithm-canvas'
import { ReviewerCard } from '@/components/matching/reviewer-card'
import { SemanticConcept } from '@/types'
import { cn, formatBytes } from '@/lib/utils'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { Upload, FileText, X, CheckCircle, ArrowRight, Zap } from 'lucide-react'
import { EnrichedMatch } from '@/lib/apis/matching'

type Phase = 'upload' | 'details' | 'extracting' | 'matching' | 'results'

const FIELDS = [
  'Biology', 'Chemistry', 'Computer Science', 'Economics', 'Environmental Science',
  'Medicine', 'Neuroscience', 'Physics', 'Psychology', 'Public Health',
  'Sociology', 'Statistics', 'Other'
]

const METHODOLOGIES = [
  'Randomized Controlled Trial', 'Systematic Review / Meta-Analysis', 'Cohort Study',
  'Case-Control Study', 'Cross-Sectional Study', 'Qualitative Research',
  'Computational / Simulation', 'Machine Learning', 'Experimental', 'Survey / Questionnaire',
  'Literature Review', 'Mixed Methods', 'Other'
]

interface ResearchForm {
  // Basic
  title: string
  target_journal: string
  field: string
  // The core text the system reads
  abstract: string
  research_questions: string
  key_contributions: string
  keywords: string
  methodology: string
  // Extra context
  background: string
  limitations: string
}

export default function SubmitPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('upload')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [manuscriptId, setManuscriptId] = useState<string | null>(null)
  const [concepts, setConcepts] = useState<SemanticConcept[]>([])
  const [shownConcepts, setShownConcepts] = useState(0)
  const [matches, setMatches] = useState<EnrichedMatch[]>([])
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set())
  const [form, setForm] = useState<ResearchForm>({
    title: '',
    target_journal: '',
    field: '',
    abstract: '',
    research_questions: '',
    key_contributions: '',
    keywords: '',
    methodology: '',
    background: '',
    limitations: '',
  })

  const set = (k: keyof ResearchForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const onDrop = useCallback((accepted: File[]) => {
    if (!accepted.length) return
    const file = accepted[0]
    setUploadedFile(file)
    if (!form.title) {
      const name = file.name.replace(/\.[^/.]+$/, '').replace(/[_\-]/g, ' ')
      setForm(p => ({ ...p, title: name }))
    }
  }, [form.title])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.tex', '.txt'],
    },
    maxSize: 50 * 1024 * 1024,
    multiple: false,
  })

  async function handleUploadFile() {
    if (!uploadedFile) return
    setUploading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not authenticated'); setUploading(false); return }

    try {
      const ext = uploadedFile.name.split('.').pop() || 'pdf'
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('manuscripts')
        .upload(path, uploadedFile, { upsert: false })

      if (uploadErr) { toast.error(`Storage: ${uploadErr.message}`); setUploading(false); return }
      const { data: { publicUrl } } = supabase.storage.from('manuscripts').getPublicUrl(path)
      setFileUrl(publicUrl)
      setPhase('details')
    } catch (err: unknown) {
      toast.error(`Upload failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmitDetails() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not authenticated'); return }

    const ext = uploadedFile?.name.split('.').pop() || 'pdf'
    const { data: ms, error: msErr } = await supabase
      .from('manuscripts')
      .insert({
        author_id: user.id,
        title: form.title || uploadedFile?.name.replace(/\.[^/.]+$/, '') || 'Untitled',
        abstract: form.abstract || null,
        target_journal: form.target_journal || null,
        field: form.field || null,
        file_url: fileUrl,
        file_name: uploadedFile?.name,
        file_type: ext,
        status: 'submitted',
        progress: 10,
        word_count: uploadedFile ? Math.round(uploadedFile.size / 5) : null,
        special_instructions: [
          form.research_questions && `Research Questions: ${form.research_questions}`,
          form.key_contributions && `Key Contributions: ${form.key_contributions}`,
          form.methodology && `Methodology: ${form.methodology}`,
          form.keywords && `Keywords: ${form.keywords}`,
          form.background && `Background: ${form.background}`,
          form.limitations && `Limitations: ${form.limitations}`,
        ].filter(Boolean).join('\n\n'),
      })
      .select()
      .single()

    if (msErr) { toast.error(`Database error: ${msErr.message}`); return }
    setManuscriptId(ms.id)

    // Insert file record (non-fatal)
    if (fileUrl && uploadedFile) {
      await supabase.from('manuscript_files').insert({
        manuscript_id: ms.id,
        name: uploadedFile.name,
        type: ext,
        url: fileUrl,
        size: uploadedFile.size,
        is_primary: true,
      }).then(({ error }) => error && console.warn('file record:', error))
    }

    // Kick off PDF→HTML conversion in background (non-blocking)
    if (fileUrl && (ext === 'pdf' || ext === 'PDF')) {
      fetch('/api/convert-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_url: fileUrl, manuscript_id: ms.id, author_id: user.id }),
      }).then(r => r.json()).then(d => {
        if (d.html_url) console.log('[submit] PDF converted to HTML:', d.html_url)
        else console.warn('[submit] PDF conversion:', d.error)
      }).catch(e => console.warn('[submit] PDF conversion error:', e))
    }

    handleExtract(ms.id)
  }

  async function handleExtract(msId?: string) {
    setPhase('extracting')
    const fullText = [
      form.title,
      form.abstract,
      form.research_questions,
      form.key_contributions,
      form.background,
      form.keywords,
      form.methodology,
    ].filter(Boolean).join(' ')

    try {
      const res = await fetch('/api/external/openalex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: fullText,
          field: form.field,
          title: form.title,
          abstract: form.abstract,
        }),
      })
      const data = await res.json()
      const extracted: SemanticConcept[] = data.concepts || []
      setConcepts(extracted)
      extracted.forEach((_, i) => setTimeout(() => setShownConcepts(n => n + 1), i * 160 + 400))
      setTimeout(() => {
        setPhase('matching')
        fetchMatches(extracted, msId || manuscriptId || undefined)
      }, extracted.length * 160 + 1600)
    } catch {
      toast.error('Extraction failed')
      setPhase('details')
    }
  }

  async function fetchMatches(extractedConcepts: SemanticConcept[], msId?: string) {
    try {
      const res = await fetch('/api/matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concepts: extractedConcepts,
          field: form.field,
          title: form.title,
          abstract: form.abstract,
          keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean),
          methodology: form.methodology,
          manuscriptId: msId,
        }),
      })
      const data = await res.json()
      setMatches(data.matches || [])
      setPhase('results')
    } catch {
      toast.error('Matching failed — try again')
      setPhase('results')
    }
  }

  async function handleInvite(reviewerId: string) {
    setInvitedIds(p => new Set([...p, reviewerId]))
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!manuscriptId || !user) return

    const match = matches.find(m => m.reviewer.id === reviewerId)
    await supabase.from('reviewer_invitations').insert({
      manuscript_id: manuscriptId,
      reviewer_id: reviewerId.startsWith('ss_') || reviewerId.startsWith('oa_') ? null : reviewerId,
      semantic_scholar_id: reviewerId.startsWith('ss_') ? reviewerId.replace('ss_', '') : null,
      match_score: match?.match_score,
      status: 'sent',
    })

    await supabase.from('manuscripts')
      .update({ status: 'matched', progress: 30 })
      .eq('id', manuscriptId)

    toast.success('Invitation noted — find their contact via the profile link.')
  }

  const phases = ['upload', 'details', 'extracting', 'results']
  const phaseLabels = ['Upload', 'Details', 'Extracting', 'Results']
  const currentIdx = phases.indexOf(phase === 'matching' ? 'extracting' : phase)

  if (phase === 'matching') {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <AlgorithmCanvas
          concepts={concepts}
          matches={[]}
          onDone={() => setPhase('results')}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Submit Manuscript" subtitle="Fill in your research details — no AI reading the PDF needed." />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {phaseLabels.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                i < currentIdx ? 'bg-emerald-500 text-white' : i === currentIdx ? 'text-white' : 'bg-[#e8e8f0] text-[#9898b0]'
              )} style={i === currentIdx ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : {}}>
                {i < currentIdx ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : i + 1}
              </div>
              <span className={cn('text-xs font-semibold', i === currentIdx ? 'text-[#0d0d14]' : 'text-[#9898b0]')}>{s}</span>
              {i < phaseLabels.length - 1 && <div className={cn('w-6 h-px', i < currentIdx ? 'bg-emerald-400' : 'bg-[#e2e2ec]')} />}
            </div>
          ))}
        </div>

        {/* ── PHASE: Upload ── */}
        {phase === 'upload' && (
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold text-[#0d0d14] mb-1">Upload your manuscript</h2>
            <p className="text-sm text-[#6b6b80] mb-6">PDF, DOCX, LaTeX or plain text — up to 50MB. You'll fill in the details on the next screen.</p>

            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all duration-200 mb-6',
                isDragActive ? 'border-indigo-400 bg-indigo-50' : uploadedFile ? 'border-emerald-400 bg-emerald-50' : 'border-[#e2e2ec] hover:border-indigo-400 hover:bg-indigo-50/20 bg-white'
              )}
            >
              <input {...getInputProps()} />
              {uploadedFile ? (
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-3">
                    <FileText className="w-7 h-7 text-emerald-600" />
                  </div>
                  <div className="font-bold text-[#0d0d14] mb-1">{uploadedFile.name}</div>
                  <div className="text-sm text-[#9898b0]">{formatBytes(uploadedFile.size)}</div>
                  <button onClick={e => { e.stopPropagation(); setUploadedFile(null) }}
                          className="mt-3 text-xs text-[#9898b0] hover:text-red-500 flex items-center gap-1 transition-colors">
                    <X className="w-3 h-3" /> Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl mb-4 flex items-center justify-center"
                       style={{ background: 'linear-gradient(135deg, #f0f0f5, #e8e8f0)' }}>
                    <Upload className="w-6 h-6 text-[#9898b0]" />
                  </div>
                  <div className="font-bold text-[#0d0d14] mb-1">
                    {isDragActive ? 'Drop to upload' : 'Drop your manuscript here'}
                  </div>
                  <div className="text-sm text-[#9898b0]">or click to browse · PDF, DOCX, LaTeX · 50 MB max</div>
                </div>
              )}
            </div>

            <Button variant="gradient" size="lg" disabled={!uploadedFile} loading={uploading} onClick={handleUploadFile}>
              Continue to Research Details <ArrowRight className="w-4 h-4" />
            </Button>

            <p className="mt-3 text-xs text-[#9898b0]">
              The PDF is stored securely. We don&apos;t use AI to read it — instead you describe your research in the next step, which gives much better reviewer matches.
            </p>
          </div>
        )}

        {/* ── PHASE: Research Details ── */}
        {phase === 'details' && (
          <div className="max-w-3xl">
            <h2 className="font-display text-2xl font-bold text-[#0d0d14] mb-1">Describe your research</h2>
            <p className="text-sm text-[#6b6b80] mb-8">
              The text you write here is what our system uses to find the best-matched reviewers online — the more detail, the better.
            </p>

            <div className="space-y-8">
              {/* Section 1: Basic info */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-lg text-white flex items-center justify-center text-xs font-bold"
                       style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>1</div>
                  <h3 className="font-display font-bold text-[#0d0d14]">Basic Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-white rounded-2xl border border-[#e2e2ec] p-5 shadow-sm">
                  <div className="col-span-2">
                    <Input label="Research / Manuscript Title *" value={form.title} onChange={set('title')}
                           placeholder="e.g. Mortality outcomes following early vs. late ICU admission in sepsis patients" required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#6b6b80] uppercase tracking-wider block mb-2">Research Field *</label>
                    <div className="flex flex-wrap gap-2">
                      {FIELDS.map(f => (
                        <button key={f} type="button" onClick={() => setForm(p => ({ ...p, field: f }))}
                                className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                                  form.field === f ? 'text-white border-transparent' : 'bg-white text-[#6b6b80] border-[#e2e2ec] hover:border-indigo-300')}
                                style={form.field === f ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : {}}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input label="Target Journal" value={form.target_journal} onChange={set('target_journal')}
                         placeholder="e.g. JAMA Internal Medicine" />
                </div>
              </div>

              {/* Section 2: Abstract */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-lg text-white flex items-center justify-center text-xs font-bold"
                       style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>2</div>
                  <h3 className="font-display font-bold text-[#0d0d14]">Abstract / Summary</h3>
                </div>
                <div className="bg-white rounded-2xl border border-[#e2e2ec] p-5 shadow-sm">
                  <Textarea label="Abstract *" value={form.abstract} onChange={set('abstract')} rows={6}
                            placeholder="Paste your full abstract here. This is the single most important field for finding the right reviewers — it directly drives our semantic matching." />
                  <p className="text-[10px] text-[#9898b0] mt-2">
                    💡 Tip: A detailed abstract with methods, outcomes, and study design produces much better reviewer matches than a short one.
                  </p>
                </div>
              </div>

              {/* Section 3: Research Questions + Contributions */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-lg text-white flex items-center justify-center text-xs font-bold"
                       style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>3</div>
                  <h3 className="font-display font-bold text-[#0d0d14]">Research Substance</h3>
                </div>
                <div className="bg-white rounded-2xl border border-[#e2e2ec] p-5 shadow-sm space-y-4">
                  <Textarea label="Research Questions / Aims" value={form.research_questions} onChange={set('research_questions')} rows={3}
                            placeholder="What specific questions does this research answer? e.g. Does early ICU admission (< 6h) reduce 30-day mortality compared to standard care?" />
                  <Textarea label="Key Contributions / Novel Findings" value={form.key_contributions} onChange={set('key_contributions')} rows={3}
                            placeholder="What is new about this work? What does it add to the existing literature?" />
                </div>
              </div>

              {/* Section 4: Methodology + Keywords */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-lg text-white flex items-center justify-center text-xs font-bold"
                       style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>4</div>
                  <h3 className="font-display font-bold text-[#0d0d14]">Methodology & Keywords</h3>
                </div>
                <div className="bg-white rounded-2xl border border-[#e2e2ec] p-5 shadow-sm space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[#6b6b80] uppercase tracking-wider block mb-2">Methodology</label>
                    <div className="flex flex-wrap gap-2">
                      {METHODOLOGIES.map(m => (
                        <button key={m} type="button" onClick={() => setForm(p => ({ ...p, methodology: m }))}
                                className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                                  form.methodology === m ? 'text-white border-transparent' : 'bg-white text-[#6b6b80] border-[#e2e2ec] hover:border-indigo-300')}
                                style={form.methodology === m ? { background: 'linear-gradient(135deg, #06b6d4, #6366f1)' } : {}}>
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input label="Keywords (comma-separated)" value={form.keywords} onChange={set('keywords')}
                         placeholder="e.g. sepsis, ICU, mortality, early intervention, critical care, SOFA score"
                         hint="These keywords are sent directly to Semantic Scholar and OpenAlex to find researchers who published on exactly these topics." />
                </div>
              </div>

              {/* Section 5: Optional context */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-lg text-white flex items-center justify-center text-xs font-bold"
                       style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>5</div>
                  <h3 className="font-display font-bold text-[#0d0d14]">Additional Context <span className="text-[#9898b0] font-normal text-sm">(optional)</span></h3>
                </div>
                <div className="bg-white rounded-2xl border border-[#e2e2ec] p-5 shadow-sm space-y-4">
                  <Textarea label="Background / Rationale" value={form.background} onChange={set('background')} rows={3}
                            placeholder="Why is this research needed? What gap does it fill?" />
                  <Textarea label="Limitations / Reviewer Focus Areas" value={form.limitations} onChange={set('limitations')} rows={2}
                            placeholder="e.g. Small sample size, single-center study, please focus on statistical methodology." />
                </div>
              </div>

              {/* Pricing reminder */}
              <div className="flex items-center gap-5 bg-white rounded-2xl border border-[#e2e2ec] p-5 shadow-sm">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0"
                     style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-[#0d0d14] text-sm">Within 5 business days · $349 fixed fee</div>
                  <div className="text-xs text-[#9898b0] mt-0.5">Reviewer gets $220. Platform fee $129. No hidden costs.</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-display text-3xl font-bold text-[#0d0d14]">$349</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button variant="outline" onClick={() => setPhase('upload')}>← Back</Button>
              <Button variant="gradient" size="lg"
                      disabled={!form.title || !form.abstract}
                      onClick={handleSubmitDetails}>
                Find Matching Researchers <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <p className="mt-2 text-xs text-[#9898b0]">Title and Abstract are required · everything else improves match quality</p>
          </div>
        )}

        {/* ── PHASE: Extracting ── */}
        {phase === 'extracting' && (
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold text-[#0d0d14] mb-1">Extracting Concepts</h2>
            <p className="text-sm text-[#6b6b80] mb-6">
              Reading your research description — identifying key topics, methods, and domain vocabulary to search for experts.
            </p>

            <div className="bg-white rounded-2xl border border-[#e2e2ec] mb-6 overflow-hidden shadow-sm">
              <div className="bg-[#f4f4f8] px-4 py-2.5 border-b border-[#e2e2ec] flex items-center gap-2">
                <div className={cn('w-2 h-2 rounded-full transition-colors',
                  shownConcepts >= concepts.length && concepts.length > 0 ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
                )} />
                <span className="text-xs font-semibold text-[#6b6b80]">
                  {shownConcepts >= concepts.length && concepts.length > 0
                    ? `Found ${concepts.length} concepts — now searching Semantic Scholar & OpenAlex…`
                    : 'Analyzing your research description…'
                  }
                </span>
              </div>
              <div className="p-4 flex flex-wrap gap-2.5 min-h-[100px]">
                {concepts.slice(0, shownConcepts).map((c, i) => (
                  <div key={i} className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold',
                    c.category === 'core' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                    c.category === 'method' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                    c.category === 'data' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                  )}>
                    <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0',
                      c.category === 'core' ? 'bg-indigo-500' :
                      c.category === 'method' ? 'bg-violet-500' :
                      c.category === 'data' ? 'bg-amber-500' : 'bg-emerald-500'
                    )} />
                    {c.tag}
                    <span className="text-[10px] opacity-50">{Math.round(c.confidence * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-[#9898b0]">
              {[['indigo', 'Core topic'], ['violet', 'Method'], ['amber', 'Data'], ['emerald', 'Variable']].map(([color, label]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full bg-${color}-500`} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PHASE: Results ── */}
        {phase === 'results' && (
          <div className="max-w-2xl">
            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold text-[#0d0d14] mb-1">
                {matches.length} Researchers Found
              </h2>
              <p className="text-sm text-[#6b6b80]">
                Matched to <strong className="text-[#6366f1]">{form.title}</strong> via Semantic Scholar and OpenAlex.
                Click profile links to view their full publication history, then invite them to review.
              </p>
            </div>

            {matches.length > 0 ? (
              <>
                <div className="mb-4">
                  <ReviewerCard match={matches[0]} rank={1} onInvite={handleInvite} invited={invitedIds.has(matches[0].reviewer.id)} />
                </div>

                {matches.length > 1 && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-xs font-bold text-[#9898b0] uppercase tracking-wider">Also well-matched</div>
                      <div className="flex-1 h-px bg-[#e2e2ec]" />
                    </div>
                    <div className="space-y-3">
                      {matches.slice(1).map(m => (
                        <ReviewerCard key={m.reviewer.id} match={m} compact onInvite={handleInvite} invited={invitedIds.has(m.reviewer.id)} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-[#e2e2ec] p-12 text-center">
                <div className="text-3xl mb-4">🔍</div>
                <div className="font-display font-bold text-[#0d0d14] mb-2">No matches found</div>
                <p className="text-sm text-[#9898b0] mb-4">Try adding more specific keywords or a different field.</p>
                <Button variant="outline" onClick={() => setPhase('details')}>← Edit Research Details</Button>
              </div>
            )}

            {invitedIds.size > 0 && (
              <div className="mt-8 p-5 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-emerald-800 text-sm">
                    {invitedIds.size} researcher{invitedIds.size > 1 ? 's' : ''} invited
                  </span>
                </div>
                <p className="text-xs text-emerald-600 mb-3">
                  Use the profile links (Semantic Scholar / ORCID) to find their contact email and reach out directly. Your manuscript is saved in the dashboard.
                </p>
                <Button variant="gradient" size="sm" onClick={() => router.push('/author/dashboard')}>
                  Go to Dashboard →
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
