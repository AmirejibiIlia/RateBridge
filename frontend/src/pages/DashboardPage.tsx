import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import StatsCard from '../components/StatsCard'
import FeedbackChart from '../components/FeedbackChart'
import { getDashboard, getFeedbackStats, getFeedback } from '../api/company'
import type { CompanyStats, FeedbackStats, Feedback } from '../types'

export default function DashboardPage() {
  const [stats, setStats] = useState<CompanyStats | null>(null)
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null)
  const [recentFeedback, setRecentFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDashboard(), getFeedbackStats(), getFeedback(1, 5)])
      .then(([s, fs, fb]) => {
        setStats(s)
        setFeedbackStats(fs)
        setRecentFeedback(fb)
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{stats?.company.name}</h1>
          <p className="text-gray-500 text-sm mt-1">Overview of your feedback performance</p>
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

        {recentFeedback.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-700 mb-4">Recent Feedback</h3>
            <div className="space-y-3">
              {recentFeedback.map((fb) => (
                <div key={fb.id} className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
                  <span className="text-2xl font-bold text-blue-600 w-8 shrink-0">{fb.rating}</span>
                  <div className="flex-1 min-w-0">
                    {fb.comment && <p className="text-sm text-gray-700 truncate">{fb.comment}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(fb.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
