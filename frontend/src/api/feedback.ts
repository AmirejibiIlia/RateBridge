import client from './client'
import type { QRCodePublicInfo, Feedback } from '../types'

export const getQRInfo = (uuid: string) =>
  client.get<QRCodePublicInfo>(`/api/feedback/${uuid}`).then((r) => r.data)

export const submitFeedback = (uuid: string, rating: number, comment?: string) =>
  client.post<Feedback>(`/api/feedback/${uuid}`, { rating, comment }).then((r) => r.data)
