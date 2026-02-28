import client from './client'
import type { PartnershipRequest } from '../types'

export const submitPartnershipRequest = (data: {
  company_name: string
  email: string
  phone: string
}) =>
  client.post<PartnershipRequest>('/api/partnership/request', data).then((r) => r.data)
