import client from './client'
import type { CompanyStats, Feedback } from '../types'

export const getCompanies = () =>
  client.get<CompanyStats[]>('/api/superadmin/companies').then((r) => r.data)

export const getAllFeedback = (page = 1, page_size = 50) =>
  client.get<Feedback[]>('/api/superadmin/feedback', { params: { page, page_size } }).then((r) => r.data)
