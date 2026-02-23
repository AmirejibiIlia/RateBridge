import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const RATING_COLORS = [
  '#dc2626', '#ef4444', '#f97316', '#fb923c', '#fbbf24',
  '#a3e635', '#4ade80', '#22c55e', '#16a34a', '#15803d',
]

interface Props {
  distribution: Record<string, number>
}

export default function FeedbackChart({ distribution }: Props) {
  const data = Array.from({ length: 10 }, (_, i) => ({
    rating: String(i + 1),
    count: distribution[String(i + 1)] ?? 0,
  }))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-base font-semibold text-gray-700 mb-4">Rating Distribution</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="rating" tick={{ fontSize: 13 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 13 }} />
          <Tooltip />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={RATING_COLORS[i]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
