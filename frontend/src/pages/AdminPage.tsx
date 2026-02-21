import { useState, useEffect, FormEvent } from 'react'
import Layout from '../components/Layout'
import { useLanguage } from '../context/LanguageContext'
import { getProfile, updateProfile } from '../api/company'
import { changePassword } from '../api/auth'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <h2 className="text-base font-semibold text-gray-700 border-b border-gray-100 pb-3">{title}</h2>
      {children}
    </div>
  )
}

export default function AdminPage() {
  const { t, lang, setLang } = useLanguage()

  // Company name
  const [companyName, setCompanyName] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameStatus, setNameStatus] = useState<'idle' | 'saved' | 'error'>('idle')

  // Password
  const [newPassword, setNewPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwStatus, setPwStatus] = useState<'idle' | 'saved' | 'error'>('idle')

  useEffect(() => {
    getProfile().then((c) => setCompanyName(c.name))
  }, [])

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

  return (
    <Layout>
      <div className="space-y-6 max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900">{t('adminSection')}</h1>

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
