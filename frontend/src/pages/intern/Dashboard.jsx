import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { differenceInCalendarDays, isAfter, parseISO } from 'date-fns'
import Card from '../../components/ui/Card'
import Skeleton from '../../components/ui/Skeleton'
import { tasksApi } from '../../services/tasksApi'
import { useAuth } from '../../hooks/useAuth'
import Button from '../../components/ui/Button'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { user } = useAuth()

  const tasks = useQuery({ queryKey: ['tasks', 'me'], queryFn: () => tasksApi.list() })
  const attendance = useQuery({ queryKey: ['attendance', 'me'], queryFn: tasksApi.attendanceMe })

  const stats = useMemo(() => {
    const t = Array.isArray(tasks.data) ? tasks.data : tasks.data?.tasks ?? tasks.data ?? []
    const now = new Date()
    const dueSoon = t
      .map((x) => ({ ...x, due: x.dueDate ? parseISO(String(x.dueDate)) : null }))
      .filter((x) => x.due && isAfter(x.due, now))
      .sort((a, b) => a.due - b.due)[0]

    const assignedThisWeek = t.filter((x) => {
      if (!x.createdAt) return false
      return Math.abs(differenceInCalendarDays(new Date(), new Date(x.createdAt))) <= 7
    }).length
    const completed = t.filter((x) => String(x.status).toLowerCase() === 'completed').length

    const a = Array.isArray(attendance.data) ? attendance.data : attendance.data?.attendance ?? attendance.data ?? []
    const present = a.filter((x) => x.status === 'present').length
    const pct = a.length ? Math.round((present / a.length) * 100) : 0

    return {
      assignedThisWeek,
      completed,
      attendancePct: pct,
      nextDeadline: dueSoon?.due ? dueSoon.due.toLocaleDateString() : '—',
    }
  }, [attendance.data, tasks.data])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Welcome{user?.fullName ? `, ${user.fullName}` : ''}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Your internship at a glance.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/tasks">
            <Button variant="outline">My Tasks</Button>
          </Link>
          <Link to="/projects">
            <Button variant="outline">My Projects</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <div className="text-xs font-semibold text-slate-500">Tasks assigned (7d)</div>
          {tasks.isLoading ? <Skeleton className="mt-2 h-7 w-16" /> : <div className="mt-2 text-2xl font-semibold">{stats.assignedThisWeek}</div>}
        </Card>
        <Card>
          <div className="text-xs font-semibold text-slate-500">Tasks completed</div>
          {tasks.isLoading ? <Skeleton className="mt-2 h-7 w-16" /> : <div className="mt-2 text-2xl font-semibold">{stats.completed}</div>}
        </Card>
        <Card>
          <div className="text-xs font-semibold text-slate-500">Attendance</div>
          {attendance.isLoading ? <Skeleton className="mt-2 h-7 w-16" /> : <div className="mt-2 text-2xl font-semibold">{stats.attendancePct}%</div>}
        </Card>
        <Card>
          <div className="text-xs font-semibold text-slate-500">Upcoming deadline</div>
          {tasks.isLoading ? <Skeleton className="mt-2 h-7 w-24" /> : <div className="mt-2 text-2xl font-semibold">{stats.nextDeadline}</div>}
        </Card>
      </div>

      <Card>
        <div className="text-sm font-semibold">Quick links</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/notifications"><Button variant="outline">Notifications</Button></Link>
          <Link to="/attendance"><Button variant="outline">Attendance</Button></Link>
          <Link to="/leaves"><Button variant="outline">Leaves</Button></Link>
          <Link to="/calendar"><Button variant="outline">Calendar</Button></Link>
        </div>
      </Card>
    </div>
  )
}

