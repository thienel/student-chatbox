import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Mail } from 'lucide-react'
import { useForgotPassword } from '@/api/queries/auth'
import { AuthCard } from './components/AuthCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

const forgotSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
})

type ForgotForm = z.infer<typeof forgotSchema>

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const forgotPasswordMutation = useForgotPassword()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema)
  })

  const onSubmit = async (data: ForgotForm) => {
    setError('')
    try {
      await forgotPasswordMutation.mutateAsync({ email: data.email })
      navigate(`/reset-password?email=${encodeURIComponent(data.email)}`)
    } catch {
      // Still move to next page (prevent email enumeration)
      navigate(`/reset-password?email=${encodeURIComponent(data.email)}`)
    }
  }

  const iconEl = (
    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
      <Mail className="w-6 h-6 text-primary" />
    </div>
  )

  return (
    <AuthCard title="Quên mật khẩu" subtitle="Nhập email để nhận mã OTP khôi phục" icon={iconEl}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="flex items-start gap-3 bg-destructive/5 border border-destructive/20 text-destructive text-xs p-4 rounded-2xl font-mono">
            <span className="text-base leading-none mt-0.5">✕</span>
            <span>{error}</span>
          </div>
        )}

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
            placeholder="you@student.fpt.edu.vn"
            {...register('email')}
            className="h-12 bg-transparent border-b border-x-0 border-t-0 border-[hsl(40,18%,81%)] rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 text-base shadow-none font-sans placeholder:text-[hsl(51,3%,65%)]"
          />
          {errors.email && (
            <p className="text-xs font-mono text-destructive mt-1">{errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-12 rounded-full font-mono text-xs tracking-widest uppercase transition-all hover:scale-[1.01] active:scale-[0.99] shadow-[0_4px_20px_-4px_rgba(6,95,70,0.4)]"
          disabled={isSubmitting || forgotPasswordMutation.isPending}
        >
          {(isSubmitting || forgotPasswordMutation.isPending) ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Gửi mã khôi phục'
          )}
        </Button>

        <p className="text-center font-mono text-xs text-[hsl(51,3%,41%)] tracking-wide">
          Nhớ mật khẩu?{' '}
          <Link
            to="/login"
            className="text-[hsl(161,88%,13%)] border-b border-[hsl(161,88%,13%)]/40 hover:text-primary hover:border-primary pb-px transition-colors font-semibold"
          >
            Đăng nhập
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}
