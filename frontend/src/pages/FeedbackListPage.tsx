import { useState, useEffect, useCallback } from 'react'
import * as XLSX from 'xlsx'
import Layout from '../components/Layout'
import { useLanguage } from '../context/LanguageContext'
import { getFeedback, getQRCodes } from '../api/company'
import type { FeedbackFilters } from '../api/company'
import type { Feedback, QRCode } from '../types'

const RATING_BG: Record<number, string> = {
  1: 'bg-red-100 text-red-700', 2: 'bg-red-100 text-red-600',
  3: 'bg-orange-100 text-orange-600', 4: 'bg-orange-100 text-orange-500',
  5: 'bg-yellow-100 text-yellow-600', 6: 'bg-yellow-100 text-yellow-500',
  7: 'bg-lime-100 text-lime-700', 8: 'bg-green-100 text-green-600',
  9: 'bg-green-100 text-green-700', 10: 'bg-emerald-100 text-emerald-700',
}

const PAGE_SIZE = 25

type SortCol = 'date' | 'rating'
type SortDir = 'asc' | 'desc'

export default function FeedbackListPage() {
  const { t } = useLanguage()
  const [qrCodes, setQrCodes] = useState<QRCode[]>([])

  // Filters
  const [qrId, setQrId] = useState('')
  const [ratingMin, setRatingMin] = useState(1)
  const [ratingMax, setRatingMax] = useState(10)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [hasComment, setHasComment] = useState<'' | 'true' | 'false'>('')

  // Sort
  const [sortBy, setSortBy] = useState<SortCol>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // Data
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

  useEffect(() => { load(1) }, [load])

  const handleSort = (col: SortCol) => {
    if (sortBy === col) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    else { setSortBy(col); setSortDir('desc') }
  }

  const resetFilters = () => {
    setQrId(''); setRatingMin(1); setRatingMax(10)
    setDateFrom(''); setDateTo(''); setHasComment('')
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
      XLSX.writeFile(wb, `feedback-${new Date().toISOString().slice(0, 10)}.xlsx`)
    } finally {
      setExporting(false)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const isFiltered = qrId !== '' || ratingMin !== 1 || ratingMax !== 10 || dateFrom !== '' || dateTo !== '' || hasComment !== ''

  const SortBtn = ({ col, label }: { col: SortCol; label: string }) => (
    <button
      onClick={() => handleSort(col)}
      className="flex items-center gap-1 group select-none"
    >
      <span>{label}</span>
      <span className="flex flex-col gap-px">
        <svg className={`w-2 h-2 ${sortBy === col && sortDir === 'asc' ? 'text-blue-600' : 'text-gray-300 group-hover:text-gray-400'}`} viewBox="0 0 8 5" fill="currentColor">
          <path d="M4 0L8 5H0z" />
        </svg>
        <svg className={`w-2 h-2 ${sortBy === col && sortDir === 'desc' ? 'text-blue-600' : 'text-gray-300 group-hover:text-gray-400'}`} viewBox="0 0 8 5" fill="currentColor">
          <path d="M4 5L0 0H8z" />
        </svg>
      </span>
    </button>
  )

  return (
    <Layout>
      <div className="space-y-5">

        {/* Header row */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('allFeedback')}</h1>
            {!loading && (
              <p className="text-sm text-gray-400 mt-0.5">{total} {total === 1 ? t('feedbackEntry') : t('feedbackEntries')}{isFiltered ? ` ${t('feedbackMatchingFilters')}` : ''}</p>
            )}
          </div>
          <button
            onClick={handleExport}
            disabled={exporting || total === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-40 transition-colors shadow-sm shrink-0"
          >
            {exporting
              ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            }
            {t('feedbackExportExcel')}
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* QR Code */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('feedbackQrCode')}</label>
              <select
                value={qrId}
                onChange={(e) => setQrId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">{t('feedbackAllLocations')}</option>
                {qrCodes.map((q) => (
                  <option key={q.id} value={q.id}>{q.label}</option>
                ))}
              </select>
            </div>

            {/* Rating range */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('feedbackRatingRange')}</label>
              <div className="flex items-center gap-2">
                <select
                  value={ratingMin}
                  onChange={(e) => setRatingMin(Number(e.target.value))}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                    <option key={n} value={n} disabled={n > ratingMax}>{n}</option>
                  ))}
                </select>
                <span className="text-gray-300 font-medium">–</span>
                <select
                  value={ratingMax}
                  onChange={(e) => setRatingMax(Number(e.target.value))}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                    <option key={n} value={n} disabled={n < ratingMin}>{n}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date range */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('feedbackDateRange')}</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <span className="text-gray-300 font-medium">–</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            {/* Comment + clear */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('feedbackCommentFilter')}</label>
              <div className="flex items-center gap-2">
                <select
                  value={hasComment}
                  onChange={(e) => setHasComment(e.target.value as '' | 'true' | 'false')}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">{t('feedbackCommentAll')}</option>
                  <option value="true">{t('feedbackCommentWith')}</option>
                  <option value="false">{t('feedbackCommentWithout')}</option>
                </select>
                {isFiltered && (
                  <button
                    onClick={resetFilters}
                    title="Clear all filters"
                    className="shrink-0 p-2.5 border border-gray-200 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-20">
                  <SortBtn col="rating" label={t('rating')} />
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('qrName')}</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('comment')}</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  <SortBtn col="date" label={t('date')} />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-7 w-7 border-2 border-gray-200 border-t-blue-600" />
                    </div>
                  </td>
                </tr>
              ) : feedbacks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center text-gray-400">
                    <p className="font-medium">{t('feedbackNoResults')}</p>
                    {isFiltered && (
                      <button onClick={resetFilters} className="mt-2 text-sm text-blue-600 hover:underline">
                        {t('feedbackClearFilters')}
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                feedbacks.map((fb) => (
                  <tr key={fb.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-bold ${RATING_BG[fb.rating] ?? 'bg-gray-100 text-gray-700'}`}>
                        {fb.rating}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap font-medium">
                      {fb.qr_label ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 max-w-sm">
                      {fb.comment
                        ? <span className="line-clamp-2">{fb.comment}</span>
                        : <span className="text-gray-300 italic text-xs">{t('noComment')}</span>
                      }
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap text-xs">
                      {new Date(fb.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              {t('feedbackShowing')} {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} {t('feedbackOf')} {total}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => load(page - 1)} disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors">
                {t('feedbackPrev')}
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                const p = start + i
                return (
                  <button key={p} onClick={() => load(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      p === page ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'
                    }`}>
                    {p}
                  </button>
                )
              })}
              <button onClick={() => load(page + 1)} disabled={page === totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors">
                {t('feedbackNext')}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
