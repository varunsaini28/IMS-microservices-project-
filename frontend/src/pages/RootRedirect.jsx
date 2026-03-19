import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function RootRedirect() {
  const { user, accessToken } = useAuth()
  if (!accessToken) return <Navigate to="/login" replace />
  return <Navigate to={user?.role === 'admin' ? '/admin' : '/intern'} replace />
}

