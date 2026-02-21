import React, { createContext, useContext, useState } from 'react'

type Lang = 'en' | 'de'

const translations = {
  en: {
    // Nav
    dashboard: 'Dashboard',
    qrCodes: 'QR Codes',
    feedback: 'Feedback',
    superAdmin: 'Super Admin',
    logout: 'Logout',
    // Auth
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    signInSubtitle: 'Sign in to your account',
    noAccount: 'No account?',
    registerCompany: 'Register your company',
    alreadyHaveAccount: 'Already have an account?',
    createAccount: 'Create Account',
    creatingAccount: 'Creating account...',
    companyName: 'Company Name',
    email: 'Email',
    password: 'Password',
    // Dashboard
    overallPerformance: 'Overall performance',
    totalFeedback: 'Total Feedback',
    averageRating: 'Average Rating',
    outOf10: 'out of 10',
    active: 'Active',
    inactive: 'Inactive',
    activeQRCodes: 'Active QR Codes',
    filter: 'Filter:',
    allQRCodes: 'All QR Codes',
    showing: 'Showing:',
    topFeedback: '🏆 Top Feedback',
    needsAttention: '⚠️ Needs Attention',
    noComment: 'No comment',
    byQRCode: 'By QR Code',
    responses: 'responses',
    avg: 'avg',
    noFeedbackYet: 'No feedback yet.',
    shareQRCodes: 'Share your QR codes to start collecting feedback.',
    dailyChart: 'Daily — Last 30 Days',
    weeklyChart: 'Weekly — Last 4 Weeks',
    noDataPeriod: 'No feedback in this period yet.',
    ratingDistribution: 'Rating Distribution',
    // QR Codes page
    generateNew: 'Generate New QR Code',
    labelPlaceholder: 'e.g. Main Entrance, Table 5...',
    create: 'Create',
    creating: 'Creating...',
    noQRCodes: 'No QR codes yet.',
    createOneToStart: 'Create one above to get started.',
    download: 'Download',
    delete: 'Delete',
    deleting: 'Deleting...',
    // Feedback page
    howWouldYouRate: 'How would you rate your experience?',
    commentOptional: 'Comment',
    commentPlaceholder: 'Tell us more about your experience...',
    optional: 'optional',
    submitFeedback: 'Submit Feedback',
    submitting: 'Submitting...',
    thankYou: 'Thank you!',
    feedbackSubmitted: 'Your feedback has been submitted.',
    feedbackClosed: 'Feedback Closed',
    qrInactive: 'This QR code is no longer active.',
    qrNotFound: 'QR Code Not Found',
    // Feedback list
    allFeedback: 'All Feedback',
    rating: 'Rating',
    comment: 'Comment',
    date: 'Date',
    qrName: 'QR Name',
    loadMore: 'Load More',
    // AI Summary
    aiSummary: 'AI Summary',
    dateFrom: 'From',
    dateTo: 'To',
    categoriesLabel: 'Categories',
    categoriesPlaceholder: 'e.g. cleanness, speed, service',
    generateSummary: 'Generate Summary',
    generating: 'Generating...',
    summaryTitle: 'Summary',
    noApiKey: 'AI summary is not configured. Add XAI_API_KEY to backend environment.',
    // Super Admin
    totalCompanies: 'Total Companies',
    globalAvgRating: 'Global Average Rating',
    company: 'Company',
    slug: 'Slug',
    avgRating: 'Avg Rating',
    joined: 'Joined',
    // Admin
    adminSection: 'Admin',
    companySettings: 'Company Settings',
    companyNameLabel: 'Company Name',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    saved: 'Saved!',
    changePassword: 'Change Password',
    newPassword: 'New Password',
    updatePassword: 'Update Password',
    passwordUpdated: 'Password updated!',
    language: 'Language',
    languageSettings: 'Language',
  },
  de: {
    // Nav
    dashboard: 'Dashboard',
    qrCodes: 'QR-Codes',
    feedback: 'Feedback',
    superAdmin: 'Super-Admin',
    logout: 'Abmelden',
    // Auth
    signIn: 'Anmelden',
    signingIn: 'Wird angemeldet...',
    signInSubtitle: 'Bei Ihrem Konto anmelden',
    noAccount: 'Kein Konto?',
    registerCompany: 'Unternehmen registrieren',
    alreadyHaveAccount: 'Bereits ein Konto?',
    createAccount: 'Konto erstellen',
    creatingAccount: 'Wird erstellt...',
    companyName: 'Unternehmensname',
    email: 'E-Mail',
    password: 'Passwort',
    // Dashboard
    overallPerformance: 'Gesamtleistung',
    totalFeedback: 'Gesamtfeedback',
    averageRating: 'Durchschnittsbewertung',
    outOf10: 'von 10',
    active: 'Aktiv',
    inactive: 'Inaktiv',
    activeQRCodes: 'Aktive QR-Codes',
    filter: 'Filter:',
    allQRCodes: 'Alle QR-Codes',
    showing: 'Angezeigt:',
    topFeedback: '🏆 Top-Feedback',
    needsAttention: '⚠️ Verbesserungsbedarf',
    noComment: 'Kein Kommentar',
    byQRCode: 'Nach QR-Code',
    responses: 'Antworten',
    avg: 'Ø',
    noFeedbackYet: 'Noch kein Feedback.',
    shareQRCodes: 'Teilen Sie Ihre QR-Codes, um Feedback zu sammeln.',
    dailyChart: 'Täglich — Letzte 30 Tage',
    weeklyChart: 'Wöchentlich — Letzte 4 Wochen',
    noDataPeriod: 'Noch kein Feedback in diesem Zeitraum.',
    ratingDistribution: 'Bewertungsverteilung',
    // QR Codes page
    generateNew: 'Neuen QR-Code generieren',
    labelPlaceholder: 'z. B. Haupteingang, Tisch 5...',
    create: 'Erstellen',
    creating: 'Wird erstellt...',
    noQRCodes: 'Noch keine QR-Codes.',
    createOneToStart: 'Erstellen Sie oben einen, um zu beginnen.',
    download: 'Herunterladen',
    delete: 'Löschen',
    deleting: 'Wird gelöscht...',
    // Feedback page
    howWouldYouRate: 'Wie bewerten Sie Ihre Erfahrung?',
    commentOptional: 'Kommentar',
    commentPlaceholder: 'Erzählen Sie uns mehr über Ihre Erfahrung...',
    optional: 'optional',
    submitFeedback: 'Feedback senden',
    submitting: 'Wird gesendet...',
    thankYou: 'Vielen Dank!',
    feedbackSubmitted: 'Ihr Feedback wurde übermittelt.',
    feedbackClosed: 'Feedback geschlossen',
    qrInactive: 'Dieser QR-Code ist nicht mehr aktiv.',
    qrNotFound: 'QR-Code nicht gefunden',
    // Feedback list
    allFeedback: 'Alle Feedbacks',
    rating: 'Bewertung',
    comment: 'Kommentar',
    date: 'Datum',
    qrName: 'QR-Name',
    loadMore: 'Mehr laden',
    // AI Summary
    aiSummary: 'KI-Zusammenfassung',
    dateFrom: 'Von',
    dateTo: 'Bis',
    categoriesLabel: 'Kategorien',
    categoriesPlaceholder: 'z. B. Sauberkeit, Geschwindigkeit, Service',
    generateSummary: 'Zusammenfassung erstellen',
    generating: 'Wird erstellt...',
    summaryTitle: 'Zusammenfassung',
    noApiKey: 'KI-Zusammenfassung nicht konfiguriert. XAI_API_KEY fehlt.',
    // Super Admin
    totalCompanies: 'Unternehmen gesamt',
    globalAvgRating: 'Globale Ø-Bewertung',
    company: 'Unternehmen',
    slug: 'Slug',
    avgRating: 'Ø Bewertung',
    joined: 'Beigetreten',
    // Admin
    adminSection: 'Admin',
    companySettings: 'Unternehmenseinstellungen',
    companyNameLabel: 'Unternehmensname',
    saveChanges: 'Änderungen speichern',
    saving: 'Wird gespeichert...',
    saved: 'Gespeichert!',
    changePassword: 'Passwort ändern',
    newPassword: 'Neues Passwort',
    updatePassword: 'Passwort aktualisieren',
    passwordUpdated: 'Passwort aktualisiert!',
    language: 'Sprache',
    languageSettings: 'Sprache',
  },
} as const

type TranslationKey = keyof typeof translations.en

interface LanguageContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem('lang') as Lang) || 'en'
  })

  const switchLang = (l: Lang) => {
    setLang(l)
    localStorage.setItem('lang', l)
  }

  const t = (key: TranslationKey): string => translations[lang][key] ?? key

  return (
    <LanguageContext.Provider value={{ lang, setLang: switchLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
