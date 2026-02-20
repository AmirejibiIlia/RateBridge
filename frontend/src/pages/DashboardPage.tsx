import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import StatsCard from '../components/StatsCard'
import FeedbackChart from '../components/FeedbackChart'
import { getDashboard, getFeedbackStats, getFeedbackHighlights, getQRCodes, getQRCodeStats } from '../api/company'
import type { CompanyStats, FeedbackStats, FeedbackHighlights, QRCode } from '../types'

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
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className={`text-xl font-bold w-7 shrink-0 ${RATING_COLORS[rating] ?? 'text-gray-700'}`}>
        {rating}
      </span>
      <div className="flex-1 min-w-0">
        {comment
          ? <p className="text-sm text-gray-700 truncate">{comment}</p>
          : <p className="text-sm text-gray-400 italic">No comment</p>
        }
        <p className="text-xs text-gray-400 mt-0.5">{new Date(date).toLocaleString()}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<CompanyStats | null>(null)
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null)
  const [highlights, setHighlights] = useState<FeedbackHighlights | null>(null)
  const [qrSections, setQrSections] = useState<QRWithStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDashboard(), getFeedbackStats(), getFeedbackHighlights(), getQRCodes()])
      .then(async ([s, fs, hl, qrs]) => {
        setStats(s)
        setFeedbackStats(fs)
        setHighlights(hl)
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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* General overview */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{stats?.company.name}</h1>
            <p className="text-gray-500 text-sm mt-1">Overall performance</p>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatsCard title="Total Feedback" value={stats?.total_feedback ?? 0} />
            <StatsCard
              title="Average Rating"
              value={stats?.average_rating != null ? stats.average_rating.toFixed(1) : '—'}
              subtitle="out of 10"
            />
            <StatsCard title="QR Codes" value={stats?.total_qr_codes ?? 0} />
            <StatsCard title="Active QR Codes" value={stats?.active_qr_codes ?? 0} />
          </div>

          {feedbackStats && feedbackStats.total > 0 && (
            <FeedbackChart distribution={feedbackStats.distribution} />
          )}
        </div>

        {/* Top 3 & Worst 3 */}
        {highlights && (highlights.top3.length > 0 || highlights.worst3.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-700 mb-3">🏆 Top Feedback</h3>
              {highlights.top3.length === 0
                ? <p className="text-sm text-gray-400">No feedback yet.</p>
                : highlights.top3.map((fb) => (
                    <FeedbackRow key={fb.id} rating={fb.rating} comment={fb.comment} date={fb.created_at} />
                  ))
              }
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-700 mb-3">⚠️ Needs Attention</h3>
              {highlights.worst3.length === 0
                ? <p className="text-sm text-gray-400">No feedback yet.</p>
                : highlights.worst3.map((fb) => (
                    <FeedbackRow key={fb.id} rating={fb.rating} comment={fb.comment} date={fb.created_at} />
                  ))
              }
            </div>
          </div>
        )}

        {/* Per-QR dashboards */}
        {qrSections.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800">By QR Code</h2>
            {qrSections.map(({ qr, stats: qrStats }) => (
              <div key={qr.id} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{qr.label}</h3>
                    <p className="text-sm text-gray-400">
                      {qrStats.total} responses
                      {qrStats.average_rating != null && ` · avg ${qrStats.average_rating.toFixed(1)}`}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    qr.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {qr.is_active ? 'Active' : 'Inactive'}
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
