import client from './client'
import type { TokenResponse, User } from '../types'

export const login = (email: string, password: string) =>
  client.post<TokenResponse>('/api/auth/login', { email, password }).then((r) => r.data)

export const register = (company_name: string, email: string, password: string) =>
  client.post<TokenResponse>('/api/auth/register', { company_name, email, password }).then((r) => r.data)

export const getMe = () =>
  client.get<User>('/api/auth/me').then((r) => r.data)

export const changePassword = (new_password: string) =>
  client.patch('/api/auth/change-password', { new_password })
