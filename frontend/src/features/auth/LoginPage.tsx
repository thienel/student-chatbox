import { useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/useAuthStore'
import { getErrorMessage } from '@/lib/errors'
import { AuthCard } from './components/AuthCard'
import { useLogin } from '@/api/queries/auth'

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth, accessToken } = useAuthStore()
  const loginMutation = useLogin()

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  // Access success messages passed via navigate state
  const successMessage = location.state?.message

  useEffect(() => {
    if (accessToken) navigate('/home', { replace: true })
  }, [accessToken, navigate])

  const onSubmit = async (data: FormData) => {
    try {
      const result = await loginMutation.mutateAsync(data)
      setAuth(result.accessToken)
      navigate('/', { replace: true })
      window.location.reload()
    } catch (err: any) {
      const msg = getErrorMessage(err, 'Email hoặc mật khẩu không đúng')
      if (msg === 'Vui lòng xác thực email trước khi đăng nhập') {
        navigate('/verify-otp', { state: { email: data.email } })
      } else {
        setError('password', { message: msg })
      }
    }
  }

  return (
    <AuthCard title="Đăng nhập" subtitle="Chào mừng bạn quay lại Folio">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Success alert */}
        {successMessage && (
          <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 text-primary text-xs p-4 rounded-2xl font-mono leading-relaxed">
            <span className="text-base leading-none mt-0.5">✓</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Email field */}
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="font-mono text-[10px] uppercase tracking-widest text-[hsl(51,3%,41%)] ml-0.5"
          >
            Địa chỉ Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@student.fpt.edu.vn"
            {...register('email')}
            className="h-12 bg-transparent border-b border-x-0 border-t-0 border-[hsl(40,18%,81%)] rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 text-base shadow-none font-sans placeholder:text-[hsl(51,3%,65%)]"
          />
          {errors.email && (
            <p className="text-xs font-mono text-destructive mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="password"
              className="font-mono text-[10px] uppercase tracking-widest text-[hsl(51,3%,41%)] ml-0.5"
            >
              Mật khẩu
            </Label>
            <Link
              to="/forgot-password"
              className="font-mono text-[10px] text-[hsl(163,88%,20%)] hover:text-primary tracking-wide border-b border-[hsl(163,88%,20%)]/40 hover:border-primary pb-px transition-colors"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register('password')}
            className="h-12 bg-transparent border-b border-x-0 border-t-0 border-[hsl(40,18%,81%)] rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 text-base shadow-none placeholder:text-[hsl(51,3%,65%)]"
          />
          {errors.password && (
            <p className="text-xs font-mono text-destructive mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 rounded-full font-mono text-xs tracking-widest uppercase mt-2 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-[0_4px_20px_-4px_rgba(6,95,70,0.4)]"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Đăng nhập'
          )}
        </Button>

        {/* Register link */}
        <p className="text-center font-mono text-xs text-[hsl(51,3%,41%)] tracking-wide pt-1">
          Chưa có tài khoản?{' '}
          <Link
            to="/register"
            className="text-[hsl(161,88%,13%)] border-b border-[hsl(161,88%,13%)]/40 hover:text-primary hover:border-primary pb-px transition-colors font-semibold"
          >
            Đăng ký ngay
          </Link>
        </p>

      </form>
    </AuthCard>
  )
}
