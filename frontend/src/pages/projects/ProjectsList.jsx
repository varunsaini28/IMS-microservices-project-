import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { projectsApi } from '../../services/projectsApi'
import { authApi } from '../../services/authApi'
import { useAuth } from '../../hooks/useAuth'

export default function ProjectsList() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()

  const [q, setQ] = useState('')
  const projects = useQuery({ queryKey: ['projects'], queryFn: projectsApi.list })
  const managers = useQuery({
    queryKey: ['users', { role: 'manager' }],
    queryFn: () => authApi.listUsers({ role: 'manager' }),
    enabled: isAdmin,
  })

  const rows = useMemo(() => {
    const all = projects.data ?? []
    const needle = q.trim().toLowerCase()
    if (!needle) return all
    return all.filter((p) => `${p.name ?? ''} ${p.description ?? ''}`.toLowerCase().includes(needle))
  }, [projects.data, q])

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [managerId, setManagerId] = useState('')
  const [status, setStatus] = useState('planning')

  const create = useMutation({
    mutationFn: () =>
      projectsApi.create({
        name,
        description,
        start_date: startDate || null,
        end_date: endDate || null,
        manager_id: managerId || null,
        status,
      }),
    onSuccess: () => {
      toast.success('Project created')
      setOpen(false)
      setName('')
      setDescription('')
      setStartDate('')
      setEndDate('')
      setManagerId('')
      setStatus('planning')
      qc.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'Create failed'),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isAdmin ? 'Manage projects and assignments.' : 'Projects you are assigned to.'}
          </p>
        </div>
        {isAdmin ? <Button onClick={() => setOpen(true)}>Create Project</Button> : null}
      </div>

      <Card>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects…" />
        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Start</th>
                <th className="px-2 py-2">End</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="px-2 py-2">
                    <Link className="font-medium text-violet-600 hover:underline" to={`/projects/${p.id}`}>
                      {p.name}
                    </Link>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[60ch]">
                      {p.description || ''}
                    </div>
                  </td>
                  <td className="px-2 py-2">{p.status || '—'}</td>
                  <td className="px-2 py-2">{p.start_date ? String(p.start_date).slice(0, 10) : '—'}</td>
                  <td className="px-2 py-2">{p.end_date ? String(p.end_date).slice(0, 10) : '—'}</td>
                  <td className="px-2 py-2">
                    <Link to={`/projects/${p.id}`}>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {projects.isLoading ? <div className="mt-3 text-sm text-slate-500">Loading…</div> : null}
          {!projects.isLoading && rows.length === 0 ? (
            <div className="mt-3 text-sm text-slate-500">No projects found.</div>
          ) : null}
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create project"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => create.mutate()} disabled={!name || create.isPending}>
              {create.isPending ? 'Creating…' : 'Create'}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="min-h-28 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Start date</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">End date</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Manager</label>
            <select
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
            >
              <option value="">(default)</option>
              {(managers.data ?? []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Status</label>
            <select
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="planning">Planning</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}

