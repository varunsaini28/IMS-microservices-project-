import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Card from '../../components/ui/Card'
import { authApi } from '../../services/authApi'
import { useAuth } from '../../hooks/useAuth'

const schema = z.object({
  otp: z.string().min(6, 'Enter the 6-digit code').max(6, 'Enter the 6-digit code'),
})

export default function VerifyOtp() {
  const [params] = useSearchParams()
  const email = useMemo(() => params.get('email') || '', [params])
  const navigate = useNavigate()
  const { login } = useAuth()
  const [resending, setResending] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { otp: '' },
  })

  const onSubmit = async ({ otp }) => {
    try {
      const data = await authApi.registerVerify({ email, otp })
      login(data)
      toast.success('Account verified')
      navigate(data?.user?.role === 'admin' ? '/admin' : '/intern', { replace: true })
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Verification failed')
    }
  }

  const onResend = async () => {
    if (!email) return toast.error('Missing email')
    setResending(true)
    try {
      await authApi.resendOtp({ email })
      toast.success('New code sent')
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Resend failed')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Verify OTP</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Enter the 6-digit code sent to <span className="font-medium">{email || 'your email'}</span>.
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="text-sm font-medium">Verification code</label>
            <Input inputMode="numeric" autoComplete="one-time-code" {...register('otp')} />
            {errors.otp ? (
              <div className="mt-1 text-sm text-rose-600">{errors.otp.message}</div>
            ) : null}
          </div>

          <Button type="submit" disabled={isSubmitting || !email} className="w-full">
            {isSubmitting ? 'Verifying…' : 'Verify'}
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={onResend}
            disabled={resending || !email}
            className="font-medium text-violet-600 hover:underline disabled:opacity-60"
          >
            {resending ? 'Sending…' : 'Resend code'}
          </button>
          <Link className="text-slate-600 hover:underline dark:text-slate-300" to="/login">
            Back to login
          </Link>
        </div>
      </Card>
    </div>
  )
}

