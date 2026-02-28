import { useState, useEffect, FormEvent } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Layout from '../components/Layout'
import StatsCard from '../components/StatsCard'
import { useLanguage } from '../context/LanguageContext'
import {
  getCompanies,
  getGlobalTimeline,
  getPartnershipRequests,
  approvePartnershipRequest,
  deletePartnershipRequest,
} from '../api/superadmin'
import type { CompanyStats, PartnershipRequest } from '../types'

type Tab = 'overview' | 'requests'

export default function SuperAdminPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [companies, setCompanies] = useState<CompanyStats[]>([])
  const [timeline, setTimeline] = useState<{ date: string; count: number }[]>([])
  const [requests, setRequests] = useState<PartnershipRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [requestsLoading, setRequestsLoading] = useState(false)

  // Approve modal state
  const [approveTarget, setApproveTarget] = useState<PartnershipRequest | null>(null)
  const [approveEmail, setApproveEmail] = useState('')
  const [approvePassword, setApprovePassword] = useState('')
  const [approveError, setApproveError] = useState('')
  const [approveLoading, setApproveLoading] = useState(false)

  const { t } = useLanguage()

  useEffect(() => {
    Promise.all([getCompanies(), getGlobalTimeline()])
      .then(([c, tl]) => {
        setCompanies(c)
        setTimeline(tl)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (tab === 'requests') {
      setRequestsLoading(true)
      getPartnershipRequests()
        .then(setRequests)
        .finally(() => setRequestsLoading(false))
    }
  }, [tab])

  const totalFeedback = companies.reduce((sum, c) => sum + c.total_feedback, 0)
  const totalCompanies = companies.length
  const totalQRCodes = companies.reduce((sum, c) => sum + c.total_qr_codes, 0)
  const globalAvg =
    companies.filter((c) => c.average_rating != null).length > 0
      ? companies.reduce((sum, c) => sum + (c.average_rating ?? 0), 0) /
        companies.filter((c) => c.average_rating != null).length
      : null

  const todayLabel = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const todayCount = timeline.find((d) => d.date === todayLabel)?.count ?? 0

  const pendingCount = requests.filter((r) => r.status === 'pending').length

  const openApproveModal = (req: PartnershipRequest) => {
    setApproveTarget(req)
    setApproveEmail(req.email)
    setApprovePassword('')
    setApproveError('')
  }

  const handleApprove = async (e: FormEvent) => {
    e.preventDefault()
    if (!approveTarget) return
    setApproveError('')
    setApproveLoading(true)
    try {
      await approvePartnershipRequest(approveTarget.id, {
        email: approveEmail,
        password: approvePassword,
      })
      setRequests((prev) =>
        prev.map((r) => (r.id === approveTarget.id ? { ...r, status: 'approved' as const } : r))
      )
      setApproveTarget(null)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
      setApproveError(msg || 'Failed to register company.')
    } finally {
      setApproveLoading(false)
    }
  }

  const handleDelete = async (req: PartnershipRequest) => {
    if (!confirm(`Delete request from ${req.company_name}?`)) return
    await deletePartnershipRequest(req.id)
    setRequests((prev) => prev.filter((r) => r.id !== req.id))
  }

  const statusBadge = (status: PartnershipRequest['status']) => {
    const map = {
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-500',
    }
    return (
      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${map[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{t('superAdmin')}</h1>
          {/* Tab switcher */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setTab('overview')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === 'overview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setTab('requests')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                tab === 'requests' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Partnership Requests
              {pendingCount > 0 && (
                <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {tab === 'overview' && (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard title={t('totalCompanies')} value={totalCompanies} />
              <StatsCard title={t('totalFeedback')} value={totalFeedback} />
              <StatsCard title="Total QR Codes" value={totalQRCodes} />
              <StatsCard
                title={t('globalAvgRating')}
                value={globalAvg != null ? globalAvg.toFixed(1) : '—'}
                subtitle={t('outOf10')}
              />
            </div>

            {/* Daily feedback chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-semibold text-gray-700">Platform Feedback — Last 30 Days</h3>
                  <p className="text-sm text-gray-400 mt-0.5">All companies combined</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{todayCount}</p>
                  <p className="text-xs text-gray-400">today</p>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-600" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={timeline} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      tickLine={false}
                      axisLine={false}
                      interval={4}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                      labelStyle={{ fontWeight: 600, color: '#374151' }}
                      formatter={(v: number) => [v, 'Feedbacks']}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#blueGrad)"
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Companies table */}
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('company')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('slug')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('feedback')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('avgRating')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('qrCodes')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('joined')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {companies.map((c) => (
                      <tr key={c.company.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{c.company.name}</td>
                        <td className="px-4 py-3 text-gray-500">{c.company.slug}</td>
                        <td className="px-4 py-3 text-gray-700">{c.total_feedback}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {c.average_rating != null ? c.average_rating.toFixed(1) : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {c.active_qr_codes} / {c.total_qr_codes}
                        </td>
                        <td className="px-4 py-3 text-gray-400">
                          {new Date(c.company.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === 'requests' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            {requestsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <svg className="w-10 h-10 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <p className="text-sm font-medium">No partnership requests yet</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Submitted</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{req.company_name}</td>
                      <td className="px-4 py-3 text-gray-600">{req.email}</td>
                      <td className="px-4 py-3 text-gray-600">{req.phone}</td>
                      <td className="px-4 py-3">{statusBadge(req.status)}</td>
                      <td className="px-4 py-3 text-gray-400">
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {req.status === 'pending' && (
                            <button
                              onClick={() => openApproveModal(req)}
                              className="text-xs font-semibold px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Register
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(req)}
                            className="text-xs font-semibold px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Approve / Register modal */}
      {approveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Register Company</h2>
            <p className="text-sm text-gray-500 mb-6">
              Creating account for <span className="font-semibold text-gray-700">{approveTarget.company_name}</span>.
              Set the login credentials the company will use.
            </p>
            <form onSubmit={handleApprove} className="space-y-4">
              {approveError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {approveError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Login Email</label>
                <input
                  type="email"
                  value={approveEmail}
                  onChange={(e) => setApproveEmail(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="company@example.com"
                />
                <p className="text-xs text-gray-400 mt-1">Pre-filled from the request, edit if needed.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={approvePassword}
                  onChange={(e) => setApprovePassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Min 8 characters"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setApproveTarget(null)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={approveLoading}
                  className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
                >
                  {approveLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
