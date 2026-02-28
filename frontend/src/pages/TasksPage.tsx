import { useState, useEffect, FormEvent } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import Layout from '../components/Layout'
import { useLanguage } from '../context/LanguageContext'
import { getTasks, getTaskStats, createTask, updateTask, deleteTask } from '../api/tasks'
import { getEmployees } from '../api/employees'
import type { Task, TaskStats, TaskStatus, Employee } from '../types'

const STATUS_ORDER: TaskStatus[] = ['backlog', 'in_progress', 'resolved', 'rejected']

const STATUS_COLORS: Record<TaskStatus, string> = {
  backlog: '#9ca3af',
  in_progress: '#3b82f6',
  resolved: '#22c55e',
  rejected: '#f87171',
}

const STATUS_STYLES: Record<TaskStatus, string> = {
  backlog: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
}

const STATUS_CARD: Record<TaskStatus, { bg: string; text: string; border: string; bar: string }> = {
  backlog:     { bg: 'bg-gray-50',   text: 'text-gray-700',  border: 'border-gray-200',  bar: 'bg-gray-400'  },
  in_progress: { bg: 'bg-blue-50',   text: 'text-blue-700',  border: 'border-blue-200',  bar: 'bg-blue-500'  },
  resolved:    { bg: 'bg-green-50',  text: 'text-green-700', border: 'border-green-200', bar: 'bg-green-500' },
  rejected:    { bg: 'bg-red-50',    text: 'text-red-600',   border: 'border-red-200',   bar: 'bg-red-400'   },
}

function statusDot(status: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    backlog: 'bg-gray-400', in_progress: 'bg-blue-500',
    resolved: 'bg-green-500', rejected: 'bg-red-400',
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
  const [employees, setEmployees] = useState<Employee[]>([])

  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newStatus, setNewStatus] = useState<TaskStatus>('backlog')
  const [newAssignee, setNewAssignee] = useState('')
  const [creating, setCreating] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({ title: '', description: '' })
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadAll = async () => {
    const [t2, s] = await Promise.all([getTasks(), getTaskStats()])
    setTasks(t2)
    setStats(s)
  }

  useEffect(() => {
    loadAll().finally(() => setLoading(false))
    getEmployees().then(setEmployees).catch(() => {})
  }, [])

  const visibleTasks = filter ? tasks.filter((t) => t.status === filter) : tasks

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      await createTask({ title: newTitle.trim(), description: newDesc.trim() || undefined, status: newStatus, assigned_to_id: newAssignee || null })
      setNewTitle(''); setNewDesc(''); setNewStatus('backlog'); setNewAssignee(''); setShowCreate(false)
      await loadAll()
    } finally { setCreating(false) }
  }

  const handleStatusChange = async (task: Task, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status } : t))
    await updateTask(task.id, { status })
    setStats(await getTaskStats())
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

  // Derived analytics
  const total = stats?.total ?? 0
  const actionable = total - (stats?.rejected ?? 0)
  const resolutionRate = actionable > 0 ? Math.round(((stats?.resolved ?? 0) / actionable) * 100) : 0
  const openCount = (stats?.backlog ?? 0) + (stats?.in_progress ?? 0)

  const pieData = stats
    ? STATUS_ORDER
        .map((s) => ({ name: statusLabel(s), value: stats[s as keyof TaskStats] as number, color: STATUS_COLORS[s] }))
        .filter((d) => d.value > 0)
    : []

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

        {/* Analytics panel */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

            {/* Donut chart */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center justify-center">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 self-start">{t('taskIssuesOverview')}</h3>
              {total === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                  <p className="text-sm">{t('taskNoTasks')}</p>
                </div>
              ) : (
                <>
                  <div className="relative w-full" style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={62}
                          outerRadius={88}
                          paddingAngle={pieData.length > 1 ? 3 : 0}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                          formatter={(v: number, name: string) => [v, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-bold text-gray-900">{total}</span>
                      <span className="text-xs text-gray-400 font-medium mt-0.5">{t('taskFilterAll').toLowerCase()}</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 w-full">
                    {STATUS_ORDER.map((s) => {
                      const val = stats?.[s as keyof TaskStats] as number ?? 0
                      return (
                        <button
                          key={s}
                          onClick={() => setFilter(filter === s ? null : s)}
                          className={`flex items-center gap-2 text-left rounded-lg px-2 py-1 transition-colors ${filter === s ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: STATUS_COLORS[s] }} />
                          <span className="text-xs text-gray-600 flex-1">{statusLabel(s)}</span>
                          <span className="text-xs font-bold text-gray-800">{val}</span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Right panel: stat cards + resolution rate */}
            <div className="lg:col-span-3 flex flex-col gap-4">

              {/* 2×2 status cards */}
              <div className="grid grid-cols-2 gap-3">
                {STATUS_ORDER.map((s) => {
                  const val = stats?.[s as keyof TaskStats] as number ?? 0
                  const pct = total > 0 ? Math.round((val / total) * 100) : 0
                  const c = STATUS_CARD[s]
                  return (
                    <button
                      key={s}
                      onClick={() => setFilter(filter === s ? null : s)}
                      className={`rounded-xl border p-4 text-left transition-all ${c.bg} ${c.border} ${
                        filter === s ? 'ring-2 ring-blue-400 ring-offset-1' : 'hover:shadow-sm'
                      }`}
                    >
                      <p className="text-xs font-medium text-gray-500 mb-2">{statusLabel(s)}</p>
                      <p className={`text-3xl font-bold ${c.text}`}>{val}</p>
                      {/* Mini bar */}
                      <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${c.bar}`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{pct}% {t('taskOfTotal')}</p>
                    </button>
                  )
                })}
              </div>

              {/* Resolution rate */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-700">{t('taskResolutionRate')}</p>
                  <span className={`text-2xl font-bold ${resolutionRate >= 70 ? 'text-green-600' : resolutionRate >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                    {resolutionRate}%
                  </span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      resolutionRate >= 70 ? 'bg-green-500' : resolutionRate >= 40 ? 'bg-amber-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${resolutionRate}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {stats?.resolved ?? 0} resolved · {openCount} {t('taskOpenIssues')}
                </p>
              </div>

            </div>
          </div>
        )}

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
              <div className="flex items-center gap-3 flex-wrap">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as TaskStatus)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>{statusLabel(s)}</option>
                  ))}
                </select>
                {employees.length > 0 && (
                  <select
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('taskUnassigned')}</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name}{emp.role ? ` · ${emp.role}` : ''}</option>
                    ))}
                  </select>
                )}
                <button
                  type="submit"
                  disabled={creating || !newTitle.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {creating ? '...' : t('taskAddTask')}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                  {t('taskCancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {([null, ...STATUS_ORDER] as (TaskStatus | null)[]).map((s) => (
            <button
              key={String(s)}
              onClick={() => setFilter(filter === s ? null : s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === null ? t('taskFilterAll') : statusLabel(s)}
              <span className="ml-1.5 opacity-60">
                {s === null ? total : (stats?.[s as keyof TaskStats] as number ?? 0)}
              </span>
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
                      <button onClick={() => saveEdit(task)} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                        {t('taskSave')}
                      </button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                        {t('taskCancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${statusDot(task.status)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 leading-snug">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <p className="text-xs text-gray-400">{t('taskCreated')} {relativeDate(task.created_at)}</p>
                        {employees.length > 0 && (
                          <select
                            value={task.assigned_to_id ?? ''}
                            onChange={(e) => updateTask(task.id, { assigned_to_id: e.target.value || null }).then(loadAll)}
                            className="text-xs text-gray-500 border-0 bg-transparent cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-0"
                          >
                            <option value="">{t('taskUnassigned')}</option>
                            {employees.map((emp) => (
                              <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                          </select>
                        )}
                        {task.assigned_to_name && employees.length === 0 && (
                          <span className="text-xs text-blue-600 font-medium">{task.assigned_to_name}</span>
                        )}
                      </div>
                    </div>

                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                      className={`text-xs font-semibold rounded-full px-3 py-1 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 ${STATUS_STYLES[task.status]}`}
                    >
                      {STATUS_ORDER.map((s) => (
                        <option key={s} value={s}>{statusLabel(s)}</option>
                      ))}
                    </select>

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
                          <button onClick={() => handleDelete(task.id)} className="text-xs font-bold text-red-600 hover:text-red-800">✓</button>
                          <button onClick={() => setDeletingId(null)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
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
