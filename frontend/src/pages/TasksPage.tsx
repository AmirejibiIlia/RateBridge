import { useState, useEffect, FormEvent } from 'react'
import Layout from '../components/Layout'
import { useLanguage } from '../context/LanguageContext'
import { getTasks, getTaskStats, createTask, updateTask, deleteTask } from '../api/tasks'
import type { Task, TaskStats, TaskStatus } from '../types'

const STATUS_ORDER: TaskStatus[] = ['backlog', 'in_progress', 'resolved', 'rejected']


function statusStyle(status: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    backlog: 'bg-gray-100 text-gray-600',
    in_progress: 'bg-blue-100 text-blue-700',
    resolved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-600',
  }
  return map[status]
}

function statusDot(status: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    backlog: 'bg-gray-400',
    in_progress: 'bg-blue-500',
    resolved: 'bg-green-500',
    rejected: 'bg-red-400',
  }
  return map[status]
}

function relativeDate(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff}d ago`
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`
  return new Date(dateStr).toLocaleDateString()
}

interface EditState { title: string; description: string }

export default function TasksPage() {
  const { t } = useLanguage()

  const statusLabel = (status: TaskStatus): string => ({
    backlog: t('taskStatusBacklog'),
    in_progress: t('taskStatusInProgress'),
    resolved: t('taskStatusResolved'),
    rejected: t('taskStatusRejected'),
  }[status])

  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<TaskStatus | null>(null)

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newStatus, setNewStatus] = useState<TaskStatus>('backlog')
  const [creating, setCreating] = useState(false)

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({ title: '', description: '' })

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadAll = async () => {
    const [t2, s] = await Promise.all([getTasks(), getTaskStats()])
    setTasks(t2)
    setStats(s)
  }

  useEffect(() => {
    loadAll().finally(() => setLoading(false))
  }, [])

  const visibleTasks = filter ? tasks.filter((t) => t.status === filter) : tasks

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      await createTask({ title: newTitle.trim(), description: newDesc.trim() || undefined, status: newStatus })
      setNewTitle('')
      setNewDesc('')
      setNewStatus('backlog')
      setShowCreate(false)
      await loadAll()
    } finally {
      setCreating(false)
    }
  }

  const handleStatusChange = async (task: Task, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status } : t))
    await updateTask(task.id, { status })
    const s = await getTaskStats()
    setStats(s)
  }

  const startEdit = (task: Task) => {
    setEditingId(task.id)
    setEditState({ title: task.title, description: task.description ?? '' })
  }

  const saveEdit = async (task: Task) => {
    if (!editState.title.trim()) return
    await updateTask(task.id, { title: editState.title.trim(), description: editState.description.trim() || undefined })
    setEditingId(null)
    await loadAll()
  }

  const handleDelete = async (id: string) => {
    await deleteTask(id)
    setDeletingId(null)
    await loadAll()
  }

  const statCards = [
    { key: null, label: t('taskFilterAll'), value: stats?.total ?? 0, color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' },
    { key: 'backlog' as TaskStatus, label: t('taskStatusBacklog'), value: stats?.backlog ?? 0, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' },
    { key: 'in_progress' as TaskStatus, label: t('taskStatusInProgress'), value: stats?.in_progress ?? 0, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
    { key: 'resolved' as TaskStatus, label: t('taskStatusResolved'), value: stats?.resolved ?? 0, color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
    { key: 'rejected' as TaskStatus, label: t('taskStatusRejected'), value: stats?.rejected ?? 0, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
  ]

  return (
    <Layout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{t('tasks')}</h1>
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            {t('newTask')}
          </button>
        </div>

        {/* Analytics cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {statCards.map(({ key, label, value, color, bg }) => (
            <button
              key={String(key)}
              onClick={() => setFilter(filter === key ? null : key)}
              className={`rounded-xl border p-4 text-left transition-all ${bg} ${
                filter === key ? 'ring-2 ring-blue-400 ring-offset-1' : 'hover:shadow-sm'
              }`}
            >
              <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </button>
          ))}
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">{t('newTask')}</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                placeholder={t('taskTitlePlaceholder')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder={t('taskDescriptionPlaceholder')}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex items-center gap-3">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as TaskStatus)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>{statusLabel(s)}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={creating || !newTitle.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {creating ? '...' : t('taskAddTask')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {t('taskCancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-1.5">
          {statCards.map(({ key, label }) => (
            <button
              key={String(key)}
              onClick={() => setFilter(filter === key ? null : key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === key
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Task list */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-600" />
          </div>
        ) : visibleTasks.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500 font-medium mb-1">{t('taskNoTasks')}</p>
            <p className="text-sm text-gray-400">{t('taskNoTasksHint')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-xl border border-gray-200 px-5 py-4 hover:border-gray-300 transition-colors"
              >
                {editingId === task.id ? (
                  /* ── Edit mode ── */
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editState.title}
                      onChange={(e) => setEditState((s) => ({ ...s, title: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <textarea
                      value={editState.description}
                      onChange={(e) => setEditState((s) => ({ ...s, description: e.target.value }))}
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(task)}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {t('taskSave')}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {t('taskCancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── View mode ── */
                  <div className="flex items-start gap-3">
                    {/* Status dot */}
                    <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${statusDot(task.status)}`} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 leading-snug">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{task.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1.5">{t('taskCreated')} {relativeDate(task.created_at)}</p>
                    </div>

                    {/* Status selector */}
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                      className={`text-xs font-semibold rounded-full px-3 py-1 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 ${statusStyle(task.status)}`}
                    >
                      {STATUS_ORDER.map((s) => (
                        <option key={s} value={s}>{statusLabel(s)}</option>
                      ))}
                    </select>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(task)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title={t('taskEdit')}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      {deletingId === task.id ? (
                        <div className="flex items-center gap-1.5 bg-red-50 rounded-lg px-2 py-1">
                          <span className="text-xs text-red-600 font-medium">{t('taskDeleteConfirm')}</span>
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="text-xs font-bold text-red-600 hover:text-red-800"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingId(task.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title={t('taskDelete')}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
