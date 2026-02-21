import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import type { FeedbackTimeline } from '../types'
import { useLanguage } from '../context/LanguageContext'

// Colors from red (1) → emerald (10)
const RATING_COLORS: Record<string, string> = {
  r1:  '#ef4444',
  r2:  '#f97316',
  r3:  '#f59e0b',
  r4:  '#eab308',
  r5:  '#84cc16',
  r6:  '#22c55e',
  r7:  '#10b981',
  r8:  '#14b8a6',
  r9:  '#3b82f6',
  r10: '#6366f1',
}

const RATINGS = ['r1','r2','r3','r4','r5','r6','r7','r8','r9','r10'] as const

interface ChartProps {
  data: FeedbackTimeline['daily'] | FeedbackTimeline['weekly']
  title: string
}

function StackedChart({ data, title }: ChartProps) {
  const { t } = useLanguage()
  const hasData = data.some((d) => RATINGS.some((r) => d[r] > 0))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-base font-semibold text-gray-700 mb-4">{title}</h3>
      {!hasData ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          {t('noDataPeriod')}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                const total = payload.reduce((s, p) => s + ((p.value as number) || 0), 0)
                const entries = payload.filter((p) => (p.value as number) > 0).reverse()
                return (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
                    <p className="font-semibold text-gray-700 mb-1">{label} — {total} responses</p>
                    {entries.map((p) => (
                      <div key={p.dataKey} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.fill }} />
                        <span className="text-gray-600">Rating {String(p.dataKey).replace('r', '')}: {p.value}</span>
                      </div>
                    ))}
                  </div>
                )
              }}
            />
            <Legend
              formatter={(value) => `${String(value).replace('r', '')}`}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11 }}
            />
            {RATINGS.map((r) => (
              <Bar
                key={r}
                dataKey={r}
                stackId="stack"
                fill={RATING_COLORS[r]}
                name={r}
                radius={r === 'r10' ? [3, 3, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default function TimelineCharts({ timeline }: { timeline: FeedbackTimeline }) {
  const { t } = useLanguage()
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <StackedChart data={timeline.daily} title={t('dailyChart')} />
      <StackedChart data={timeline.weekly} title={t('weeklyChart')} />
    </div>
  )
}
