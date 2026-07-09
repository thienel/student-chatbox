import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema)
  })

  const onSubmit = async (data: ForgotForm) => {
    setError('')
    try {
      await forgotPasswordMutation.mutateAsync({ email: data.email })
      navigate(`/reset-password?email=${encodeURIComponent(data.email)}`)
    } catch (err: any) {
      // Still move to next page or show error depending on backend design. 
      // The backend returns success even if user not found to prevent enumeration.
      navigate(`/reset-password?email=${encodeURIComponent(data.email)}`)
    }
  }

  return (
    <AuthCard title="Quên mật khẩu" subtitle="Nhập email để nhận mã khôi phục">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register('email')} placeholder="name@example.com" />
          {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
        </div>

        <Button type="submit" className="w-full font-bold" disabled={forgotPasswordMutation.isPending}>
          {forgotPasswordMutation.isPending ? 'Đang gửi...' : 'Gửi mã khôi phục'}
        </Button>

        <p className="text-center text-sm text-gray-500 mt-6 font-geist">
          Nhớ mật khẩu?{' '}
          <Link to="/login" className="text-primary hover:underline font-semibold">
            Đăng nhập
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}
