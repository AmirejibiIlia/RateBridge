import { useState, FormEvent, useRef } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { register } from '../api/auth'

export default function LandingPage() {
  const { user, loading: authLoading, login: authLogin } = useAuth()
  const navigate = useNavigate()
  const formRef = useRef<HTMLDivElement>(null)

  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Wait for auth to resolve before deciding to redirect
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-blue-600" />
      </div>
    )
  }

  if (user) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await register(companyName, email, password)
      await authLogin(data.access_token)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
      setError(msg || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Sticky header */}
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="RateBridge" className="w-8 h-8 rounded-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span className="font-bold text-gray-900 text-lg">RateBridge</span>
          </div>
          <Link
            to="/login"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Sign In →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-36 pb-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full mb-8">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block" />
            Now accepting new partners
          </div>
          <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-5">
            Turn customer moments<br />into business insights
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Place a QR code at any touchpoint. Customers rate in 10 seconds — no app, no login.
            You get live analytics, trends, and AI-generated summaries.
          </p>
          <button
            onClick={scrollToForm}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-base shadow-sm"
          >
            Request Partnership
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">How it works</h2>
            <p className="text-gray-500 text-base">Three steps from setup to insight.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: (
                  <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                  </svg>
                ),
                title: 'Generate a QR code',
                desc: 'Create QR codes for each location, table, or service point. Label them anything you like and manage them from your dashboard.',
              },
              {
                step: '02',
                icon: (
                  <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3h3m-3 3h3" />
                  </svg>
                ),
                title: 'Customer scans & rates',
                desc: 'Customer scans with their phone camera. No app download, no account. They tap 1–10 and optionally leave a comment — done in 10 seconds.',
              },
              {
                step: '03',
                icon: (
                  <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                ),
                title: 'See the data instantly',
                desc: 'Live dashboard with rating trends, per-location breakdowns, top & worst feedback highlights, and AI-generated category summaries.',
              },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="bg-white rounded-2xl border border-gray-200 p-7 relative">
                <div className="absolute top-6 right-6 text-sm font-bold text-gray-200">{step}</div>
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-5">
                  {icon}
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Why businesses choose RateBridge</h2>
            <p className="text-gray-500 text-base">Everything you need to understand what customers actually think.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: '⚡',
                title: 'Zero friction',
                desc: 'No app, no login, no personal info required. Customers complete feedback in under 10 seconds, so response rates stay high.',
              },
              {
                icon: '📍',
                title: 'Per-location insights',
                desc: 'See which stations, rooms, or products perform best and worst — not just a single company-wide average.',
              },
              {
                icon: '🤖',
                title: 'AI-powered summaries',
                desc: 'Generate category-by-category breakdowns of your feedback using Groq AI for any date range you choose.',
              },
              {
                icon: '📈',
                title: 'Real-time trends',
                desc: 'Daily and weekly charts update the moment a customer submits. Spot problems before they become patterns.',
              },
              {
                icon: '🔒',
                title: 'Privacy first',
                desc: 'Customers are fully anonymous. Only a hashed IP is stored for spam prevention — never linked to identity.',
              },
              {
                icon: '🌍',
                title: 'Multi-language',
                desc: 'Full English and German UI support out of the box, with more languages coming soon.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-5 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                <span className="text-2xl shrink-0 mt-0.5">{icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1.5">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration / Partnership form */}
      <section ref={formRef} className="py-24 px-6 bg-gray-50">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Partnership</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Create your company account and start collecting real customer feedback today.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Min. 8 characters"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors mt-2"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-6">
              Already a partner?{' '}
              <Link to="/login" className="text-blue-600 hover:underline font-medium">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center border-t border-gray-100">
        <p className="text-xs text-gray-400">© 2025 RateBridge. All rights reserved.</p>
      </footer>

    </div>
  )
}
