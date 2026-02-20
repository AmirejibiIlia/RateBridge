import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import StatsCard from '../components/StatsCard'
import { getCompanies } from '../api/superadmin'
import type { CompanyStats } from '../types'

export default function SuperAdminPage() {
  const [companies, setCompanies] = useState<CompanyStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCompanies()
      .then(setCompanies)
      .finally(() => setLoading(false))
  }, [])

  const totalFeedback = companies.reduce((sum, c) => sum + c.total_feedback, 0)
  const totalCompanies = companies.length
  const globalAvg =
    companies.filter((c) => c.average_rating != null).length > 0
      ? companies.reduce((sum, c) => sum + (c.average_rating ?? 0), 0) /
        companies.filter((c) => c.average_rating != null).length
      : null

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Super Admin</h1>

        <div className="grid grid-cols-3 gap-4">
          <StatsCard title="Total Companies" value={totalCompanies} />
          <StatsCard title="Total Feedback" value={totalFeedback} />
          <StatsCard
            title="Global Average Rating"
            value={globalAvg != null ? globalAvg.toFixed(1) : '—'}
            subtitle="out of 10"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Slug</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Feedback</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Avg Rating</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">QR Codes</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Joined</th>
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
