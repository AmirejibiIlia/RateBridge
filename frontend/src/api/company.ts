import client from './client'
import type { CompanyStats, Feedback, QRCode } from '../types'

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

export const getFeedbackTimeline = () =>
  client.get<import('../types').FeedbackTimeline>('/api/company/feedback/timeline').then((r) => r.data)

export const deleteQRCode = (id: string) =>
  client.delete(`/api/company/qr-codes/${id}`)
