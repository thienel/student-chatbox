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
      // Use the token to fetch the user
      // Note: we can't easily set the axios token header synchronously here unless we reload or rely on interceptors,
      // but wait, the interceptor uses the store. However, we might need a brief delay or just reload.
      // Wait, let's just reload to '/' and let RootRedirect and Protected handle it!
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
    <AuthCard title="Đăng nhập" subtitle="Chào mừng bạn quay lại EduChat">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {successMessage && (
          <div className="bg-green-50 text-green-700 text-sm p-3 rounded-md mb-4 text-center">
            {successMessage}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@university.edu"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Mật khẩu</Label>
            <Link 
              to="/forgot-password" 
              className="text-sm text-primary hover:underline font-semibold font-geist"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full font-bold mt-2"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Đăng nhập'
          )}
        </Button>

        <p className="text-center text-sm text-gray-500 mt-6 font-geist">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-primary hover:underline font-semibold">
            Đăng ký
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}
