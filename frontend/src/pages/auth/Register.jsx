import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Card from '../../components/ui/Card'
import { authApi } from '../../services/authApi'

const schema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default function Register() {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', password: '' },
  })

  const onSubmit = async (values) => {
    try {
      const data = await authApi.registerInitiate(values)
      toast.success('OTP sent to your email')
      navigate(`/verify-otp?email=${encodeURIComponent(data.email || values.email)}`)
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Registration failed')
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Create account</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Register as an intern (OTP verification).
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="text-sm font-medium">Full name</label>
            <Input autoComplete="name" {...register('fullName')} />
            {errors.fullName ? (
              <div className="mt-1 text-sm text-rose-600">{errors.fullName.message}</div>
            ) : null}
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <Input type="email" autoComplete="email" {...register('email')} />
            {errors.email ? (
              <div className="mt-1 text-sm text-rose-600">{errors.email.message}</div>
            ) : null}
          </div>

          <div>
            <label className="text-sm font-medium">Password</label>
            <Input type="password" autoComplete="new-password" {...register('password')} />
            {errors.password ? (
              <div className="mt-1 text-sm text-rose-600">{errors.password.message}</div>
            ) : null}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Sending OTP…' : 'Continue'}
          </Button>
        </form>

        <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">
          Already have an account?{' '}
          <Link className="font-medium text-violet-600 hover:underline" to="/login">
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  )
}

