import { useState, KeyboardEvent } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { generateFeedbackSummary } from '../api/company'

type Preset = 'today' | 'week' | 'month' | 'custom'

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function presetDates(preset: Preset): { from: string; to: string } {
  const now = new Date()
  const to = isoDate(now)
  if (preset === 'today') return { from: to, to }
  if (preset === 'week') {
    const d = new Date(now); d.setDate(d.getDate() - 6)
    return { from: isoDate(d), to }
  }
  if (preset === 'month') {
    const d = new Date(now); d.setDate(d.getDate() - 29)
    return { from: isoDate(d), to }
  }
  return { from: isoDate(now), to }
}

interface SummaryBlock { header: string; bullets: string[] }

function parseSummary(raw: string): SummaryBlock[] {
  return raw
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((block) => {
      const lines = block.split('\n').filter(Boolean)
      return {
        header: lines[0].replace(/^\[|\]$/g, ''),
        bullets: lines.slice(1).map((b) => b.replace(/^[•\-]\s*/, '')),
      }
    })
}

export default function AISummaryWidget() {
  const { t } = useLanguage()

  const [preset, setPreset] = useState<Preset>('week')
  const [customFrom, setCustomFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 6); return isoDate(d)
  })
  const [customTo, setCustomTo] = useState(() => isoDate(new Date()))

  const [showFocusAreas, setShowFocusAreas] = useState(false)
  const [focusInput, setFocusInput] = useState('')
  const [focusAreas, setFocusAreas] = useState<string[]>([])

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ blocks: SummaryBlock[]; count: number; label: string } | null>(null)
  const [error, setError] = useState('')

  const addFocus = () => {
    const v = focusInput.trim()
    if (v && !focusAreas.includes(v)) setFocusAreas((p) => [...p, v])
    setFocusInput('')
  }

  const activeDates = preset === 'custom'
    ? { from: customFrom, to: customTo }
    : presetDates(preset)

  const presetLabel = () => {
    if (preset === 'today') return t('aiPresetToday')
    if (preset === 'week') return t('aiPresetWeek')
    if (preset === 'month') return t('aiPresetMonth')
    return `${activeDates.from} → ${activeDates.to}`
  }

  const handleGenerate = async () => {
    setError('')
    setLoading(true)
    try {
      const categories = focusAreas.length > 0 ? focusAreas : ['General']
      const res = await generateFeedbackSummary(activeDates.from, activeDates.to, categories)
      if (res.feedback_count === 0) {
        setResult(null)
        setError(t('aiNoData'))
        return
      }
      setResult({ blocks: parseSummary(res.summary), count: res.feedback_count, label: presetLabel() })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
      setError(msg || 'Failed to generate summary.')
    } finally {
      setLoading(false)
    }
  }

  const PRESETS: { key: Preset; label: string }[] = [
    { key: 'today', label: t('aiPresetToday') },
    { key: 'week', label: t('aiPresetWeek') },
    { key: 'month', label: t('aiPresetMonth') },
    { key: 'custom', label: t('aiPresetCustom') },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-base">✨</span>
        <h3 className="text-base font-semibold text-gray-700">{t('aiSummary')}</h3>
      </div>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPreset(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              preset === key
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Custom date inputs — only shown when Custom selected */}
      {preset === 'custom' && (
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-400 mb-1">{t('dateFrom')}</label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-400 mb-1">{t('dateTo')}</label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
      )}

      {/* Focus areas — collapsed by default */}
      {!showFocusAreas ? (
        <button
          onClick={() => setShowFocusAreas(true)}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          {t('aiAddFocusAreas')}
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-500">{t('aiFocusAreas')}</label>
            <button
              onClick={() => { setShowFocusAreas(false); setFocusAreas([]) }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              ✕ clear
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={focusInput}
              onChange={(e) => setFocusInput(e.target.value)}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') { e.preventDefault(); addFocus() }
              }}
              placeholder={t('aiFocusPlaceholder')}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={addFocus}
              className="px-3 py-1.5 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-semibold"
            >
              +
            </button>
          </div>
          {focusAreas.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {focusAreas.map((a) => (
                <span key={a} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
                  {a}
                  <button onClick={() => setFocusAreas((p) => p.filter((x) => x !== a))} className="text-blue-400 hover:text-blue-700 ml-0.5 leading-none">×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {t('generating')}
          </>
        ) : (
          t('generateSummary')
        )}
      </button>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500">{result.label}</p>
              <p className="text-xs text-gray-400">{result.count} {t('aiResponsesAnalysed')}</p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-40 transition-colors"
            >
              ↺ {t('aiRegenerate')}
            </button>
          </div>

          {result.blocks.map((block, i) => (
            <div key={i} className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{block.header}</p>
              {block.bullets.length > 0 ? (
                <ul className="space-y-1">
                  {block.bullets.map((b, j) => (
                    <li key={j} className="flex gap-2 text-sm text-gray-700">
                      <span className="text-gray-300 shrink-0 mt-0.5">–</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 italic">No mentions</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
