import { useEffect, useMemo, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { tasksApi } from '../../services/tasksApi'
import { projectsApi } from '../../services/projectsApi'
import { authApi } from '../../services/authApi'
import { useAuth } from '../../hooks/useAuth'
import { exportToCsv } from '../../utils/exportToCsv'
import { exportToPdf } from '../../utils/exportToPdf'
import { useDebounce } from '../../hooks/useDebounce'
import { useLocalStorage } from '../../hooks/useLocalStorage'

const createSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().optional(),
  projectId: z.string().optional(),
  assignedToId: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
})

const DRAFT_KEY = 'ims.draft.createTask'

export default function TasksList() {
  const { isAdmin, user } = useAuth()
  const qc = useQueryClient()

  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const qDebounced = useDebounce(q, 200)
  const [sort, setSort] = useLocalStorage('ims.pref.tasks.sort', { key: 'dueDate', dir: 'asc' })

  const tasks = useQuery({
    queryKey: ['tasks', { status, q: qDebounced }],
    queryFn: () => tasksApi.list({ status: status || undefined, q: qDebounced || undefined }),
    placeholderData: keepPreviousData,
  })

  const projects = useQuery({
    queryKey: ['projects', 'list'],
    queryFn: () => projectsApi.list(),
    enabled: isAdmin,
  })
  const interns = useQuery({
    queryKey: ['users', { role: 'intern' }],
    queryFn: () => authApi.listUsers({ role: 'intern' }),
    enabled: isAdmin,
  })

  const all = useMemo(() => {
    const data = tasks.data
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.tasks)) return data.tasks
    return data ?? []
  }, [tasks.data])

  const filtered = useMemo(() => {
    const needle = qDebounced.trim().toLowerCase()
    let rows = all
    if (status) rows = rows.filter((t) => String(t.status).toLowerCase() === status)
    if (needle) {
      rows = rows.filter((t) => {
        const hay = `${t.title ?? ''} ${t.description ?? ''} ${t.priority ?? ''} ${t.status ?? ''}`.toLowerCase()
        return hay.includes(needle)
      })
    }
    const dir = sort.dir === 'desc' ? -1 : 1
    rows = [...rows].sort((a, b) => {
      const ka = a?.[sort.key]
      const kb = b?.[sort.key]
      if (ka == null && kb == null) return 0
      if (ka == null) return 1
      if (kb == null) return -1
      if (ka > kb) return 1 * dir
      if (ka < kb) return -1 * dir
      return 0
    })
    return rows
  }, [all, qDebounced, sort.dir, sort.key, status])

  const exportRows = useMemo(
    () =>
      filtered.map((t) => ({
        id: t.id || t._id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        assignedTo: t.assignedToEmail || t.assignedTo || t.assignedToId,
      })),
    [filtered]
  )

  const [open, setOpen] = useState(false)
  const [draft, setDraft, clearDraft] = useLocalStorage(DRAFT_KEY, null)

  const form = useForm({
    resolver: zodResolver(createSchema),
    defaultValues: draft ?? {
      title: '',
      description: '',
      projectId: '',
      assignedToId: '',
      dueDate: '',
      priority: 'medium',
    },
  })

  useEffect(() => {
    if (!open) return
    const sub = form.watch((values) => {
      setDraft(values)
    })
    return () => sub.unsubscribe()
  }, [form, open, setDraft])

  const create = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      toast.success('Task created')
      qc.invalidateQueries({ queryKey: ['tasks'] })
      clearDraft()
      setOpen(false)
      form.reset()
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'Create failed'),
  })

  const updateStatus = useMutation({
    mutationFn: tasksApi.updateStatus,
    onSuccess: () => {
      toast.success('Status updated')
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'Update failed'),
  })

  const onSubmit = (values) => {
    const assignee = (interns.data ?? []).find((u) => String(u.id) === String(values.assignedToId))
    create.mutate({
      title: values.title,
      description: values.description,
      projectId: values.projectId || undefined,
      assignedTo: values.assignedToId || undefined,
      assignedToEmail: assignee?.email,
      dueDate: values.dueDate || undefined,
      priority: values.priority,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Filter, sort, update status, export.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => exportToCsv('tasks.csv', exportRows)}
            disabled={exportRows.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              exportToPdf('tasks.pdf', {
                title: 'Tasks',
                columns: ['Title', 'Status', 'Priority', 'Due date', 'Assigned to'],
                rows: filtered.map((t) => [
                  t.title ?? '',
                  t.status ?? '',
                  t.priority ?? '',
                  t.dueDate ? String(t.dueDate).slice(0, 10) : '',
                  t.assignedToEmail || t.assignedTo || '',
                ]),
              })
            }
            disabled={filtered.length === 0}
          >
            Export PDF
          </Button>
          {isAdmin ? <Button onClick={() => setOpen(true)}>Create Task</Button> : null}
        </div>
      </div>

      <Card>
        <div className="grid gap-3 md:grid-cols-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" />
          <select
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
          <select
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
            value={`${sort.key}:${sort.dir}`}
            onChange={(e) => {
              const [key, dir] = e.target.value.split(':')
              setSort({ key, dir })
            }}
          >
            <option value="dueDate:asc">Due date ↑</option>
            <option value="dueDate:desc">Due date ↓</option>
            <option value="priority:asc">Priority ↑</option>
            <option value="priority:desc">Priority ↓</option>
            <option value="status:asc">Status ↑</option>
            <option value="status:desc">Status ↓</option>
          </select>
        </div>

        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Title</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Priority</th>
                <th className="px-2 py-2">Due</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id || t._id} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="px-2 py-2">
                    <Link className="font-medium text-violet-600 hover:underline" to={`/tasks/${t.id || t._id}`}>
                      {t.title || 'Untitled'}
                    </Link>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[50ch]">
                      {t.description || ''}
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <select
                      className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm dark:border-slate-800 dark:bg-slate-950"
                      value={t.status || 'pending'}
                      onChange={(e) => {
                        const next = e.target.value
                        updateStatus.mutate({
                          id: t.id || t._id,
                          status: next,
                          completedByEmail: next === 'completed' ? user?.email : undefined,
                        })
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                  <td className="px-2 py-2">{t.priority || '—'}</td>
                  <td className="px-2 py-2">{t.dueDate ? String(t.dueDate).slice(0, 10) : '—'}</td>
                  <td className="px-2 py-2">
                    <Link to={`/tasks/${t.id || t._id}`}>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {tasks.isLoading ? <div className="mt-3 text-sm text-slate-500">Loading…</div> : null}
          {!tasks.isLoading && filtered.length === 0 ? (
            <div className="mt-3 text-sm text-slate-500">No tasks found.</div>
          ) : null}
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create task"
        footer={
          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={() => { clearDraft(); form.reset(); }}>
              Clear draft
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={form.handleSubmit(onSubmit)} disabled={create.isPending}>
                {create.isPending ? 'Creating…' : 'Create'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Title</label>
            <Input {...form.register('title')} />
            {form.formState.errors.title ? (
              <div className="mt-1 text-sm text-rose-600">{form.formState.errors.title.message}</div>
            ) : null}
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="min-h-28 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-950"
              {...form.register('description')}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Project</label>
            <select
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
              {...form.register('projectId')}
            >
              <option value="">—</option>
              {(projects.data ?? []).map((p) => (
                <option key={p.id || p._id} value={p.id || p._id}>
                  {p.name || p.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Assign to (intern)</label>
            <select
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
              {...form.register('assignedToId')}
            >
              <option value="">—</option>
              {(interns.data ?? []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Due date</label>
            <Input type="date" {...form.register('dueDate')} />
          </div>
          <div>
            <label className="text-sm font-medium">Priority</label>
            <select
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
              {...form.register('priority')}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}

