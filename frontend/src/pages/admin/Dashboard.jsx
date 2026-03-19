import { useQuery } from '@tanstack/react-query'
import { Plus, Send, UserCheck } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { analyticsApi } from '../../services/analyticsApi'
import { auditApi } from '../../services/auditApi'
import { notificationsApi } from '../../services/notificationsApi'
import { projectsApi } from '../../services/projectsApi'
import { tasksApi } from '../../services/tasksApi'
import Skeleton from '../../components/ui/Skeleton'

export default function Dashboard() {
  const overall = useQuery({ queryKey: ['analytics', 'overall'], queryFn: analyticsApi.overall })
  const projects = useQuery({ queryKey: ['projects'], queryFn: projectsApi.list })
  const leaves = useQuery({ queryKey: ['leaves', 'all'], queryFn: () => tasksApi.leavesAll() })
  const audit = useQuery({
    queryKey: ['audit', { limit: 5, page: 1 }],
    queryFn: () => auditApi.list({ limit: 5, page: 1 }),
  })
  const notifications = useQuery({
    queryKey: ['notifications', 'latest'],
    queryFn: () => notificationsApi.list(),
    select: (data) => (Array.isArray(data) ? data.slice(0, 5) : data),
    refetchInterval: 30_000,
  })

  const stats = overall.data ?? {}
  const pendingLeaves = (leaves.data ?? []).filter((l) => l.status === 'pending').length
  const activeProjects = (projects.data ?? []).filter((p) => (p.status || '').toLowerCase() !== 'completed')
    .length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Overview, activity, and quick actions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline">
            <Plus className="h-4 w-4" />
            Create Project
          </Button>
          <Button variant="outline">
            <UserCheck className="h-4 w-4" />
            Mark Attendance
          </Button>
          <Button>
            <Send className="h-4 w-4" />
            Send Bulk Email
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <div className="text-xs font-semibold text-slate-500">Total interns</div>
          {overall.isLoading ? (
            <Skeleton className="mt-2 h-7 w-16" />
          ) : (
            <div className="mt-2 text-2xl font-semibold">{stats.active_interns ?? '—'}</div>
          )}
        </Card>
        <Card>
          <div className="text-xs font-semibold text-slate-500">Active projects</div>
          {projects.isLoading ? (
            <Skeleton className="mt-2 h-7 w-16" />
          ) : (
            <div className="mt-2 text-2xl font-semibold">{activeProjects}</div>
          )}
        </Card>
        <Card>
          <div className="text-xs font-semibold text-slate-500">Pending leaves</div>
          {leaves.isLoading ? (
            <Skeleton className="mt-2 h-7 w-16" />
          ) : (
            <div className="mt-2 text-2xl font-semibold">{pendingLeaves}</div>
          )}
        </Card>
        <Card>
          <div className="text-xs font-semibold text-slate-500">Tasks completed (30d)</div>
          {overall.isLoading ? (
            <Skeleton className="mt-2 h-7 w-24" />
          ) : (
            <div className="mt-2 text-2xl font-semibold">{stats.total_tasks_completed ?? '—'}</div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Recent audit events</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Last 5 events</div>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {audit.isLoading ? (
              <>
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </>
            ) : (
              (audit.data?.logs ?? []).slice(0, 5).map((l) => (
                <div key={l._id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-800">
                  <div className="truncate">
                    <span className="font-medium">{l.routingKey}</span>
                    <span className="ml-2 text-slate-500 dark:text-slate-400">
                      {new Date(l.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
            {!audit.isLoading && (audit.data?.logs ?? []).length === 0 ? (
              <div className="text-sm text-slate-500">No audit events yet.</div>
            ) : null}
          </div>
        </Card>

        <Card>
          <div className="text-sm font-semibold">Recent notifications</div>
          <div className="mt-3 space-y-2">
            {notifications.isLoading ? (
              <>
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </>
            ) : (
              (notifications.data ?? []).slice(0, 5).map((n) => (
                <div
                  key={n._id}
                  className="rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-800"
                >
                  <div className="font-medium">{n.title || n.subject || 'Notification'}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(n.createdAt || Date.now()).toLocaleString()}
                  </div>
                </div>
              ))
            )}
            {!notifications.isLoading && (notifications.data ?? []).length === 0 ? (
              <div className="text-sm text-slate-500">No notifications.</div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  )
}

