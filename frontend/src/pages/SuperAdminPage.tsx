import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import StatsCard from '../components/StatsCard'
import { useLanguage } from '../context/LanguageContext'
import { getCompanies } from '../api/superadmin'
import type { CompanyStats } from '../types'

export default function SuperAdminPage() {
  const [companies, setCompanies] = useState<CompanyStats[]>([])
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()

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
        <h1 className="text-2xl font-bold text-gray-900">{t('superAdmin')}</h1>

        <div className="grid grid-cols-3 gap-4">
          <StatsCard title={t('totalCompanies')} value={totalCompanies} />
          <StatsCard title={t('totalFeedback')} value={totalFeedback} />
          <StatsCard
            title={t('globalAvgRating')}
            value={globalAvg != null ? globalAvg.toFixed(1) : '—'}
            subtitle={t('outOf10')}
          />
        </div>

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
