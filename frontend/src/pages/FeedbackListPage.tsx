import { useState, useEffect, useCallback } from 'react'
import Layout from '../components/Layout'
import { useLanguage } from '../context/LanguageContext'
import { getFeedback } from '../api/company'
import type { Feedback } from '../types'

const RATING_COLORS: Record<number, string> = {
  1: 'text-red-600', 2: 'text-red-500', 3: 'text-orange-500', 4: 'text-orange-400',
  5: 'text-yellow-500', 6: 'text-yellow-400', 7: 'text-lime-600', 8: 'text-green-500',
  9: 'text-green-600', 10: 'text-emerald-600',
}

export default function FeedbackListPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const { t } = useLanguage()

  const PAGE_SIZE = 20

  const load = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const data = await getFeedback(p, PAGE_SIZE)
      if (p === 1) {
        setFeedbacks(data)
      } else {
        setFeedbacks((prev) => [...prev, ...data])
      }
      setHasMore(data.length === PAGE_SIZE)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(1)
  }, [load])

  const handleLoadMore = () => {
    const next = page + 1
    setPage(next)
    load(next)
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('allFeedback')}</h1>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {feedbacks.length === 0 && !loading ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg">{t('noFeedbackYet')}</p>
              <p className="text-sm mt-1">{t('shareQRCodes')}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('rating')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('comment')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {feedbacks.map((fb) => (
                  <tr key={fb.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`text-xl font-bold ${RATING_COLORS[fb.rating] ?? 'text-gray-700'}`}>
                        {fb.rating}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs">
                      {fb.comment || <span className="text-gray-300 italic">{t('noComment')}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {new Date(fb.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        {!loading && hasMore && (
          <div className="flex justify-center">
            <button
              onClick={handleLoadMore}
              className="px-6 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              {t('loadMore')}
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}
