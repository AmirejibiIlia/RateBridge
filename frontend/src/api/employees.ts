import client from './client'
import type { Employee } from '../types'

export const getEmployees = () =>
  client.get<Employee[]>('/api/employees').then((r) => r.data)

export const createEmployee = (data: { name: string; role?: string }) =>
  client.post<Employee>('/api/employees', data).then((r) => r.data)

export const updateEmployee = (id: string, data: { name?: string; role?: string }) =>
  client.patch<Employee>(`/api/employees/${id}`, data).then((r) => r.data)

export const deleteEmployee = (id: string) =>
  client.delete(`/api/employees/${id}`)
