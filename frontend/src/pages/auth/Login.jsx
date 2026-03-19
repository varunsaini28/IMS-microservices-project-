import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Card from '../../components/ui/Card'
import { authApi } from '../../services/authApi'
import { useAuth } from '../../hooks/useAuth'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const from = useMemo(() => location.state?.from?.pathname, [location.state])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values) => {
    try {
      const data = await authApi.login(values)
      login(data)
      toast.success('Welcome back')
      const roleHome = data?.user?.role === 'admin' ? '/admin' : '/intern'
      navigate(from || roleHome, { replace: true })
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Login failed')
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Use your IMS account.
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input type="email" autoComplete="email" {...register('email')} />
            {errors.email ? (
              <div className="mt-1 text-sm text-rose-600">{errors.email.message}</div>
            ) : null}
          </div>

          <div>
            <label className="text-sm font-medium">Password</label>
            <Input type="password" autoComplete="current-password" {...register('password')} />
            {errors.password ? (
              <div className="mt-1 text-sm text-rose-600">{errors.password.message}</div>
            ) : null}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">
          Don&apos;t have an account?{' '}
          <Link className="font-medium text-violet-600 hover:underline" to="/register">
            Create one
          </Link>
        </div>
      </Card>
    </div>
  )
}

