import Link from 'next/link'

const stats = [
  { value: '4.6', unit: 'days', label: 'avg. turnaround' },
  { value: '$220', unit: '', label: 'reviewer payout' },
  { value: '94%', unit: '', label: 'satisfaction rate' },
  { value: '2,400+', unit: '', label: 'reviews completed' },
]

const steps = [
  {
    icon: '⬆️',
    title: 'Upload your manuscript',
    desc: 'PDF, DOCX, or LaTeX — we accept all major academic formats.',
    color: 'from-indigo-500 to-violet-500',
  },
  {
    icon: '🎯',
    title: 'AI matches reviewers',
    desc: 'Our semantic matching engine finds experts perfectly aligned with your research.',
    color: 'from-violet-500 to-purple-500',
  },
  {
    icon: '💬',
    title: 'Inline peer review',
    desc: 'Reviewers annotate directly in the document. Real-time discussion in context.',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: '✅',
    title: 'Revision-ready output',
    desc: 'Comments become action items. Your manuscript arrives at the journal polished.',
    color: 'from-emerald-500 to-teal-500',
  },
]

const features = [
  { icon: '🧠', title: 'Semantic Matching', desc: 'Mistral AI + OpenAlex extract concepts from your abstract and match you with the exact expert who reviewed similar work.' },
  { icon: '📄', title: 'Inline Commenting', desc: 'Pin comments to exact paragraphs. Threads stay in context, not a separate email chain.' },
  { icon: '💳', title: 'Transparent Pricing', desc: '$349 flat fee. Reviewer gets $220. No hidden costs, no bidding wars.' },
  { icon: '🔐', title: 'ORCID Verified', desc: 'Every reviewer has a verified ORCID profile. See their h-index, publications, and expertise tags.' },
  { icon: '⚡', title: 'Fast Turnaround', desc: 'Binding deadlines with payment held in escrow. Average 4.6 days from matching to completed review.' },
  { icon: '🌐', title: 'CrossRef & OpenAlex', desc: 'Journal metadata, DOI resolution, and citation graphs pulled live to find the right match.' },
]

const comparisons = [
  { name: 'Traditional Journals', paid: false, pre: false, inline: false, matched: false },
  { name: 'Editage / Enago', paid: false, pre: true, inline: false, matched: false },
  { name: 'Review Commons', paid: false, pre: true, inline: false, matched: false },
  { name: 'Publons / WoS', paid: false, pre: false, inline: false, matched: false },
  { name: 'Uknow ✦', paid: true, pre: true, inline: true, matched: true, highlight: true },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f4f4f8] overflow-x-hidden">

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 h-14 flex items-center justify-between px-6 md:px-10"
           style={{ background: 'rgba(244,244,248,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold"
               style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>U</div>
          <span className="font-display font-bold text-[#0d0d14] text-sm tracking-tight">Uknow</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[#6b6b80]">
          <a href="#how" className="hover:text-[#0d0d14] transition-colors">How it works</a>
          <a href="#features" className="hover:text-[#0d0d14] transition-colors">Features</a>
          <a href="#pricing" className="hover:text-[#0d0d14] transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="text-sm font-semibold text-[#6b6b80] hover:text-[#0d0d14] transition-colors px-3 py-1.5">
            Sign in
          </Link>
          <Link href="/register" className="text-sm font-semibold text-white px-4 py-2 rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-200"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] opacity-50"
               style={{ background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
          <div className="absolute top-20 left-[10%] w-72 h-72 rounded-full opacity-20 blur-3xl"
               style={{ background: '#6366f1' }} />
          <div className="absolute top-40 right-[10%] w-72 h-72 rounded-full opacity-15 blur-3xl"
               style={{ background: '#06b6d4' }} />
          {/* Floating orbs */}
          <div className="absolute top-48 left-[20%] w-3 h-3 rounded-full bg-indigo-400 opacity-60"
               style={{ animation: 'float 3s ease-in-out infinite' }} />
          <div className="absolute top-64 right-[25%] w-2 h-2 rounded-full bg-violet-400 opacity-60"
               style={{ animation: 'float 4s ease-in-out infinite 1s' }} />
          <div className="absolute top-96 left-[60%] w-2 h-2 rounded-full bg-cyan-400 opacity-60"
               style={{ animation: 'float 5s ease-in-out infinite 0.5s' }} />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-[#e2e2ec] rounded-full px-4 py-1.5 mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500" style={{ animation: 'pulse-ring 1.5s ease-out infinite' }} />
            <span className="text-xs font-semibold text-[#6b6b80]">Now in beta · 2,400+ reviews completed</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold text-[#0d0d14] leading-[1.05] tracking-tight mb-6">
            Peer review that
            <span className="block" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              works for you.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-[#6b6b80] max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Paid, matched, revision-ready expert review — before you hit submit.
            Better manuscripts reach journals faster.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Link href="/register?role=author"
                  className="group flex items-center gap-2 text-white font-bold text-sm px-7 py-3.5 rounded-2xl shadow-xl shadow-indigo-200/80 transition-all hover:shadow-indigo-300/80 hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              Submit your manuscript
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link href="/register?role=reviewer"
                  className="flex items-center gap-2 text-[#0d0d14] font-semibold text-sm px-7 py-3.5 rounded-2xl border border-[#e2e2ec] bg-white shadow-sm hover:shadow hover:border-[#c8c8d8] transition-all">
              Become a reviewer
              <span className="text-[#6b6b80]">→ earn $220/review</span>
            </Link>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-4 border border-[#e2e2ec] shadow-sm">
                <div className="font-display text-2xl font-bold text-[#0d0d14]">
                  {s.value}<span className="text-base text-[#6b6b80] font-semibold">{s.unit}</span>
                </div>
                <div className="text-xs text-[#9898b0] font-medium mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo preview card */}
      <section className="px-6 mb-24">
        <div className="max-w-5xl mx-auto bg-[#0d0d14] rounded-3xl p-6 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 opacity-30 blur-2xl"
               style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }} />
          <div className="relative flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-amber-500/60" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
            <div className="flex-1 mx-4 h-7 rounded-lg bg-white/5 flex items-center px-3">
              <span className="text-xs text-white/30">app.uknow.io/workspace/ms-2024-001</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white/80 text-sm">
            <div className="md:col-span-2 bg-white/5 rounded-2xl p-4 border border-white/8">
              <div className="text-xs text-white/40 mb-3 font-semibold uppercase tracking-wider">Manuscript · v1.2</div>
              <div className="space-y-2">
                <div className="h-3 bg-white/20 rounded-full w-3/4" />
                <div className="h-3 bg-white/12 rounded-full w-full" />
                <div className="h-3 bg-white/12 rounded-full w-5/6" />
                <div className="mt-4 relative">
                  <div className="h-3 bg-white/12 rounded-full w-full" />
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-[8px] font-bold">1</div>
                </div>
                <div className="h-3 bg-white/12 rounded-full w-4/5" />
                <div className="h-3 bg-white/8 rounded-full w-3/5" />
                <div className="mt-4 h-3 bg-white/12 rounded-full w-full" />
                <div className="h-3 bg-white/12 rounded-full w-2/3" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/8">
                <div className="text-xs text-white/40 mb-2 font-semibold uppercase tracking-wider">Reviewer</div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                       style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>AS</div>
                  <div>
                    <div className="font-semibold text-xs text-white">Dr. Adrian Safa</div>
                    <div className="text-[10px] text-white/40">h-index 14 · Yale</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-white/40">Match score</span>
                  <span className="text-emerald-400 font-bold">94%</span>
                </div>
                <div className="mt-1.5 h-1.5 bg-white/10 rounded-full">
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 w-[94%]" />
                </div>
              </div>
              <div className="bg-indigo-500/15 border border-indigo-500/25 rounded-2xl p-3">
                <div className="text-[10px] text-indigo-300 font-semibold uppercase tracking-wider mb-1">Comment #1</div>
                <div className="text-xs text-white/70">Clarify the sample size calculation in §2.3 — endpoint definition needs justification.</div>
                <div className="mt-2 flex gap-1">
                  <span className="text-[9px] bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full font-semibold">Methods</span>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-semibold">Action item</span>
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/8">
                <div className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-1">Payment</div>
                <div className="text-lg font-display font-bold text-white">$220 <span className="text-xs text-emerald-400 font-semibold">secured</span></div>
                <div className="text-[10px] text-white/40 mt-0.5">Released on completion</div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center">
            <Link href="/login"
                  className="text-xs text-white/40 hover:text-white/70 transition-colors font-medium underline underline-offset-2">
              Try the live demo →
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-[#6366f1] uppercase tracking-widest mb-3">How it works</p>
            <h2 className="font-display text-4xl font-bold text-[#0d0d14] tracking-tight">Four steps. Better manuscript.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {steps.map((step, i) => (
              <div key={step.title} className="relative bg-white rounded-2xl p-5 border border-[#e2e2ec] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                <div className="text-2xl mb-3">{step.icon}</div>
                <div className={`absolute top-5 right-5 w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center bg-gradient-to-br ${step.color}`}>
                  {i + 1}
                </div>
                <h3 className="font-display font-bold text-[#0d0d14] text-sm mb-2">{step.title}</h3>
                <p className="text-xs text-[#6b6b80] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-[#6366f1] uppercase tracking-widest mb-3">Features</p>
            <h2 className="font-display text-4xl font-bold text-[#0d0d14] tracking-tight">Everything the current system lacks.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((f) => (
              <div key={f.title} className="group bg-white rounded-2xl p-6 border border-[#e2e2ec] shadow-sm hover:shadow-lg hover:border-[#c8c8d8] hover:-translate-y-0.5 transition-all duration-200">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-display font-bold text-[#0d0d14] mb-2">{f.title}</h3>
                <p className="text-sm text-[#6b6b80] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-[#6366f1] uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="font-display text-4xl font-bold text-[#0d0d14] tracking-tight">One flat fee. No surprises.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { role: 'Author pays', amount: '$349', desc: 'Single review transaction', color: 'from-indigo-500 to-violet-500', note: 'Transparent, fixed' },
              { role: 'Reviewer receives', amount: '$220', desc: 'Guaranteed expert payment', color: 'from-emerald-500 to-teal-500', note: 'Paid on completion' },
              { role: 'Uknow share', amount: '$129', desc: 'Platform, matching, workflow', color: 'from-amber-500 to-orange-500', note: 'No hidden fees' },
            ].map((p) => (
              <div key={p.role} className="bg-white rounded-2xl p-6 border border-[#e2e2ec] shadow-sm text-center">
                <div className={`text-3xl font-display font-bold mb-1 bg-gradient-to-br ${p.color} bg-clip-text text-transparent`}>{p.amount}</div>
                <div className="font-semibold text-[#0d0d14] text-sm mb-1">{p.role}</div>
                <div className="text-xs text-[#9898b0]">{p.desc}</div>
                <div className="mt-3 text-[10px] font-semibold text-[#6366f1] bg-indigo-50 rounded-full px-3 py-1">{p.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-[#6366f1] uppercase tracking-widest mb-3">Positioning</p>
            <h2 className="font-display text-4xl font-bold text-[#0d0d14] tracking-tight">The missing layer.</h2>
          </div>
          <div className="bg-white rounded-2xl border border-[#e2e2ec] shadow-sm overflow-hidden">
            <div className="grid grid-cols-5 border-b border-[#e2e2ec]">
              <div className="p-4 text-xs font-bold text-[#6b6b80] uppercase tracking-wider">Platform</div>
              {['Paid reviewer', 'Pre-submission', 'Inline review', 'AI matching'].map(h => (
                <div key={h} className="p-4 text-xs font-bold text-[#6b6b80] uppercase tracking-wider text-center">{h}</div>
              ))}
            </div>
            {comparisons.map((c) => (
              <div key={c.name} className={`grid grid-cols-5 border-b border-[#f0f0f5] last:border-0 ${c.highlight ? 'bg-indigo-50' : ''}`}>
                <div className={`p-4 text-sm font-semibold ${c.highlight ? 'text-[#6366f1]' : 'text-[#0d0d14]'}`}>{c.name}</div>
                {[c.paid, c.pre, c.inline, c.matched].map((v, i) => (
                  <div key={i} className="p-4 flex items-center justify-center">
                    {v
                      ? <span className="text-emerald-500 text-base">✓</span>
                      : <span className="text-[#e2e2ec] text-base">✗</span>
                    }
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-32">
        <div className="max-w-2xl mx-auto text-center">
          <div className="relative bg-[#0d0d14] rounded-3xl p-10 overflow-hidden">
            <div className="absolute inset-0 opacity-40"
                 style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(99,102,241,0.4) 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(139,92,246,0.3) 0%, transparent 60%)' }} />
            <div className="relative">
              <h2 className="font-display text-4xl font-bold text-white mb-4 tracking-tight">
                Better manuscripts start here.
              </h2>
              <p className="text-white/60 mb-8 leading-relaxed">
                Join researchers who get expert review before journals see their work.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/register?role=author"
                      className="font-bold text-sm text-white px-6 py-3 rounded-2xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  Submit your manuscript →
                </Link>
                <Link href="/register?role=reviewer"
                      className="font-semibold text-sm text-white/70 bg-white/10 hover:bg-white/15 px-6 py-3 rounded-2xl transition-all border border-white/10">
                  Join as a reviewer
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 pb-10 border-t border-[#e2e2ec]">
        <div className="max-w-5xl mx-auto pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold"
                 style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>U</div>
            <span className="text-sm font-bold text-[#0d0d14]">Uknow</span>
          </div>
          <p className="text-xs text-[#9898b0]">© 2026 Uknow. Paid expert review, before journals see your work.</p>
          <div className="flex gap-5 text-xs text-[#9898b0]">
            <a href="#" className="hover:text-[#6b6b80] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#6b6b80] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#6b6b80] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
