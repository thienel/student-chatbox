import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '@/api/endpoints/auth'
import { AuthCard } from './components/AuthCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'

const registerSchema = z.object({
  fullName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string(),
  isManualVerification: z.boolean().optional(),
  studentCode: z.string().optional(),
  campus: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Mật khẩu xác nhận không khớp",
      path: ["confirmPassword"]
    })
  }

  if (data.isManualVerification) {
    if (!data.studentCode || data.studentCode.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vui lòng nhập Mã số sinh viên",
        path: ["studentCode"]
      })
    }
    if (!data.campus || data.campus.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vui lòng nhập Cơ sở",
        path: ["campus"]
      })
    }
  } else {
    const validDomains = ['@student.fpt.edu.vn', '@fpt.edu.vn', '@fu.edu.vn']
    const isFptEmail = validDomains.some(domain => data.email.endsWith(domain))
    if (!isFptEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vui lòng sử dụng email sinh viên FPT hợp lệ",
        path: ["email"]
      })
    }
  }
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // @ts-ignore
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      isManualVerification: false
    }
  })

  const isManual = watch('isManualVerification')

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    setError('')
    try {
      if (data.isManualVerification) {
        await authApi.createManualVerification({
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          studentCode: data.studentCode!,
          campus: data.campus || '',
          personalEmail: data.email,
        })
        navigate(`/verify-otp?email=${encodeURIComponent(data.email)}&isManual=true`)
      } else {
        await authApi.registerStudent(data.email, data.password, data.fullName)
        navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthCard title="Tạo tài khoản" subtitle="Tham gia EduChat ngay hôm nay">
      {/* @ts-ignore */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
            {error}
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="fullName">Họ và tên</Label>
          <Input id="fullName" {...register('fullName')} placeholder="Nguyễn Văn A" />
          {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email {isManual ? "cá nhân" : "trường"}</Label>
          <Input id="email" type="email" {...register('email')} placeholder="name@example.com" />
          {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
        </div>

        <div className="flex items-center space-x-2 my-4 bg-orange-50 p-3 rounded-md border border-orange-100">
          <input 
            type="checkbox" 
            id="isManualVerification" 
            {...register('isManualVerification')}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <Label htmlFor="isManualVerification" className="text-sm font-medium leading-none cursor-pointer text-orange-800">
            Tôi là sinh viên FPT nhưng chưa có email trường
          </Label>
        </div>

        {isManual && (
          <div className="space-y-4 bg-gray-50 p-4 rounded-md border border-gray-100">
            <div className="space-y-2">
              <Label htmlFor="studentCode">Mã số sinh viên <span className="text-red-500">*</span></Label>
              <Input id="studentCode" {...register('studentCode')} placeholder="VD: SE123456" />
              {errors.studentCode && <p className="text-red-500 text-xs">{errors.studentCode.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="campus">Cơ sở</Label>
              <Input id="campus" {...register('campus')} placeholder="VD: FPT HCM" />
              {errors.campus && <p className="text-red-500 text-xs">{errors.campus.message}</p>}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">Mật khẩu</Label>
          <PasswordInput id="password" {...register('password')} />
          {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
          <PasswordInput id="confirmPassword" {...register('confirmPassword')} />
          {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword.message}</p>}
        </div>

        <Button type="submit" className="w-full font-bold" disabled={isLoading}>
          {isLoading ? 'Đang xử lý...' : 'Đăng ký'}
        </Button>

        <p className="text-center text-sm text-gray-500 mt-6 font-geist">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-primary hover:underline font-semibold">
            Đăng nhập
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}
