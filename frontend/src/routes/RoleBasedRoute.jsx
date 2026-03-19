import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function RoleBasedRoute({ allow = [] }) {
  const { user } = useAuth()
  const role = user?.role

  if (!role) return <Navigate to="/login" replace />
  if (allow.length > 0 && !allow.includes(role)) {
    return <Navigate to={role === 'admin' ? '/admin' : '/intern'} replace />
  }

  return <Outlet />
}

