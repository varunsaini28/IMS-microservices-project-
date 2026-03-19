import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  CalendarDays,
  ClipboardCheck,
  FolderKanban,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { cn } from '../../utils/helpers'
import { useAuth } from '../../hooks/useAuth'

function Item({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
          isActive
            ? 'bg-violet-600 text-white'
            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900'
        )
      }
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </NavLink>
  )
}

export default function Sidebar({ collapsed = false, onToggle }) {
  const { isAdmin } = useAuth()

  return (
    <aside
      className={cn(
        'h-full flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950',
        collapsed ? 'w-16' : 'w-64',
        'flex'
      )}
    >
      <div className="flex items-center justify-between gap-2 p-4">
        <div className={cn('font-semibold tracking-tight', collapsed && 'sr-only')}>
          Intern MS
        </div>
        <button
          onClick={onToggle}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
          aria-label="Toggle sidebar"
        >
          <LayoutDashboard className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 pb-4">
        <div className={cn('px-2 pb-2 text-xs font-semibold text-slate-500', collapsed && 'sr-only')}>
          Overview
        </div>
        <Item to={isAdmin ? '/admin' : '/intern'} icon={LayoutDashboard} label="Dashboard" />
        <Item to="/tasks" icon={ClipboardCheck} label="Tasks" />
        <Item to="/projects" icon={FolderKanban} label="Projects" />
        <Item to="/analytics" icon={BarChart3} label="Analytics" />
        <Item to="/notifications" icon={Bell} label="Notifications" />
        <Item to="/calendar" icon={CalendarDays} label="Calendar" />

        {isAdmin ? (
          <>
            <div className={cn('pt-4 px-2 pb-2 text-xs font-semibold text-slate-500', collapsed && 'sr-only')}>
              Admin
            </div>
            <Item to="/admin/users" icon={Users} label="Users" />
            <Item to="/admin/bulk-assign" icon={ClipboardCheck} label="Bulk assign" />
            <Item to="/admin/audit" icon={ShieldCheck} label="Audit Logs" />
            <Item to="/admin/config/features" icon={Settings} label="Config" />
          </>
        ) : (
          <>
            <div className={cn('pt-4 px-2 pb-2 text-xs font-semibold text-slate-500', collapsed && 'sr-only')}>
              Intern
            </div>
            <Item to="/intern/profile" icon={Users} label="My Profile" />
          </>
        )}
      </nav>
    </aside>
  )
}

