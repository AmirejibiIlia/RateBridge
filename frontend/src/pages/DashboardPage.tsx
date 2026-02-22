import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '../context/LanguageContext'
import Layout from '../components/Layout'
import StatsCard from '../components/StatsCard'
import FeedbackChart from '../components/FeedbackChart'
import TimelineCharts from '../components/TimelineCharts'
import { getDashboard, getFeedbackHighlights, getFeedbackTimeline, getQRCodes, getQRCodeStats } from '../api/company'
import type { CompanyStats, FeedbackStats, FeedbackHighlights, FeedbackTimeline, QRCode } from '../types'

const RATING_COLORS: Record<number, string> = {
  1: 'text-red-600', 2: 'text-red-500', 3: 'text-orange-500', 4: 'text-orange-400',
  5: 'text-yellow-500', 6: 'text-yellow-400', 7: 'text-lime-600', 8: 'text-green-500',
  9: 'text-green-600', 10: 'text-emerald-600',
}

interface QRWithStats {
  qr: QRCode
  stats: FeedbackStats
}

function FeedbackRow({ rating, comment, date }: { rating: number; comment: string | null; date: string }) {
  const { t } = useLanguage()
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className={`text-xl font-bold w-7 shrink-0 ${RATING_COLORS[rating] ?? 'text-gray-700'}`}>
        {rating}
      </span>
      <div className="flex-1 min-w-0">
        {comment
          ? <p className="text-sm text-gray-700 truncate">{comment}</p>
          : <p className="text-sm text-gray-400 italic">{t('noComment')}</p>
        }
        <p className="text-xs text-gray-400 mt-0.5">{new Date(date).toLocaleString()}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<CompanyStats | null>(null)
  const [highlights, setHighlights] = useState<FeedbackHighlights | null>(null)
  const [timeline, setTimeline] = useState<FeedbackTimeline | null>(null)
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [qrList, setQrList] = useState<QRCode[]>([])
  const [selectedQrId, setSelectedQrId] = useState<string | null>(null)
  const [qrSections, setQrSections] = useState<QRWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()

  useEffect(() => {
    Promise.all([getDashboard(), getFeedbackHighlights(), getFeedbackTimeline(), getQRCodes()])
      .then(async ([s, hl, tl, qrs]) => {
        setStats(s)
        setHighlights(hl)
        setTimeline(tl)
        setQrList(qrs)
        const sections = await Promise.all(
          qrs.map(async (qr) => {
            const qrStats = await getQRCodeStats(qr.id)
            return { qr, stats: qrStats }
          })
        )
        setQrSections(sections.filter((s) => s.stats.total > 0))
      })
      .finally(() => setLoading(false))
  }, [])

  const handleQrFilter = useCallback((qrId: string | null) => {
    setSelectedQrId(qrId)
    setTimelineLoading(true)
    getFeedbackTimeline(qrId ?? undefined)
      .then(setTimeline)
      .finally(() => setTimelineLoading(false))
  }, [])

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      </Layout>
    )
  }

  const selectedQrLabel = qrList.find((q) => q.id === selectedQrId)?.label ?? 'All QR Codes'

  return (
    <Layout>
      <div className="space-y-8">
        {/* General overview */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {stats?.company.logo_base64 && (
              <img
                src={stats.company.logo_base64}
                alt="logo"
                className="w-12 h-12 rounded-xl object-cover shrink-0"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{stats?.company.name}</h1>
              <p className="text-gray-500 text-sm mt-0.5">{t('overallPerformance')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatsCard title={t('totalFeedback')} value={stats?.total_feedback ?? 0} />
            <StatsCard
              title={t('averageRating')}
              value={stats?.average_rating != null ? stats.average_rating.toFixed(1) : '—'}
              subtitle={t('outOf10')}
            />
            <StatsCard title={t('qrCodes')} value={stats?.total_qr_codes ?? 0} />
            <StatsCard title={t('activeQRCodes')} value={stats?.active_qr_codes ?? 0} />
          </div>

          {/* QR filter + timeline */}
          {timeline && (
            <div className="space-y-3">
              {/* Filter pills */}
              {qrList.length > 1 && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-medium text-gray-500 mr-1">{t('filter')}</span>
                  <button
                    onClick={() => handleQrFilter(null)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedQrId === null
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {t('allQRCodes')}
                  </button>
                  {qrList.map((qr) => (
                    <button
                      key={qr.id}
                      onClick={() => handleQrFilter(qr.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedQrId === qr.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {qr.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="relative">
                {timelineLoading && (
                  <div className="absolute inset-0 bg-white/70 rounded-xl flex items-center justify-center z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  </div>
                )}
                <div>
                  {selectedQrId && (
                    <p className="text-sm font-medium text-blue-600 mb-2">
                      {t('showing')} {selectedQrLabel}
                    </p>
                  )}
                  <TimelineCharts timeline={timeline} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Top 3 & Worst 3 */}
        {highlights && (highlights.top3.length > 0 || highlights.worst3.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-700 mb-3">{t('topFeedback')}</h3>
              {highlights.top3.map((fb) => (
                <FeedbackRow key={fb.id} rating={fb.rating} comment={fb.comment} date={fb.created_at} />
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-700 mb-3">{t('needsAttention')}</h3>
              {highlights.worst3.map((fb) => (
                <FeedbackRow key={fb.id} rating={fb.rating} comment={fb.comment} date={fb.created_at} />
              ))}
            </div>
          </div>
        )}

        {/* Per-QR dashboards */}
        {qrSections.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800">{t('byQRCode')}</h2>
            {qrSections.map(({ qr, stats: qrStats }) => (
              <div key={qr.id} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{qr.label}</h3>
                    <p className="text-sm text-gray-400">
                      {qrStats.total} {t('responses')}
                      {qrStats.average_rating != null && ` · ${t('avg')} ${qrStats.average_rating.toFixed(1)}`}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    qr.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {qr.is_active ? t('active') : t('inactive')}
                  </span>
                </div>
                <FeedbackChart distribution={qrStats.distribution} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
