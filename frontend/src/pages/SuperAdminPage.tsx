import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Layout from '../components/Layout'
import StatsCard from '../components/StatsCard'
import { useLanguage } from '../context/LanguageContext'
import { getCompanies, getGlobalTimeline } from '../api/superadmin'
import type { CompanyStats } from '../types'

export default function SuperAdminPage() {
  const [companies, setCompanies] = useState<CompanyStats[]>([])
  const [timeline, setTimeline] = useState<{ date: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()

  useEffect(() => {
    Promise.all([getCompanies(), getGlobalTimeline()])
      .then(([c, tl]) => {
        setCompanies(c)
        setTimeline(tl)
      })
      .finally(() => setLoading(false))
  }, [])

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

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('superAdmin')}</h1>

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
      </div>
    </Layout>
  )
}
