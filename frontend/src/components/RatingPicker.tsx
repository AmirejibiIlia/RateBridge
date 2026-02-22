interface Props {
  value: number | null
  onChange: (rating: number) => void
}

const selectedColors: Record<number, string> = {
  1:  'bg-red-500 border-red-500 text-white shadow-md scale-110',
  2:  'bg-red-400 border-red-400 text-white shadow-md scale-110',
  3:  'bg-orange-500 border-orange-500 text-white shadow-md scale-110',
  4:  'bg-orange-400 border-orange-400 text-white shadow-md scale-110',
  5:  'bg-yellow-500 border-yellow-500 text-white shadow-md scale-110',
  6:  'bg-yellow-400 border-yellow-400 text-white shadow-md scale-110',
  7:  'bg-lime-500 border-lime-500 text-white shadow-md scale-110',
  8:  'bg-green-500 border-green-500 text-white shadow-md scale-110',
  9:  'bg-green-600 border-green-600 text-white shadow-md scale-110',
  10: 'bg-emerald-600 border-emerald-600 text-white shadow-md scale-110',
}

export default function RatingPicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-5 gap-2.5">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`h-12 rounded-xl border-2 text-base font-bold transition-all duration-150 focus:outline-none
            ${value === n
              ? selectedColors[n]
              : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 hover:border-gray-300'
            }`}
        >
          {n}
        </button>
      ))}
    </div>
  )
}
