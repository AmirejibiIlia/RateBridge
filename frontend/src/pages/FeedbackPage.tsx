import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import RatingPicker from '../components/RatingPicker'
import { getQRInfo, submitFeedback } from '../api/feedback'
import type { QRCodePublicInfo } from '../types'

export default function FeedbackPage() {
  const { uuid } = useParams<{ uuid: string }>()
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error && !info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">QR Code Not Found</p>
          <p className="text-gray-500 mt-2">{error}</p>
        </div>
      </div>
    )
  }

  if (!info?.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">Feedback Closed</p>
          <p className="text-gray-500 mt-2">This QR code is no longer active.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🎉</div>
          <p className="text-2xl font-bold text-gray-900">Thank you!</p>
          <p className="text-gray-500 mt-2">Your feedback has been submitted.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">{info?.company_name}</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{info?.label}</h1>
          <p className="text-gray-500 mt-2">How would you rate your experience?</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6">
          <RatingPicker value={rating} onChange={setRating} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comment <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Tell us more about your experience..."
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!rating || submitting}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors text-base"
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    </div>
  )
}
