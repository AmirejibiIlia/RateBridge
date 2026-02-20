import { useState, useEffect, FormEvent } from 'react'
import Layout from '../components/Layout'
import QRCodeCard from '../components/QRCodeCard'
import { getQRCodes, createQRCode } from '../api/company'
import type { QRCode } from '../types'

export default function QRCodesPage() {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([])
  const [label, setLabel] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getQRCodes()
      .then(setQrCodes)
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!label.trim()) return
    setCreating(true)
    setError('')
    try {
      const qr = await createQRCode(label.trim())
      setQrCodes((prev) => [qr, ...prev])
      setLabel('')
    } catch {
      setError('Failed to create QR code. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleted = (id: string) => {
    setQrCodes((prev) => prev.filter((q) => q.id !== id))
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">QR Codes</h1>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Generate New QR Code</h2>
          <form onSubmit={handleCreate} className="flex gap-3">
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              placeholder="e.g. Main Entrance, Table 5..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </form>
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : qrCodes.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">No QR codes yet.</p>
            <p className="text-sm mt-1">Create one above to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {qrCodes.map((qr) => (
              <QRCodeCard key={qr.id} qr={qr} onDeleted={handleDeleted} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
