import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/useAuthStore'
import { authApi } from '@/api/endpoints/auth'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth, accessToken } = useAuthStore()

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (accessToken) navigate('/home', { replace: true })
  }, [accessToken, navigate])

  const onSubmit = async (data: FormData) => {
    try {
      const result = await authApi.login(data.email, data.password)
      setAuth(result.user, result.accessToken, result.refreshToken)
      navigate('/home', { replace: true })
    } catch (err) {
      setError('password', { message: getErrorMessage(err, 'Invalid email or password') })
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-card border border-border mb-4">
            <span className="text-lg font-semibold text-foreground">E</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground">EduChat</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@university.edu"
              className={cn(
                'bg-secondary border-border text-foreground placeholder:text-muted-foreground',
                'focus:border-primary focus:ring-0',
                errors.email && 'border-destructive focus:border-destructive'
              )}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm text-foreground">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className={cn(
                'bg-secondary border-border text-foreground placeholder:text-muted-foreground',
                'focus:border-primary focus:ring-0',
                errors.password && 'border-destructive focus:border-destructive'
              )}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-9 bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-md mt-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Sign in'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
