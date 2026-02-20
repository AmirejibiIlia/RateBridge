import { useState, useEffect, useRef } from 'react'
import type { QRCode } from '../types'
import { getQRCodeImage, updateQRCode, deleteQRCode } from '../api/company'

interface Props {
  qr: QRCode
  onDeleted: (id: string) => void
  onUpdated: (qr: QRCode) => void
}

export default function QRCodeCard({ qr, onDeleted, onUpdated }: Props) {
  const [image, setImage] = useState<string | null>(qr.image_base64 ?? null)
  const [editing, setEditing] = useState(false)
  const [labelInput, setLabelInput] = useState(qr.label)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!image) {
      getQRCodeImage(qr.id).then((data) => setImage(data.image_base64 ?? null))
    }
  }, [qr.id, image])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const handleSaveLabel = async () => {
    if (!labelInput.trim() || labelInput === qr.label) {
      setEditing(false)
      setLabelInput(qr.label)
      return
    }
    setSaving(true)
    try {
      const updated = await updateQRCode(qr.id, labelInput.trim())
      onUpdated(updated)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveLabel()
    if (e.key === 'Escape') {
      setEditing(false)
      setLabelInput(qr.label)
    }
  }

  const handleDownload = () => {
    if (!image) return
    const link = document.createElement('a')
    link.href = `data:image/png;base64,${image}`
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
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onBlur={handleSaveLabel}
              onKeyDown={handleKeyDown}
              disabled={saving}
              className="w-full font-semibold text-gray-900 border-b-2 border-blue-500 outline-none bg-transparent"
            />
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="font-semibold text-gray-900 hover:text-blue-600 text-left w-full truncate group flex items-center gap-1"
            >
              <span className="truncate">{qr.label}</span>
              <span className="text-gray-300 group-hover:text-blue-400 text-xs shrink-0">✏️</span>
            </button>
          )}
          <p className="text-xs text-gray-400 mt-0.5">{new Date(qr.created_at).toLocaleDateString()}</p>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
            qr.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {qr.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="flex justify-center">
        {image ? (
          <img
            src={`data:image/png;base64,${image}`}
            alt={`QR code for ${qr.label}`}
            className="w-40 h-40"
          />
        ) : (
          <div className="w-40 h-40 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleDownload}
          disabled={!image}
          className="flex-1 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Download
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
