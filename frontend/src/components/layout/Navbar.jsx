import { Bell, LogOut, Moon, Search, Sun } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useThemePreference } from '../../features/theme/useTheme'
import { useAuth } from '../../hooks/useAuth'
import Button from '../ui/Button'
import { cn } from '../../utils/helpers'
import logo from "../../assets/logo.png";

export default function Navbar({ onOpenMobileMenu, onOpenSearch }) {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useThemePreference()

  const nextTheme =
    theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 w-screen">
      <div className=" flex h-14 max-screen items-center gap-3 px-4">
        <button
          className="md:hidden rounded-lg p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
          onClick={onOpenMobileMenu}
          aria-label="Open menu"
        >
          <span className="block h-0.5 w-5 bg-current" />
          <span className="mt-1 block h-0.5 w-5 bg-current" />
          <span className="mt-1 block h-0.5 w-5 bg-current" />
        </button>
         <div className="flex ">
  <Link
    to={user?.role === 'admin' ? '/admin' : '/intern'}
    className="flex items-center gap-2 font-semibold"
  >
    <img
      src={logo}
      alt="logo"
      className="h-13 w-13  object-cover"
    />
    <span className="text-lg">IMS</span>
  </Link>
</div>

        <div className="flex-1" />

        <Button variant="outline" size="sm" onClick={onOpenSearch} className="hidden md:inline-flex">
          <Search className="h-4 w-4" />
          <span className="text-slate-700 dark:text-slate-200">Search</span>
          <span className="ml-2 rounded border border-slate-200 bg-white px-1 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
            Ctrl K
          </span>
        </Button>

        <Link
          to="/notifications"
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </Link>

        <button
          onClick={() => setTheme(nextTheme)}
          className={cn(
            'rounded-lg p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900'
          )}
          aria-label="Toggle theme"
          title={`Theme: ${theme}`}
        >
          {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>

        <div className="hidden md:flex items-center gap-2">
          <div className="text-right">
            <div className="text-sm font-medium leading-4">{user?.fullName || '—'}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} aria-label="Logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}

