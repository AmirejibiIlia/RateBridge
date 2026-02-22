import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import RatingPicker from '../components/RatingPicker'
import { getQRInfo, submitFeedback } from '../api/feedback'
import { useLanguage } from '../context/LanguageContext'
import type { QRCodePublicInfo } from '../types'

function LangSwitcher() {
  const { lang, setLang } = useLanguage()
  return (
    <div className="absolute top-5 right-5 flex items-center gap-1.5 text-xs font-semibold tracking-wide">
      <button
        onClick={() => setLang('en')}
        className={lang === 'en' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600 transition-colors'}
      >
        EN
      </button>
      <span className="text-gray-200">|</span>
      <button
        onClick={() => setLang('de')}
        className={lang === 'de' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600 transition-colors'}
      >
        DE
      </button>
    </div>
  )
}

function CheckIcon() {
  return (
    <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
      <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12 relative">
      <LangSwitcher />
      {children}
    </div>
  )
}

export default function FeedbackPage() {
  const { uuid } = useParams<{ uuid: string }>()
  const { t } = useLanguage()
  const [info, setInfo] = useState<QRCodePublicInfo | null>(null)
  const [rating, setRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!uuid) return
    getQRInfo(uuid)
      .then(setInfo)
      .catch(() => setError('QR code not found or inactive.'))
      .finally(() => setLoading(false))
  }, [uuid])

  const handleSubmit = async () => {
    if (!rating || !uuid) return
    setSubmitting(true)
    setError('')
    try {
      await submitFeedback(uuid, rating, comment || undefined)
      setSubmitted(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
      setError(msg || 'Failed to submit feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-600" />
      </div>
    )
  }

  if (error && !info) {
    return (
      <Shell>
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-900">{t('qrNotFound')}</p>
          <p className="text-sm text-gray-400 mt-2">{error}</p>
        </div>
      </Shell>
    )
  }

  if (!info?.is_active) {
    return (
      <Shell>
        <div className="text-center">
          {info?.logo_base64 && (
            <img src={info.logo_base64} alt={info.company_name} className="w-14 h-14 rounded-xl object-cover mx-auto mb-5" />
          )}
          <p className="text-xl font-semibold text-gray-900">{t('feedbackClosed')}</p>
          <p className="text-sm text-gray-400 mt-2">{t('qrInactive')}</p>
        </div>
      </Shell>
    )
  }

  if (submitted) {
    return (
      <Shell>
        <div className="text-center">
          {info?.logo_base64 && (
            <img src={info.logo_base64} alt={info.company_name} className="w-14 h-14 rounded-xl object-cover mx-auto mb-6" />
          )}
          <CheckIcon />
          <p className="text-xl font-semibold text-gray-900">{t('thankYou')}</p>
          <p className="text-sm text-gray-400 mt-2">{t('feedbackSubmitted')}</p>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          {info?.logo_base64 ? (
            <img
              src={info.logo_base64}
              alt={info.company_name}
              className="w-16 h-16 rounded-2xl object-cover mx-auto mb-4 shadow-sm"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">{info?.company_name?.[0]}</span>
            </div>
          )}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">{info?.company_name}</p>
          <h1 className="text-2xl font-bold text-gray-900">{info?.label}</h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-7 space-y-7">
          <div>
            <p className="text-sm font-medium text-gray-500 text-center mb-5">{t('howWouldYouRate')}</p>
            <RatingPicker value={rating} onChange={setRating} />
          </div>

          <div className="border-t border-gray-100" />

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              {t('commentOptional')}
              <span className="normal-case font-normal text-gray-300 ml-1">— {t('optional')}</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition"
              placeholder={t('commentPlaceholder')}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!rating || submitting}
            className="w-full py-3.5 bg-blue-600 text-white text-sm font-semibold rounded-2xl hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            {submitting ? t('submitting') : t('submitFeedback')}
          </button>
        </div>
      </div>
    </Shell>
  )
}
