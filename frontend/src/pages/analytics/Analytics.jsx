import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import { useAuth } from '../../hooks/useAuth'
import { analyticsApi } from '../../services/analyticsApi'
import { authApi } from '../../services/authApi'
import { projectsApi } from '../../services/projectsApi'

export default function Analytics() {
  const { user, isAdmin } = useAuth()
  const [internId, setInternId] = useState(user?.id || '')
  const [projectId, setProjectId] = useState('')
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 14), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const interns = useQuery({
    queryKey: ['users', { role: 'intern' }],
    queryFn: () => authApi.listUsers({ role: 'intern' }),
    enabled: isAdmin,
  })
  const projects = useQuery({ queryKey: ['projects'], queryFn: projectsApi.list, enabled: isAdmin })

  const productivity = useQuery({
    queryKey: ['analytics', 'productivity', { internId, startDate, endDate }],
    queryFn: () => analyticsApi.internProductivity({ internId, startDate, endDate }),
    enabled: Boolean(internId && startDate && endDate),
  })

  const projectProgress = useQuery({
    queryKey: ['analytics', 'projectProgress', { projectId }],
    queryFn: () => analyticsApi.projectProgress({ projectId }),
    enabled: isAdmin && Boolean(projectId),
  })

  const data = useMemo(() => productivity.data ?? [], [productivity.data])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Productivity, work hours, and progress.
        </p>
      </div>

      <Card>
        <div className="grid gap-3 md:grid-cols-4">
          {isAdmin ? (
            <div>
              <label className="text-sm font-medium">Intern</label>
              <select
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
                value={internId}
                onChange={(e) => setInternId(e.target.value)}
              >
                <option value="">Select…</option>
                {(interns.data ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div>
            <label className="text-sm font-medium">Start</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">End</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          {isAdmin ? (
            <div>
              <label className="text-sm font-medium">Project progress</label>
              <select
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="">(optional)</option>
                {(projects.data ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="text-sm font-semibold">Tasks completed</div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="tasks_completed" stroke="#7c3aed" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {productivity.isLoading ? <div className="text-sm text-slate-500">Loading…</div> : null}
        </Card>

        <Card>
          <div className="text-sm font-semibold">Work hours</div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="work_hours" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {isAdmin && projectId ? (
        <Card>
          <div className="text-sm font-semibold">Project progress (raw)</div>
          <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-900">
            {JSON.stringify(projectProgress.data ?? {}, null, 2)}
          </pre>
          {projectProgress.isLoading ? <div className="text-sm text-slate-500">Loading…</div> : null}
        </Card>
      ) : null}
    </div>
  )
}

