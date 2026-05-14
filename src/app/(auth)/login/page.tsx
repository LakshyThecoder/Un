'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import toast from 'react-hot-toast'

const DEMO_ACCOUNTS = [
  { label: 'Author Demo', email: 'author@demo.uknow.io', password: 'Demo1234!', role: 'author', name: 'Dr. Adrian Safa', color: 'from-indigo-500 to-violet-500' },
  { label: 'Reviewer Demo', email: 'reviewer@demo.uknow.io', password: 'Demo1234!', role: 'reviewer', name: 'Dr. Filippo Colella', color: 'from-cyan-500 to-blue-500' },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeDemo, setActiveDemo] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()
    router.push(profile?.role === 'reviewer' ? '/reviewer/dashboard' : '/author/dashboard')
  }

  function fillDemo(d: typeof DEMO_ACCOUNTS[0]) {
    setEmail(d.email)
    setPassword(d.password)
    setActiveDemo(d.label)
  }

  return (
    <div className="min-h-screen flex bg-[#f4f4f8]">
      {/* Left visual panel */}
      <div className="hidden lg:flex lg:w-[45%] flex-col relative overflow-hidden" style={{ background: '#0d0d14' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-30 blur-3xl rounded-full"
               style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }} />
          <div className="absolute bottom-0 right-0 w-80 h-80 opacity-20 blur-3xl rounded-full"
               style={{ background: '#06b6d4' }} />
        </div>

        <div className="relative flex flex-col h-full p-12 justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                 style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>U</div>
            <span className="font-display font-bold text-white text-base">Uknow</span>
          </div>

          <div>
            <div className="mb-8">
              <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-6">What researchers say</p>
              <blockquote className="font-display text-2xl font-bold text-white leading-tight mb-6">
                "Got more actionable feedback in 4 days than from 6 months of traditional review."
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                     style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>AS</div>
                <div>
                  <div className="text-sm font-semibold text-white">Dr. Adrian Safa</div>
                  <div className="text-xs text-white/40">Incoming Resident, Yale · Mayo Clinic Postdoc</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[['4.6d', 'turnaround'], ['$220', 'reviewer pay'], ['94%', 'satisfaction']].map(([v, l]) => (
                <div key={l} className="bg-white/5 rounded-2xl p-4 border border-white/8">
                  <div className="font-display text-2xl font-bold text-white">{v}</div>
                  <div className="text-xs text-white/40 mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-white/20">© 2026 Uknow · Pre-submission peer review</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                 style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>U</div>
            <span className="font-display font-bold text-[#0d0d14] text-base">Uknow</span>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-[#0d0d14] tracking-tight mb-2">Welcome back</h1>
            <p className="text-[#6b6b80] text-sm">Sign in to your account to continue.</p>
          </div>

          {/* Demo accounts */}
          <div className="mb-6 p-4 bg-white rounded-2xl border border-[#e2e2ec] shadow-sm">
            <p className="text-xs font-bold text-[#6b6b80] uppercase tracking-wider mb-3">Try a demo account</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map(d => (
                <button
                  key={d.label}
                  onClick={() => fillDemo(d)}
                  className={`text-left p-3 rounded-xl border-2 transition-all ${
                    activeDemo === d.label
                      ? 'border-indigo-400 bg-indigo-50'
                      : 'border-[#e2e2ec] bg-[#f4f4f8] hover:border-[#c8c8d8]'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg mb-2 flex items-center justify-center text-white text-[10px] font-bold bg-gradient-to-br ${d.color}`}>
                    {d.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="text-xs font-bold text-[#0d0d14]">{d.label}</div>
                  <div className="text-[10px] text-[#9898b0] mt-0.5">{d.role}</div>
                </button>
              ))}
            </div>
            {activeDemo && (
              <p className="text-[10px] text-indigo-500 font-semibold mt-2.5 text-center">
                ✓ Credentials filled — click Sign in to proceed
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-[#e2e2ec]" />
            <span className="text-xs text-[#9898b0] font-medium">or sign in manually</span>
            <div className="h-px flex-1 bg-[#e2e2ec]" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setActiveDemo(null) }}
              placeholder="you@institution.edu"
              prefix={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setActiveDemo(null) }}
              placeholder="••••••••"
              prefix={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
              required
            />
            <div className="flex justify-end">
              <a href="#" className="text-xs text-[#9898b0] hover:text-[#6b6b80] transition-colors font-medium">
                Forgot password?
              </a>
            </div>
            <Button type="submit" fullWidth size="lg" variant="gradient" loading={loading}>
              Sign in
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[#9898b0]">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-bold text-[#0d0d14] hover:text-[#6366f1] transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
