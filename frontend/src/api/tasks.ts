import client from './client'
import type { Task, TaskStats, TaskStatus } from '../types'

export const getTasks = (status?: TaskStatus) =>
  client.get<Task[]>('/api/tasks', { params: status ? { status } : {} }).then((r) => r.data)

export const getTaskStats = () =>
  client.get<TaskStats>('/api/tasks/stats').then((r) => r.data)

export const createTask = (data: { title: string; description?: string; status?: TaskStatus; assigned_to_id?: string | null }) =>
  client.post<Task>('/api/tasks', data).then((r) => r.data)

export const updateTask = (id: string, data: { title?: string; description?: string; status?: TaskStatus; assigned_to_id?: string | null }) =>
  client.patch<Task>(`/api/tasks/${id}`, data).then((r) => r.data)

export const deleteTask = (id: string) =>
  client.delete(`/api/tasks/${id}`)
