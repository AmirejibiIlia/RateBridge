import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '../context/LanguageContext'
import Layout from '../components/Layout'
import StatsCard from '../components/StatsCard'
import TimelineCharts from '../components/TimelineCharts'
import AISummaryWidget from '../components/AISummaryWidget'
import {
  getDashboard, getFeedbackHighlights, getFeedbackTimeline,
  getQRCodes, getQRCodeStats,
} from '../api/company'
import type { CompanyStats, FeedbackStats, FeedbackHighlights, FeedbackTimeline, QRCode } from '../types'

interface QRWithStats { qr: QRCode; stats: FeedbackStats }

function relativeTime(dateStr: string): string {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
function ratingColor(r: number | null): string {
  if (r == null) return 'text-gray-400'
  if (r >= 7) return 'text-green-600'
  if (r >= 5) return 'text-amber-500'
  return 'text-red-500'
}

export default function DashboardPage() {
  const { t } = useLanguage()

  const [stats, setStats] = useState<CompanyStats | null>(null)
  const [highlights, setHighlights] = useState<FeedbackHighlights | null>(null)
  const [timeline, setTimeline] = useState<FeedbackTimeline | null>(null)
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [qrList, setQrList] = useState<QRCode[]>([])
  const [selectedQrId, setSelectedQrId] = useState<string | null>(null)
  const [qrSections, setQrSections] = useState<QRWithStats[]>([])
  const [loading, setLoading] = useState(true)

  const [highlightsTab, setHighlightsTab] = useState<'top' | 'worst'>('top')

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
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-600" />
        </div>
      </Layout>
    )
  }

  const sortedQrSections = [...qrSections].sort(
    (a, b) => (b.stats.average_rating ?? 0) - (a.stats.average_rating ?? 0)
  )
  const highlightItems = highlightsTab === 'top' ? highlights?.top3 : highlights?.worst3

  return (
    <Layout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          {stats?.company.logo_base64 && (
            <img src={stats.company.logo_base64} alt="logo" className="w-12 h-12 rounded-xl object-cover shrink-0" />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{stats?.company.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{t('overallPerformance')}</p>
          </div>
        </div>

        {/* KPI cards */}
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

        {/* Timeline chart + QR leaderboard */}
        {timeline && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <TimelineCharts
                timeline={timeline}
                qrList={qrList}
                selectedQrId={selectedQrId}
                onQrFilter={handleQrFilter}
                loading={timelineLoading}
              />
            </div>

            {/* QR Leaderboard */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-700 mb-4">{t('qrPerformance')}</h3>
              {sortedQrSections.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">{t('noFeedbackYet')}</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {sortedQrSections.map(({ qr, stats: qrStats }) => (
                    <button
                      key={qr.id}
                      onClick={() => handleQrFilter(selectedQrId === qr.id ? null : qr.id)}
                      className={`w-full flex items-center gap-2 py-2.5 px-2 -mx-2 text-left rounded-lg transition-colors ${
                        selectedQrId === qr.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-base font-bold w-9 shrink-0 ${ratingColor(qrStats.average_rating)}`}>
                        {qrStats.average_rating?.toFixed(1) ?? '—'}
                      </span>
                      <span className="flex-1 text-sm text-gray-700 truncate">{qr.label}</span>
                      <span className="text-xs text-gray-400 shrink-0">{qrStats.total}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
                        qr.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {qr.is_active ? t('active') : t('inactive')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Summary + Recent Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <AISummaryWidget />

          {/* Recent Highlights */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-700">{t('recentHighlights')}</h3>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
                <button
                  onClick={() => setHighlightsTab('top')}
                  className={`px-3 py-1.5 transition-colors ${highlightsTab === 'top' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                  {t('topRated')}
                </button>
                <button
                  onClick={() => setHighlightsTab('worst')}
                  className={`px-3 py-1.5 border-l border-gray-200 transition-colors ${highlightsTab === 'worst' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                  {t('lowestRated')}
                </button>
              </div>
            </div>

            {highlightItems && highlightItems.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {highlightItems.map((fb) => (
                  <div key={fb.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <span className={`text-base font-bold w-6 shrink-0 mt-0.5 ${ratingColor(fb.rating)}`}>
                      {fb.rating}
                    </span>
                    <div className="flex-1 min-w-0">
                      {fb.qr_label && (
                        <p className="text-xs font-medium text-gray-400 mb-0.5">{fb.qr_label}</p>
                      )}
                      {fb.comment
                        ? <p className="text-sm text-gray-700 line-clamp-2">{fb.comment}</p>
                        : <p className="text-sm text-gray-400 italic">{t('noComment')}</p>
                      }
                      <p className="text-xs text-gray-400 mt-1">{relativeTime(fb.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">{t('noFeedbackYet')}</p>
            )}
          </div>

        </div>
      </div>
    </Layout>
  )
}
