import client from './client'
import type { CompanyStats, Feedback, QRCode } from '../types'

export const getProfile = () =>
  client.get<import('../types').Company>('/api/company/profile').then((r) => r.data)

export const updateProfile = (name: string) =>
  client.patch<import('../types').Company>('/api/company/profile', { name }).then((r) => r.data)

export const updateLogo = (logo_base64: string) =>
  client.patch<import('../types').Company>('/api/company/profile/logo', { logo_base64 }).then((r) => r.data)

export const getDashboard = () =>
  client.get<CompanyStats>('/api/company/dashboard').then((r) => r.data)

export const getFeedback = (page = 1, page_size = 20) =>
  client.get<Feedback[]>('/api/company/feedback', { params: { page, page_size } }).then((r) => r.data)

export const getFeedbackStats = () =>
  client.get('/api/company/feedback/stats').then((r) => r.data)

export const getQRCodes = () =>
  client.get<QRCode[]>('/api/company/qr-codes').then((r) => r.data)

export const createQRCode = (label: string) =>
  client.post<QRCode>('/api/company/qr-codes', { label }).then((r) => r.data)

export const getQRCodeImage = (id: string) =>
  client.get<QRCode>(`/api/company/qr-codes/${id}/image`).then((r) => r.data)

export const updateQRCode = (id: string, label: string) =>
  client.patch<QRCode>(`/api/company/qr-codes/${id}`, { label }).then((r) => r.data)

export const getQRCodeStats = (id: string) =>
  client.get<import('../types').FeedbackStats>(`/api/company/qr-codes/${id}/stats`).then((r) => r.data)

export const getFeedbackHighlights = () =>
  client.get<import('../types').FeedbackHighlights>('/api/company/feedback/highlights').then((r) => r.data)

export const getFeedbackTimeline = (qrId?: string) =>
  client.get<import('../types').FeedbackTimeline>('/api/company/feedback/timeline', {
    params: qrId ? { qr_id: qrId } : {},
  }).then((r) => r.data)

export const deleteQRCode = (id: string) =>
  client.delete(`/api/company/qr-codes/${id}`)

export const generateFeedbackSummary = (date_from: string, date_to: string, categories: string[]) =>
  client.post<{ summary: string; feedback_count: number }>('/api/company/feedback/summary', {
    date_from,
    date_to,
    categories,
  }).then((r) => r.data)
