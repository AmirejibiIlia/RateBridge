interface Props {
  value: number | null
  onChange: (rating: number) => void
}

const ratingColors: Record<number, string> = {
  1: 'bg-red-500 border-red-500 text-white',
  2: 'bg-red-400 border-red-400 text-white',
  3: 'bg-orange-500 border-orange-500 text-white',
  4: 'bg-orange-400 border-orange-400 text-white',
  5: 'bg-yellow-500 border-yellow-500 text-white',
  6: 'bg-yellow-400 border-yellow-400 text-white',
  7: 'bg-lime-500 border-lime-500 text-white',
  8: 'bg-green-500 border-green-500 text-white',
  9: 'bg-green-600 border-green-600 text-white',
  10: 'bg-emerald-600 border-emerald-600 text-white',
}

export default function RatingPicker({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`w-14 h-14 rounded-full border-2 text-lg font-bold transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-blue-300
            ${value === n ? ratingColors[n] : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50'}`}
        >
          {n}
        </button>
      ))}
    </div>
  )
}
