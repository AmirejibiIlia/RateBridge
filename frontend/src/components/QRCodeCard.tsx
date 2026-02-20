import { useState } from 'react'
import type { QRCode } from '../types'
import { getQRCodeImage, deleteQRCode } from '../api/company'

interface Props {
  qr: QRCode
  onDeleted: (id: string) => void
}

export default function QRCodeCard({ qr, onDeleted }: Props) {
  const [image, setImage] = useState<string | null>(qr.image_base64 ?? null)
  const [loadingImage, setLoadingImage] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDownload = async () => {
    let b64 = image
    if (!b64) {
      setLoadingImage(true)
      try {
        const data = await getQRCodeImage(qr.id)
        b64 = data.image_base64 ?? null
        setImage(b64)
      } finally {
        setLoadingImage(false)
      }
    }
    if (!b64) return
    const link = document.createElement('a')
    link.href = `data:image/png;base64,${b64}`
    link.download = `${qr.label.replace(/\s+/g, '-')}-qr.png`
    link.click()
  }

  const handleDelete = async () => {
    if (!confirm(`Delete QR code "${qr.label}"?`)) return
    setDeleting(true)
    try {
      await deleteQRCode(qr.id)
      onDeleted(qr.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-gray-900">{qr.label}</p>
          <p className="text-xs text-gray-400 mt-0.5">{new Date(qr.created_at).toLocaleDateString()}</p>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            qr.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {qr.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {image && (
        <img
          src={`data:image/png;base64,${image}`}
          alt={`QR code for ${qr.label}`}
          className="w-36 h-36 self-center"
        />
      )}

      <div className="flex gap-2">
        <button
          onClick={handleDownload}
          disabled={loadingImage}
          className="flex-1 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loadingImage ? 'Loading...' : 'Download'}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex-1 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  )
}
