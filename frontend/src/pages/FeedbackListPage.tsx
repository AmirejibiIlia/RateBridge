import { useState, useEffect, useCallback } from 'react'
import * as XLSX from 'xlsx'
import Layout from '../components/Layout'
import { useLanguage } from '../context/LanguageContext'
import { getFeedback, getQRCodes } from '../api/company'
import type { FeedbackFilters } from '../api/company'
import type { Feedback, QRCode } from '../types'

const RATING_COLORS: Record<number, string> = {
  1: 'text-red-600', 2: 'text-red-500', 3: 'text-orange-500', 4: 'text-orange-400',
  5: 'text-yellow-500', 6: 'text-yellow-400', 7: 'text-lime-600', 8: 'text-green-500',
  9: 'text-green-600', 10: 'text-emerald-600',
}

const PAGE_SIZE = 20

type SortCol = 'date' | 'rating'
type SortDir = 'asc' | 'desc'

function SortIcon({ active, dir }: { col: SortCol; active: boolean; dir: SortDir }) {
  return (
    <span className={`inline-flex flex-col ml-1 leading-none ${active ? 'text-blue-600' : 'text-gray-300'}`}>
      <svg className={`w-2.5 h-2.5 -mb-0.5 ${active && dir === 'asc' ? 'text-blue-600' : ''}`} viewBox="0 0 10 6" fill="currentColor">
        <path d="M5 0L10 6H0z" />
      </svg>
      <svg className={`w-2.5 h-2.5 ${active && dir === 'desc' ? 'text-blue-600' : ''}`} viewBox="0 0 10 6" fill="currentColor">
        <path d="M5 6L0 0H10z" />
      </svg>
    </span>
  )
}

export default function FeedbackListPage() {
  const { t } = useLanguage()

  // QR codes for dropdown
  const [qrCodes, setQrCodes] = useState<QRCode[]>([])

  // Filter state
  const [qrId, setQrId] = useState('')
  const [ratingMin, setRatingMin] = useState(1)
  const [ratingMax, setRatingMax] = useState(10)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [hasComment, setHasComment] = useState<'' | 'true' | 'false'>('')

  // Sort state
  const [sortBy, setSortBy] = useState<SortCol>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // Data state
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    getQRCodes().then(setQrCodes).catch(() => {})
  }, [])

  const buildFilters = useCallback(
    (p: number): FeedbackFilters => ({
      page: p,
      page_size: PAGE_SIZE,
      ...(qrId ? { qr_id: qrId } : {}),
      rating_min: ratingMin,
      rating_max: ratingMax,
      ...(dateFrom ? { date_from: dateFrom } : {}),
      ...(dateTo ? { date_to: dateTo } : {}),
      ...(hasComment !== '' ? { has_comment: hasComment === 'true' } : {}),
      sort_by: sortBy,
      sort_dir: sortDir,
    }),
    [qrId, ratingMin, ratingMax, dateFrom, dateTo, hasComment, sortBy, sortDir]
  )

  const load = useCallback(
    async (p: number) => {
      setLoading(true)
      try {
        const { items, total: t } = await getFeedback(buildFilters(p))
        setFeedbacks(items)
        setTotal(t)
        setPage(p)
      } finally {
        setLoading(false)
      }
    },
    [buildFilters]
  )

  // Reset to page 1 whenever filters/sort change
  useEffect(() => {
    load(1)
  }, [load])

  const handleSort = (col: SortCol) => {
    if (sortBy === col) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortBy(col)
      setSortDir('desc')
    }
  }

  const resetFilters = () => {
    setQrId('')
    setRatingMin(1)
    setRatingMax(10)
    setDateFrom('')
    setDateTo('')
    setHasComment('')
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const { items } = await getFeedback({ ...buildFilters(1), page: 1, page_size: 5000 })
      const rows = items.map((fb) => ({
        Rating: fb.rating,
        'QR Name': fb.qr_label ?? '',
        Comment: fb.comment ?? '',
        Date: new Date(fb.created_at).toLocaleString(),
      }))
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Feedback')
      const date = new Date().toISOString().slice(0, 10)
      XLSX.writeFile(wb, `feedback-${date}.xlsx`)
    } finally {
      setExporting(false)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const isFiltered =
    qrId !== '' || ratingMin !== 1 || ratingMax !== 10 || dateFrom !== '' || dateTo !== '' || hasComment !== ''

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{t('allFeedback')}</h1>
            {!loading && (
              <span className="text-sm text-gray-400 font-medium">
                {total} {total === 1 ? 'entry' : 'entries'}
              </span>
            )}
          </div>
          <button
            onClick={handleExport}
            disabled={exporting || total === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {exporting ? (
              <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            Export Excel
          </button>
        </div>

        {/* Filter bar */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex flex-wrap gap-3 items-end">
            {/* QR filter */}
            <div className="min-w-[160px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">QR Code</label>
              <select
                value={qrId}
                onChange={(e) => setQrId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">All QR Codes</option>
                {qrCodes.map((q) => (
                  <option key={q.id} value={q.id}>{q.label}</option>
                ))}
              </select>
            </div>

            {/* Rating range */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Rating</label>
              <div className="flex items-center gap-1.5">
                <select
                  value={ratingMin}
                  onChange={(e) => setRatingMin(Number(e.target.value))}
                  className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-16"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                    <option key={n} value={n} disabled={n > ratingMax}>{n}</option>
                  ))}
                </select>
                <span className="text-gray-400 text-xs">–</span>
                <select
                  value={ratingMax}
                  onChange={(e) => setRatingMax(Number(e.target.value))}
                  className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-16"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                    <option key={n} value={n} disabled={n < ratingMin}>{n}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date range */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* Has comment */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Comment</label>
              <select
                value={hasComment}
                onChange={(e) => setHasComment(e.target.value as '' | 'true' | 'false')}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">All</option>
                <option value="true">With comment</option>
                <option value="false">No comment</option>
              </select>
            </div>

            {/* Clear */}
            {isFiltered && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-600" />
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-base font-medium">{t('noFeedbackYet')}</p>
              {isFiltered && (
                <button onClick={resetFilters} className="mt-3 text-sm text-blue-600 hover:underline">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none hover:text-gray-800 transition-colors"
                    onClick={() => handleSort('rating')}
                  >
                    <span className="flex items-center">
                      {t('rating')}
                      <SortIcon col="rating" active={sortBy === 'rating'} dir={sortDir} />
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('qrName')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('comment')}</th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none hover:text-gray-800 transition-colors"
                    onClick={() => handleSort('date')}
                  >
                    <span className="flex items-center">
                      {t('date')}
                      <SortIcon col="date" active={sortBy === 'date'} dir={sortDir} />
                    </span>
                  </th>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Page {page} of {totalPages} · {total} results
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => load(1)}
                disabled={page === 1 || loading}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                title="First page"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => load(page - 1)}
                disabled={page === 1 || loading}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Page number pills */}
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                const p = start + i
                return (
                  <button
                    key={p}
                    onClick={() => load(p)}
                    disabled={loading}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      p === page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                )
              })}

              <button
                onClick={() => load(page + 1)}
                disabled={page === totalPages || loading}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => load(totalPages)}
                disabled={page === totalPages || loading}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                title="Last page"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
