import { useState, FormEvent, useRef } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { submitPartnershipRequest } from '../api/partnership'

/* ─── tiny helpers ────────────────────────────────────────── */
function RatingBadge({ v }: { v: number }) {
  const color = v >= 8 ? 'text-green-600' : v >= 6 ? 'text-amber-500' : 'text-red-500'
  return <span className={`font-bold tabular-nums ${color}`}>{v.toFixed(1)}</span>
}

function StatusChip({ s }: { s: 'resolved' | 'in_progress' | 'backlog' | 'rejected' }) {
  const map = {
    resolved: 'bg-green-100 text-green-700',
    in_progress: 'bg-blue-100 text-blue-700',
    backlog: 'bg-gray-100 text-gray-500',
    rejected: 'bg-red-100 text-red-500',
  }
  const label = {
    resolved: 'Resolved',
    in_progress: 'In Progress',
    backlog: 'Backlog',
    rejected: 'Rejected',
  }
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${map[s]}`}>
      {label[s]}
    </span>
  )
}

/* ─── mock panels ─────────────────────────────────────────── */
function MockWindow({ title, children, accent = 'bg-blue-500' }: {
  title: string; children: React.ReactNode; accent?: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 shadow-md overflow-hidden bg-white flex flex-col">
      {/* title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 flex justify-center">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
            <span className={`w-2 h-2 rounded-full ${accent}`} />
            {title}
          </span>
        </div>
      </div>
      <div className="flex-1 p-4">{children}</div>
    </div>
  )
}

function MockDashboard() {
  const bars = [
    { label: 'Bar & Lounge', rating: 8.7, total: 94 },
    { label: 'Reception', rating: 7.9, total: 71 },
    { label: 'Restaurant', rating: 7.2, total: 58 },
    { label: 'Restrooms', rating: 5.4, total: 25 },
  ]
  return (
    <MockWindow title="Dashboard" accent="bg-blue-500">
      {/* KPI row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Responses', value: '248' },
          { label: 'Avg Rating', value: '7.4' },
          { label: 'Active QRs', value: '6' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-50 rounded-lg p-2 text-center border border-gray-100">
            <p className="text-sm font-bold text-gray-900">{value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Mini bar chart */}
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Last 7 days</p>
      <div className="flex items-end gap-1 mb-4" style={{ height: 56 }}>
        {[3, 7, 5, 12, 9, 15, 11].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t"
            style={{
              height: `${Math.round((h / 15) * 56)}px`,
              background: `hsl(${Math.round(120 * (h / 15))}, 55%, 48%)`,
            }}
          />
        ))}
      </div>

      {/* Leaderboard */}
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">QR Performance</p>
      <div className="space-y-1.5">
        {bars.map(({ label, rating, total }) => (
          <div key={label} className="flex items-center gap-2">
            <RatingBadge v={rating} />
            <span className="flex-1 text-xs text-gray-700 truncate">{label}</span>
            <span className="text-[10px] text-gray-400">{total}</span>
          </div>
        ))}
      </div>
    </MockWindow>
  )
}

function MockAI() {
  return (
    <MockWindow title="AI Summary" accent="bg-purple-500">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] font-semibold text-gray-500">This week</p>
          <p className="text-[10px] text-gray-400">48 responses analysed</p>
        </div>
        <span className="text-xs text-purple-600 font-semibold">✨ Generated</span>
      </div>
      {[
        {
          header: 'STRENGTHS',
          bullets: ['Speed of service praised in 18 reviews', 'Staff friendliness mentioned positively', 'Cleanliness scores improved vs last week'],
          color: 'border-green-200 bg-green-50/50',
          hdr: 'text-green-700',
        },
        {
          header: 'TO IMPROVE',
          bullets: ['Wait times mentioned negatively 12×', 'Noise level flagged by bar guests', 'Checkout queue cited at peak hours'],
          color: 'border-red-200 bg-red-50/50',
          hdr: 'text-red-600',
        },
      ].map(({ header, bullets, color, hdr }) => (
        <div key={header} className={`rounded-lg border px-3 py-2.5 mb-2 ${color}`}>
          <p className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${hdr}`}>{header}</p>
          <ul className="space-y-1">
            {bullets.map((b) => (
              <li key={b} className="flex gap-1.5 text-[11px] text-gray-700">
                <span className="text-gray-300 shrink-0">–</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </MockWindow>
  )
}

function MockTasks() {
  const tasks: { title: string; status: 'resolved' | 'in_progress' | 'backlog' }[] = [
    { title: 'Fix wait time at main counter', status: 'in_progress' },
    { title: 'Staff briefing on hygiene standards', status: 'resolved' },
    { title: 'Add signage for restroom directions', status: 'resolved' },
    { title: 'Review bar noise complaints', status: 'backlog' },
    { title: 'Update peak-hour staffing', status: 'in_progress' },
  ]

  return (
    <MockWindow title="Manage Tasks" accent="bg-green-500">
      {/* Status summary row */}
      <div className="grid grid-cols-3 gap-1.5 mb-4">
        {[
          { label: 'Backlog', count: 1, color: 'bg-gray-100 text-gray-600' },
          { label: 'In Progress', count: 2, color: 'bg-blue-100 text-blue-700' },
          { label: 'Resolved', count: 2, color: 'bg-green-100 text-green-700' },
        ].map(({ label, count, color }) => (
          <div key={label} className={`rounded-lg p-2 text-center ${color}`}>
            <p className="text-sm font-bold">{count}</p>
            <p className="text-[10px] font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Resolution rate bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
          <span className="font-semibold">Resolution Rate</span>
          <span className="font-bold text-green-600">60%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full" style={{ width: '60%' }} />
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {tasks.map(({ title, status }) => (
          <div key={title} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              status === 'resolved' ? 'bg-green-500' :
              status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'
            }`} />
            <span className="flex-1 text-xs text-gray-700 truncate">{title}</span>
            <StatusChip s={status} />
          </div>
        ))}
      </div>
    </MockWindow>
  )
}

/* ─── main page ───────────────────────────────────────────── */
export default function LandingPage() {
  const { user, loading: authLoading } = useAuth()
  const { lang, setLang, t } = useLanguage()
  const formRef = useRef<HTMLDivElement>(null)

  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

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
      await submitPartnershipRequest({ company_name: companyName, email, phone })
      setSubmitted(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
      setError(msg || 'Failed to submit request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const steps = [
    {
      step: '01',
      title: t('landingStep1Title'),
      desc: t('landingStep1Desc'),
      color: 'bg-blue-50',
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
        </svg>
      ),
    },
    {
      step: '02',
      title: t('landingStep2Title'),
      desc: t('landingStep2Desc'),
      color: 'bg-indigo-50',
      icon: (
        <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3h3m-3 3h3" />
        </svg>
      ),
    },
    {
      step: '03',
      title: t('landingStep3Title'),
      desc: t('landingStep3Desc'),
      color: 'bg-purple-50',
      icon: (
        <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
    },
    {
      step: '04',
      title: t('landingStep4Title'),
      desc: t('landingStep4Desc'),
      color: 'bg-green-50',
      icon: (
        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ]

  const pillars = [
    {
      name: t('landingP1Name'),
      sub: t('landingP1Sub'),
      color: 'border-blue-200 bg-blue-50/40',
      accent: 'text-blue-700',
      dot: 'bg-blue-500',
      bullets: [t('landingP1B1'), t('landingP1B2'), t('landingP1B3'), t('landingP1B4')],
    },
    {
      name: t('landingP2Name'),
      sub: t('landingP2Sub'),
      color: 'border-purple-200 bg-purple-50/40',
      accent: 'text-purple-700',
      dot: 'bg-purple-500',
      bullets: [t('landingP2B1'), t('landingP2B2'), t('landingP2B3'), t('landingP2B4')],
    },
    {
      name: t('landingP3Name'),
      sub: t('landingP3Sub'),
      color: 'border-green-200 bg-green-50/40',
      accent: 'text-green-700',
      dot: 'bg-green-500',
      bullets: [t('landingP3B1'), t('landingP3B2'), t('landingP3B3'), t('landingP3B4')],
    },
  ]

  return (
    <div className="min-h-screen bg-white">

      {/* Sticky header */}
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="RateBridge" className="w-8 h-8 rounded-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span className="font-bold text-gray-900 text-lg">RateBridge</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide">
              <button
                onClick={() => setLang('en')}
                className={lang === 'en' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600 transition-colors'}
              >
                EN
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setLang('de')}
                className={lang === 'de' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600 transition-colors'}
              >
                DE
              </button>
            </div>
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              {t('landingSignIn')}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-36 pb-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full mb-8">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block" />
            {t('landingBadge')}
          </div>
          <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-5">
            {t('landingHeroTitle')}
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t('landingHeroSubtitle')}
          </p>
          <button
            onClick={scrollToForm}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-base shadow-sm"
          >
            {t('landingCTA')}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </section>

      {/* Problem section */}
      <section className="py-14 px-6 bg-amber-50 border-y border-amber-100">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-3">{t('landingProblemTitle')}</p>
          <p className="text-base text-gray-700 leading-relaxed">{t('landingProblemText')}</p>
        </div>
      </section>

      {/* Product preview */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white mb-3">{t('landingPreviewTitle')}</h2>
            <p className="text-gray-400 text-base max-w-xl mx-auto">{t('landingPreviewSub')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <MockDashboard />
            <MockAI />
            <MockTasks />
          </div>
          <p className="text-center text-xs text-gray-500 mt-5">Sample data for illustration purposes</p>
        </div>
      </section>

      {/* How it works — 4 steps */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('landingHowTitle')}</h2>
            <p className="text-gray-500 text-base">{t('landingHowSubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            {steps.map(({ step, icon, title, desc, color }, idx) => (
              <div key={step} className="relative flex flex-col">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 flex-1 relative">
                  <div className="absolute top-4 right-4 text-xs font-bold text-gray-200">{step}</div>
                  <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center mb-4`}>
                    {icon}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
                {idx < steps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 items-center justify-center">
                    <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            {t('landingHowTitle')}
          </div>
        </div>
      </section>

      {/* Three pillars */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('landingWhyTitle')}</h2>
            <p className="text-gray-500 text-base">{t('landingWhySubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pillars.map(({ name, sub, color, accent, dot, bullets }) => (
              <div key={name} className={`rounded-2xl border p-7 ${color}`}>
                <div className="mb-5">
                  <span className={`text-xl font-extrabold ${accent}`}>{name}</span>
                  <p className="text-xs text-gray-500 font-medium mt-1">{sub}</p>
                </div>
                <ul className="space-y-2.5">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5">
                      <span className={`w-1.5 h-1.5 ${dot} rounded-full mt-1.5 shrink-0`} />
                      <span className="text-sm text-gray-700 leading-snug">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partnership request form */}
      <section ref={formRef} className="py-24 px-6 bg-gray-50">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('landingFormTitle')}</h2>
            <p className="text-gray-500 text-sm leading-relaxed">{t('landingFormSubtitle')}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            {submitted ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Request Submitted!</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Thank you for your interest. Our team will review your request and get back to you with your login credentials.
                </p>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('companyName')}</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors mt-2"
                  >
                    {loading ? 'Submitting...' : 'Request Partnership'}
                  </button>
                </form>
                <p className="text-center text-sm text-gray-500 mt-6">
                  {t('landingAlreadyPartner')}{' '}
                  <Link to="/login" className="text-blue-600 hover:underline font-medium">
                    {t('signIn')}
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center border-t border-gray-100">
        <p className="text-xs text-gray-400">{t('landingFooter')}</p>
      </footer>

    </div>
  )
}
