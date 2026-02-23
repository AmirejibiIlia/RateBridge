import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { FeedbackTimeline, QRCode } from '../types'
import { useLanguage } from '../context/LanguageContext'

const RATING_COLORS: Record<string, string> = {
  r1: '#ef4444', r2: '#f97316', r3: '#f59e0b', r4: '#eab308',
  r5: '#84cc16', r6: '#22c55e', r7: '#10b981', r8: '#14b8a6',
  r9: '#3b82f6', r10: '#6366f1',
}
const RATINGS = ['r1','r2','r3','r4','r5','r6','r7','r8','r9','r10'] as const

function StackedChart({ data }: { data: FeedbackTimeline['daily'] | FeedbackTimeline['weekly'] }) {
  const { t } = useLanguage()
  const hasData = data.some((d) => RATINGS.some((r) => d[r] > 0))

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        {t('noDataPeriod')}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            const total = payload.reduce((s, p) => s + ((p.value as number) || 0), 0)
            const entries = payload.filter((p) => (p.value as number) > 0).reverse()
            return (
              <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
                <p className="font-semibold text-gray-700 mb-1">{label} — {total} responses</p>
                {entries.map((p) => (
                  <div key={p.dataKey as string} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.fill }} />
                    <span className="text-gray-600">Rating {String(p.dataKey).replace('r', '')}: {p.value}</span>
                  </div>
                ))}
              </div>
            )
          }}
        />
        {RATINGS.map((r) => (
          <Bar
            key={r}
            dataKey={r}
            stackId="stack"
            fill={RATING_COLORS[r]}
            radius={r === 'r10' ? [3, 3, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

interface Props {
  timeline: FeedbackTimeline
  qrList: QRCode[]
  selectedQrId: string | null
  onQrFilter: (id: string | null) => void
  loading?: boolean
}

export default function TimelineCharts({ timeline, qrList, selectedQrId, onQrFilter, loading }: Props) {
  const [tab, setTab] = useState<'daily' | 'weekly'>('daily')
  const { t } = useLanguage()

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 relative">
      {loading && (
        <div className="absolute inset-0 bg-white/70 rounded-xl flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-600" />
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-700">{t('feedbackTrends')}</h3>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
          <button
            onClick={() => setTab('daily')}
            className={`px-3 py-1.5 transition-colors ${tab === 'daily' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            {t('daily')}
          </button>
          <button
            onClick={() => setTab('weekly')}
            className={`px-3 py-1.5 border-l border-gray-200 transition-colors ${tab === 'weekly' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            {t('weekly')}
          </button>
        </div>
      </div>

      {qrList.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            onClick={() => onQrFilter(null)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedQrId === null ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('allQRCodes')}
          </button>
          {qrList.map((qr) => (
            <button
              key={qr.id}
              onClick={() => onQrFilter(qr.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedQrId === qr.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {qr.label}
            </button>
          ))}
        </div>
      )}

      <StackedChart data={tab === 'daily' ? timeline.daily : timeline.weekly} />
    </div>
  )
}
