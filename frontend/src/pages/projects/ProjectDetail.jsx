import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { projectsApi } from '../../services/projectsApi'
import { authApi } from '../../services/authApi'
import { useAuth } from '../../hooks/useAuth'

export default function ProjectDetail() {
  const { id } = useParams()
  const { isAdmin } = useAuth()
  const qc = useQueryClient()

  const project = useQuery({ queryKey: ['projects', id], queryFn: () => projectsApi.getById(id) })
  const assigned = useQuery({ queryKey: ['projects', id, 'interns'], queryFn: () => projectsApi.interns(id) })
  const interns = useQuery({
    queryKey: ['users', { role: 'intern' }],
    queryFn: () => authApi.listUsers({ role: 'intern' }),
    enabled: isAdmin,
  })

  const assignedIds = useMemo(() => new Set((assigned.data ?? []).map((x) => String(x.intern_id))), [assigned.data])

  const [open, setOpen] = useState(false)
  const [internId, setInternId] = useState('')

  const assign = useMutation({
    mutationFn: () => projectsApi.assignIntern({ projectId: id, internId }),
    onSuccess: () => {
      toast.success('Intern assigned')
      setOpen(false)
      setInternId('')
      qc.invalidateQueries({ queryKey: ['projects', id, 'interns'] })
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'Assign failed'),
  })

  const remove = useMutation({
    mutationFn: (internIdToRemove) => projectsApi.removeIntern({ projectId: id, internId: internIdToRemove }),
    onSuccess: () => {
      toast.success('Intern removed')
      qc.invalidateQueries({ queryKey: ['projects', id, 'interns'] })
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'Remove failed'),
  })

  const p = project.data

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{p?.name || 'Project'}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{p?.description || ''}</p>
        </div>
        {isAdmin ? <Button onClick={() => setOpen(true)}>Assign intern</Button> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="text-sm font-semibold">Details</div>
          <div className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Status</span><span>{p?.status || '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Start</span><span>{p?.start_date ? String(p.start_date).slice(0, 10) : '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">End</span><span>{p?.end_date ? String(p.end_date).slice(0, 10) : '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Manager</span><span>{p?.manager_id || '—'}</span></div>
          </div>
          {project.isLoading ? <div className="mt-3 text-sm text-slate-500">Loading…</div> : null}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Assigned interns</div>
            <div className="text-xs text-slate-500">{(assigned.data ?? []).length}</div>
          </div>
          <div className="mt-3 space-y-2">
            {(assigned.data ?? []).map((a) => (
              <div key={a.intern_id} className="flex items-center justify-between rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-800">
                <div className="font-medium">{a.intern_id}</div>
                {isAdmin ? (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => remove.mutate(a.intern_id)}
                    disabled={remove.isPending}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            ))}
            {assigned.isLoading ? <div className="text-sm text-slate-500">Loading…</div> : null}
            {!assigned.isLoading && (assigned.data ?? []).length === 0 ? (
              <div className="text-sm text-slate-500">No interns assigned.</div>
            ) : null}
          </div>
        </Card>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Assign intern"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => assign.mutate()} disabled={!internId || assign.isPending}>
              {assign.isPending ? 'Assigning…' : 'Assign'}
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">Intern</label>
          <select
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
            value={internId}
            onChange={(e) => setInternId(e.target.value)}
          >
            <option value="">Select intern…</option>
            {(interns.data ?? [])
              .filter((u) => !assignedIds.has(String(u.id)))
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.email})
                </option>
              ))}
          </select>
        </div>
      </Modal>
    </div>
  )
}

