import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { tasksApi } from '../../services/tasksApi'
import { useAuth } from '../../hooks/useAuth'

export default function TaskDetail() {
  const { id } = useParams()
  const qc = useQueryClient()
  const { isAdmin, user } = useAuth()

  const tasksList = useQuery({ queryKey: ['tasks', 'all'], queryFn: () => tasksApi.list() })
  const taskFromCache = useMemo(() => {
    const rows = Array.isArray(tasksList.data) ? tasksList.data : tasksList.data?.tasks ?? tasksList.data ?? []
    return rows.find((t) => String(t.id || t._id) === String(id)) ?? null
  }, [id, tasksList.data])

  const [status, setStatus] = useState(taskFromCache?.status || 'pending')

  const updateStatus = useMutation({
    mutationFn: (next) =>
      tasksApi.updateStatus({ id, status: next, completedByEmail: next === 'completed' ? user?.email : undefined }),
    onSuccess: () => {
      toast.success('Status updated')
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'Update failed'),
  })

  const worklogs = useQuery({
    queryKey: ['worklogs', { taskId: id, scope: isAdmin ? 'all' : 'me' }],
    queryFn: () => (isAdmin ? tasksApi.worklogsAll({ taskId: id }) : tasksApi.worklogsMe({ taskId: id })),
  })

  const [hours, setHours] = useState('')
  const [desc, setDesc] = useState('')

  const createWorklog = useMutation({
    mutationFn: () =>
      tasksApi.createWorklog({
        taskId: id,
        hours: hours ? Number(hours) : 0,
        description: desc,
      }),
    onSuccess: () => {
      toast.success('Work log added')
      setHours('')
      setDesc('')
      qc.invalidateQueries({ queryKey: ['worklogs'] })
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'Create failed'),
  })

  const t = taskFromCache

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Task</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t?.title || 'Details'} (ID: {id})
        </p>
      </div>

      <Card>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="text-xs font-semibold text-slate-500">Title</div>
            <div className="mt-1 text-base font-semibold">{t?.title || '—'}</div>
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t?.description || '—'}</div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-xs font-semibold text-slate-500">Status</div>
              <select
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
              <Button
                className="mt-2 w-full"
                onClick={() => updateStatus.mutate(status)}
                disabled={updateStatus.isPending}
              >
                {updateStatus.isPending ? 'Saving…' : 'Save status'}
              </Button>
            </div>
            <div className="text-sm">
              <div className="text-xs font-semibold text-slate-500">Priority</div>
              <div className="mt-1">{t?.priority || '—'}</div>
            </div>
            <div className="text-sm">
              <div className="text-xs font-semibold text-slate-500">Due date</div>
              <div className="mt-1">{t?.dueDate ? String(t.dueDate).slice(0, 10) : '—'}</div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Work logs</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Track hours and progress.</div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Input value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Hours (e.g. 2)" />
          <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" className="md:col-span-2" />
          <Button onClick={() => createWorklog.mutate()} disabled={createWorklog.isPending}>
            {createWorklog.isPending ? 'Adding…' : 'Add work log'}
          </Button>
        </div>

        <div className="mt-4 space-y-2">
          {(worklogs.data ?? []).map((wl) => (
            <div key={wl._id} className="rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="font-medium">{wl.hours ?? 0}h</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(wl.loggedAt || wl.createdAt || Date.now()).toLocaleString()}
                </div>
              </div>
              <div className="mt-1 text-slate-600 dark:text-slate-300">{wl.description || wl.workLink || '—'}</div>
            </div>
          ))}
          {worklogs.isLoading ? <div className="text-sm text-slate-500">Loading…</div> : null}
          {!worklogs.isLoading && (worklogs.data ?? []).length === 0 ? (
            <div className="text-sm text-slate-500">No work logs yet.</div>
          ) : null}
        </div>
      </Card>
    </div>
  )
}

