import client from './client'
import type { CompanyStats, Feedback, PartnershipRequest } from '../types'

export const getCompanies = () =>
  client.get<CompanyStats[]>('/api/superadmin/companies').then((r) => r.data)

export const getAllFeedback = (page = 1, page_size = 50) =>
  client.get<Feedback[]>('/api/superadmin/feedback', { params: { page, page_size } }).then((r) => r.data)

export const getGlobalTimeline = () =>
  client.get<{ date: string; count: number }[]>('/api/superadmin/timeline').then((r) => r.data)

export const getPartnershipPendingCount = () =>
  client.get<{ count: number }>('/api/superadmin/partnership-requests/pending-count').then((r) => r.data.count)

export const getPartnershipRequests = () =>
  client.get<PartnershipRequest[]>('/api/superadmin/partnership-requests').then((r) => r.data)

export const approvePartnershipRequest = (requestId: string, data: { email: string; password: string }) =>
  client.post(`/api/superadmin/partnership-requests/${requestId}/approve`, data).then((r) => r.data)

export const deletePartnershipRequest = (requestId: string) =>
  client.delete(`/api/superadmin/partnership-requests/${requestId}`).then((r) => r.data)
