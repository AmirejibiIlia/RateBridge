import { useState, useEffect, useCallback, KeyboardEvent } from 'react'
import Layout from '../components/Layout'
import { useLanguage } from '../context/LanguageContext'
import { getFeedback, generateFeedbackSummary } from '../api/company'
import type { Feedback } from '../types'

const RATING_COLORS: Record<number, string> = {
  1: 'text-red-600', 2: 'text-red-500', 3: 'text-orange-500', 4: 'text-orange-400',
  5: 'text-yellow-500', 6: 'text-yellow-400', 7: 'text-lime-600', 8: 'text-green-500',
  9: 'text-green-600', 10: 'text-emerald-600',
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function monthAgo() {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return d.toISOString().slice(0, 10)
}

export default function FeedbackListPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const { t } = useLanguage()

  // AI Summary state
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [dateFrom, setDateFrom] = useState(monthAgo())
  const [dateTo, setDateTo] = useState(today())
  const [categoryInput, setCategoryInput] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryResult, setSummaryResult] = useState<{ summary: string; feedback_count: number } | null>(null)
  const [summaryError, setSummaryError] = useState('')

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

  const addCategory = () => {
    const val = categoryInput.trim()
    if (val && !categories.includes(val)) {
      setCategories((prev) => [...prev, val])
    }
    setCategoryInput('')
  }

  const handleCategoryKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addCategory()
    }
  }

  const removeCategory = (cat: string) => {
    setCategories((prev) => prev.filter((c) => c !== cat))
  }

  const handleGenerateSummary = async () => {
    if (categories.length === 0) return
    setSummaryLoading(true)
    setSummaryError('')
    setSummaryResult(null)
    try {
      const result = await generateFeedbackSummary(dateFrom, dateTo, categories)
      setSummaryResult(result)
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to generate summary.'
      setSummaryError(msg)
    } finally {
      setSummaryLoading(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{t('allFeedback')}</h1>
          <button
            onClick={() => { setSummaryOpen((v) => !v); setSummaryResult(null); setSummaryError('') }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-all shadow-sm"
          >
            <span>✨</span>
            {t('aiSummary')}
          </button>
        </div>

        {/* AI Summary Panel */}
        {summaryOpen && (
          <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-violet-800 uppercase tracking-wide">✨ {t('aiSummary')}</h2>

            {/* Date range */}
            <div className="flex flex-wrap gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('dateFrom')}</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('dateTo')}</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                />
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('categoriesLabel')}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  onKeyDown={handleCategoryKeyDown}
                  placeholder={t('categoriesPlaceholder')}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                />
                <button
                  onClick={addCategory}
                  className="px-3 py-1.5 text-sm bg-white border border-violet-300 text-violet-700 rounded-lg hover:bg-violet-50 font-medium"
                >
                  +
                </button>
              </div>
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {categories.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-100 text-violet-800 text-xs font-medium rounded-full"
                    >
                      {cat}
                      <button onClick={() => removeCategory(cat)} className="hover:text-violet-600 ml-0.5">×</button>
                    </span>
                  ))}
                  <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                    + Other
                  </span>
                </div>
              )}
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerateSummary}
              disabled={summaryLoading || categories.length === 0}
              className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-sm"
            >
              {summaryLoading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  {t('generating')}
                </span>
              ) : t('generateSummary')}
            </button>

            {/* Error */}
            {summaryError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                {summaryError}
              </div>
            )}

            {/* Result */}
            {summaryResult && (
              <div className="bg-white border border-violet-200 rounded-xl p-5 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-violet-800">{t('summaryTitle')}</h3>
                  <span className="text-xs text-gray-400">{summaryResult.feedback_count} entries analysed</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{summaryResult.summary}</p>
              </div>
            )}
          </div>
        )}

        {/* Feedback table */}
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('qrName')}</th>
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
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {fb.qr_label || <span className="text-gray-300">—</span>}
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
