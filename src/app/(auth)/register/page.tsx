'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

function RegisterForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [role, setRole] = useState<'author' | 'reviewer'>(
    params.get('role') === 'reviewer' ? 'reviewer' : 'author'
  )
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    institution: '',
    field: '',
  })
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          role,
          institution: form.institution,
          field: form.field,
        },
      },
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    toast.success('Account created! Redirecting…')
    router.push(role === 'reviewer' ? '/reviewer/dashboard' : '/author/dashboard')
  }

  const authorPerks = ['AI-powered reviewer matching', 'Inline commenting on PDFs', 'Checklist-driven review', 'Real-time reviewer chat']
  const reviewerPerks = ['$220 per completed review', 'Matched to your expertise', '5-day delivery window', 'Build your academic reputation']

  return (
    <div className="min-h-screen flex bg-[#f4f4f8]">
      {/* Left visual */}
      <div className="hidden lg:flex lg:w-[45%] flex-col relative overflow-hidden" style={{ background: '#0d0d14' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] opacity-25 blur-3xl rounded-full"
               style={{ background: role === 'author' ? '#6366f1' : '#06b6d4' }} />
          <div className="absolute bottom-20 right-0 w-64 h-64 opacity-20 blur-3xl rounded-full"
               style={{ background: role === 'author' ? '#8b5cf6' : '#6366f1' }} />
        </div>
        <div className="relative flex flex-col h-full p-12 justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                 style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>U</div>
            <span className="font-display font-bold text-white text-base">Uknow</span>
          </div>
          <div>
            <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-6">
              {role === 'author' ? 'For authors' : 'For reviewers'}
            </p>
            <h2 className="font-display text-3xl font-bold text-white leading-tight mb-8">
              {role === 'author'
                ? 'Get revision-ready feedback before you submit.'
                : 'Get paid for your expert knowledge.'}
            </h2>
            <div className="space-y-4">
              {(role === 'author' ? authorPerks : reviewerPerks).map((item, i) => (
                <div key={item} className="flex items-center gap-3"
                     style={{ animation: `fadeUp 0.4s ${i * 0.06}s both` }}>
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0"
                       style={{ background: role === 'author' ? 'rgba(99,102,241,0.3)' : 'rgba(6,182,212,0.3)' }}>
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm text-white/70 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-white/20">© 2026 Uknow · Pre-submission peer review</p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                 style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>U</div>
            <span className="font-display font-bold text-[#0d0d14] text-base">Uknow</span>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-[#0d0d14] tracking-tight mb-2">Create your account</h1>
            <p className="text-[#6b6b80] text-sm">Join the pre-submission peer review platform.</p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-7">
            {[
              {
                id: 'author',
                label: 'Author',
                desc: 'Submit for review',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                gradient: 'from-indigo-500 to-violet-500',
              },
              {
                id: 'reviewer',
                label: 'Reviewer',
                desc: 'Review & earn $220',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                ),
                gradient: 'from-cyan-500 to-blue-500',
              },
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setRole(r.id as 'author' | 'reviewer')}
                className={cn(
                  'p-4 rounded-2xl border-2 text-left transition-all duration-150',
                  role === r.id
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-[#e2e2ec] bg-white hover:border-[#c8c8d8]'
                )}
              >
                <div className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 text-white',
                  `bg-gradient-to-br ${r.gradient}`,
                  role !== r.id && 'opacity-50'
                )}>
                  {r.icon}
                </div>
                <div className={cn('text-sm font-bold', role === r.id ? 'text-[#0d0d14]' : 'text-[#6b6b80]')}>{r.label}</div>
                <div className="text-xs text-[#9898b0] mt-0.5">{r.desc}</div>
              </button>
            ))}
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label="Full name"
              type="text"
              value={form.fullName}
              onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
              placeholder="Dr. Ada Lovelace"
              prefix={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
              required
            />
            <Input
              label="Institutional email"
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="you@university.edu"
              prefix={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Institution"
                type="text"
                value={form.institution}
                onChange={e => setForm(p => ({ ...p, institution: e.target.value }))}
                placeholder="Harvard University"
              />
              <Input
                label="Research field"
                type="text"
                value={form.field}
                onChange={e => setForm(p => ({ ...p, field: e.target.value }))}
                placeholder="e.g. Oncology"
              />
            </div>
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              placeholder="min. 8 characters"
              prefix={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
              required
            />
            <Button type="submit" fullWidth size="lg" variant="gradient" loading={loading}>
              Create account
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Button>
          </form>

          <p className="mt-4 text-center text-[10px] text-[#9898b0]">
            By creating an account you agree to our{' '}
            <a href="#" className="underline hover:text-[#6b6b80]">Terms</a> and{' '}
            <a href="#" className="underline hover:text-[#6b6b80]">Privacy Policy</a>.
          </p>

          <p className="mt-4 text-center text-sm text-[#9898b0]">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-[#0d0d14] hover:text-[#6366f1] transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f4f4f8] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-500"
             style={{ animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
