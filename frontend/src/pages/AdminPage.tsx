import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react'
import Layout from '../components/Layout'
import { useLanguage } from '../context/LanguageContext'
import { getProfile, updateProfile, updateLogo } from '../api/company'
import { changePassword } from '../api/auth'
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../api/employees'
import type { Employee } from '../types'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <h2 className="text-base font-semibold text-gray-700 border-b border-gray-100 pb-3">{title}</h2>
      {children}
    </div>
  )
}

function cropToSquareBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const size = Math.min(img.width, img.height)
      const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 256
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(
        img,
        (img.width - size) / 2,
        (img.height - size) / 2,
        size,
        size,
        0, 0, 256, 256,
      )
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = reject
    img.src = url
  })
}

export default function AdminPage() {
  const { t, lang, setLang } = useLanguage()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Company name
  const [companyName, setCompanyName] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameStatus, setNameStatus] = useState<'idle' | 'saved' | 'error'>('idle')

  // Password
  const [newPassword, setNewPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwStatus, setPwStatus] = useState<'idle' | 'saved' | 'error'>('idle')

  // Logo
  const [currentLogo, setCurrentLogo] = useState<string | null>(null)
  const [previewLogo, setPreviewLogo] = useState<string | null>(null)
  const [logoSaving, setLogoSaving] = useState(false)
  const [logoStatus, setLogoStatus] = useState<'idle' | 'saved' | 'error'>('idle')

  // Employees
  const [employees, setEmployees] = useState<Employee[]>([])
  const [empName, setEmpName] = useState('')
  const [empRole, setEmpRole] = useState('')
  const [empAdding, setEmpAdding] = useState(false)
  const [showEmpForm, setShowEmpForm] = useState(false)
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null)
  const [editEmpName, setEditEmpName] = useState('')
  const [editEmpRole, setEditEmpRole] = useState('')
  const [deletingEmpId, setDeletingEmpId] = useState<string | null>(null)

  useEffect(() => {
    getProfile().then((c) => {
      setCompanyName(c.name)
      setCurrentLogo(c.logo_base64 ?? null)
    })
    getEmployees().then(setEmployees).catch(() => {})
  }, [])

  const handleAddEmployee = async (e: FormEvent) => {
    e.preventDefault()
    if (!empName.trim()) return
    setEmpAdding(true)
    try {
      const emp = await createEmployee({ name: empName.trim(), role: empRole.trim() || undefined })
      setEmployees((prev) => [...prev, emp].sort((a, b) => a.name.localeCompare(b.name)))
      setEmpName(''); setEmpRole(''); setShowEmpForm(false)
    } finally { setEmpAdding(false) }
  }

  const startEditEmp = (emp: Employee) => {
    setEditingEmp(emp); setEditEmpName(emp.name); setEditEmpRole(emp.role ?? '')
  }

  const handleSaveEmp = async () => {
    if (!editingEmp || !editEmpName.trim()) return
    const updated = await updateEmployee(editingEmp.id, { name: editEmpName.trim(), role: editEmpRole.trim() || undefined })
    setEmployees((prev) => prev.map((e) => e.id === updated.id ? updated : e).sort((a, b) => a.name.localeCompare(b.name)))
    setEditingEmp(null)
  }

  const handleDeleteEmp = async (id: string) => {
    await deleteEmployee(id)
    setEmployees((prev) => prev.filter((e) => e.id !== id))
    setDeletingEmpId(null)
  }

  const handleSaveName = async (e: FormEvent) => {
    e.preventDefault()
    if (!companyName.trim()) return
    setNameSaving(true)
    setNameStatus('idle')
    try {
      await updateProfile(companyName.trim())
      setNameStatus('saved')
      setTimeout(() => setNameStatus('idle'), 3000)
    } catch {
      setNameStatus('error')
    } finally {
      setNameSaving(false)
    }
  }

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 8) return
    setPwSaving(true)
    setPwStatus('idle')
    try {
      await changePassword(newPassword)
      setNewPassword('')
      setPwStatus('saved')
      setTimeout(() => setPwStatus('idle'), 3000)
    } catch {
      setPwStatus('error')
    } finally {
      setPwSaving(false)
    }
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const base64 = await cropToSquareBase64(file)
    setPreviewLogo(base64)
    e.target.value = ''
  }

  const handleSaveLogo = async () => {
    if (!previewLogo) return
    setLogoSaving(true)
    setLogoStatus('idle')
    try {
      await updateLogo(previewLogo)
      setCurrentLogo(previewLogo)
      setPreviewLogo(null)
      setLogoStatus('saved')
      setTimeout(() => setLogoStatus('idle'), 3000)
    } catch {
      setLogoStatus('error')
    } finally {
      setLogoSaving(false)
    }
  }

  const displayLogo = previewLogo ?? currentLogo

  return (
    <Layout>
      <div className="space-y-6 max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900">{t('adminSection')}</h1>

        {/* Logo */}
        <Section title={t('logoSettings')}>
          <div className="flex items-center gap-5">
            <div
              className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {displayLogo ? (
                <img src={displayLogo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <div className="space-y-2 flex-1">
              <p className="text-xs text-gray-400">{t('logoHint')}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('uploadLogo')}
                </button>
                {previewLogo && (
                  <button
                    type="button"
                    onClick={handleSaveLogo}
                    disabled={logoSaving}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {logoSaving ? t('saving') : t('saveChanges')}
                  </button>
                )}
                {logoStatus === 'saved' && (
                  <span className="text-sm text-green-600 font-medium">{t('logoSaved')}</span>
                )}
                {logoStatus === 'error' && (
                  <span className="text-sm text-red-600">Failed to save.</span>
                )}
              </div>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </Section>

        {/* Company Settings */}
        <Section title={t('companySettings')}>
          <form onSubmit={handleSaveName} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('companyNameLabel')}
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={nameSaving}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {nameSaving ? t('saving') : t('saveChanges')}
              </button>
              {nameStatus === 'saved' && (
                <span className="text-sm text-green-600 font-medium">{t('saved')}</span>
              )}
              {nameStatus === 'error' && (
                <span className="text-sm text-red-600">Failed to save.</span>
              )}
            </div>
          </form>
        </Section>

        {/* Password */}
        <Section title={t('changePassword')}>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('newPassword')}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">Minimum 8 characters</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={pwSaving}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {pwSaving ? t('saving') : t('updatePassword')}
              </button>
              {pwStatus === 'saved' && (
                <span className="text-sm text-green-600 font-medium">{t('passwordUpdated')}</span>
              )}
              {pwStatus === 'error' && (
                <span className="text-sm text-red-600">Failed to update.</span>
              )}
            </div>
          </form>
        </Section>

        {/* Employees */}
        <Section title="Employees">
          <p className="text-xs text-gray-400 -mt-2">Add team members to assign tasks to them.</p>

          {/* Employee list */}
          {employees.length > 0 && (
            <div className="space-y-2">
              {employees.map((emp) => (
                <div key={emp.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                  {editingEmp?.id === emp.id ? (
                    <>
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={editEmpName}
                          onChange={(e) => setEditEmpName(e.target.value)}
                          placeholder="Name"
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <input
                          type="text"
                          value={editEmpRole}
                          onChange={(e) => setEditEmpRole(e.target.value)}
                          placeholder="Role (optional)"
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button onClick={handleSaveEmp} className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-2">Save</button>
                      <button onClick={() => setEditingEmp(null)} className="text-xs text-gray-400 hover:text-gray-600 px-2">Cancel</button>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{emp.name}</p>
                        {emp.role && <p className="text-xs text-gray-400 truncate">{emp.role}</p>}
                      </div>
                      <button onClick={() => startEditEmp(emp)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      {deletingEmpId === emp.id ? (
                        <div className="flex items-center gap-1.5 bg-red-50 rounded-lg px-2 py-1">
                          <span className="text-xs text-red-600 font-medium">Delete?</span>
                          <button onClick={() => handleDeleteEmp(emp.id)} className="text-xs font-bold text-red-600 hover:text-red-800">✓</button>
                          <button onClick={() => setDeletingEmpId(null)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeletingEmpId(emp.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add employee form */}
          {showEmpForm ? (
            <form onSubmit={handleAddEmployee} className="space-y-2 pt-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  required
                  placeholder="Full name"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <input
                  type="text"
                  value={empRole}
                  onChange={(e) => setEmpRole(e.target.value)}
                  placeholder="Role (optional)"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={empAdding || !empName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {empAdding ? 'Adding...' : 'Add Employee'}
                </button>
                <button type="button" onClick={() => { setShowEmpForm(false); setEmpName(''); setEmpRole('') }}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowEmpForm(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Employee
            </button>
          )}
        </Section>

        {/* Language */}
        <Section title={t('languageSettings')}>
          <div className="flex gap-2">
            {(['en', 'de'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                  lang === l
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {l === 'en' ? '🇬🇧 English' : '🇩🇪 Deutsch'}
              </button>
            ))}
          </div>
        </Section>
      </div>
    </Layout>
  )
}
