import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from 'react-error-boundary'
import ProtectedRoute from './routes/ProtectedRoute'
import RoleBasedRoute from './routes/RoleBasedRoute'
import AppShell from './components/layout/AppShell'
import Loader from './components/ui/Loader'
import RootRedirect from './pages/RootRedirect'
import NotFound from './pages/NotFound'
import Button from './components/ui/Button'

const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))
const VerifyOtp = lazy(() => import('./pages/auth/VerifyOtp'))

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminUsers = lazy(() => import('./pages/admin/Users'))
const AdminAudit = lazy(() => import('./pages/admin/Audit'))
const BulkAssign = lazy(() => import('./pages/admin/BulkAssign'))
const Features = lazy(() => import('./pages/admin/Config/Features'))
const Settings = lazy(() => import('./pages/admin/Config/Settings'))
const Schemas = lazy(() => import('./pages/admin/Config/Schemas'))
const Workflows = lazy(() => import('./pages/admin/Config/Workflows'))
const Permissions = lazy(() => import('./pages/admin/Config/Permissions'))

const InternDashboard = lazy(() => import('./pages/intern/Dashboard'))
const InternProfile = lazy(() => import('./pages/intern/Profile'))

const TasksList = lazy(() => import('./pages/tasks/TasksList'))
const TaskDetail = lazy(() => import('./pages/tasks/TaskDetail'))
const Attendance = lazy(() => import('./pages/tasks/Attendance'))
const Leaves = lazy(() => import('./pages/tasks/Leaves'))

const ProjectsList = lazy(() => import('./pages/projects/ProjectsList'))
const ProjectDetail = lazy(() => import('./pages/projects/ProjectDetail'))

const Analytics = lazy(() => import('./pages/analytics/Analytics'))
const Notifications = lazy(() => import('./pages/notifications/Notifications'))
const Calendar = lazy(() => import('./pages/calendar/Calendar'))

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-100">
        <div className="font-semibold">Something went wrong</div>
        <div className="mt-2 text-sm opacity-90">{error?.message || 'Unexpected error'}</div>
        <div className="mt-4 flex gap-2">
          <Button onClick={resetErrorBoundary}>Try again</Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<div className="p-6"><Loader /></div>}>
        <Routes>
          <Route path="/" element={<RootRedirect />} />

          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />

          {/* Protected app */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/admin" element={<RoleBasedRoute allow={['admin', 'manager']} />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="audit" element={<AdminAudit />} />
                <Route path="bulk-assign" element={<BulkAssign />} />
                <Route path="config">
                  <Route path="features" element={<Features />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="schemas" element={<Schemas />} />
                  <Route path="workflows" element={<Workflows />} />
                  <Route path="permissions" element={<Permissions />} />
                  <Route index element={<Navigate to="features" replace />} />
                </Route>
              </Route>

              <Route path="/intern" element={<RoleBasedRoute allow={['intern']} />}>
                <Route index element={<InternDashboard />} />
                <Route path="profile" element={<InternProfile />} />
              </Route>

              {/* Shared */}
              <Route path="/tasks" element={<TasksList />} />
              <Route path="/tasks/:id" element={<TaskDetail />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/leaves" element={<Leaves />} />
              <Route path="/projects" element={<ProjectsList />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/calendar" element={<Calendar />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}