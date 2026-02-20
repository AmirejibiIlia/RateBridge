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

export const deleteQRCode = (id: string) =>
  client.delete(`/api/company/qr-codes/${id}`)
