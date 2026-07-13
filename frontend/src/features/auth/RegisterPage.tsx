import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useRegister } from '@/api/queries/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { useDebounce } from '@/hooks/use-debounce'
import { AuthCard } from './components/AuthCard'

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z.string(),
    studentCode: z.string().optional(),
    campus: z.string().optional(),
    reasonForNoFptEmail: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Mật khẩu xác nhận không khớp',
        path: ['confirmPassword'],
      })
    }

    const validDomains = ['@student.fpt.edu.vn', '@fpt.edu.vn', '@fu.edu.vn']
    const isFptEmail = validDomains.some((domain) => data.email?.toLowerCase().endsWith(domain))

    if (!isFptEmail && data.email) {
      if (!data.studentCode || data.studentCode.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Vui lòng nhập Mã số sinh viên khi dùng email cá nhân',
          path: ['studentCode'],
        })
      }
    }
  })

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const registerMutation = useRegister()
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const emailValue = watch('email')
  const debouncedEmail = useDebounce(emailValue, 300)

  const validDomains = ['@student.fpt.edu.vn', '@fpt.edu.vn', '@fu.edu.vn']
  const isPersonalEmail =
    debouncedEmail &&
    debouncedEmail.includes('@') &&
    !validDomains.some((domain) => debouncedEmail.toLowerCase().endsWith(domain))

  const onSubmit = async (data: RegisterForm) => {
    setError('')
    try {
      await registerMutation.mutateAsync({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        studentCode: data.studentCode,
        campus: data.campus,
        reasonForNoFptEmail: data.reasonForNoFptEmail || 'Đăng ký bằng email cá nhân',
      })
      navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`)
    } catch (error: any) {
      setError(
        error.response?.data?.error?.message ||
          error.response?.data?.message ||
          'Đăng ký thất bại. Vui lòng thử lại.',
      )
    }
  }

  return (
    <AuthCard title="Tạo tài khoản" subtitle="Điền thông tin để tham gia Folio ngay hôm nay.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
        {error && (
          <div className="flex items-start gap-3 bg-destructive/5 border border-destructive/20 text-destructive text-xs p-4 rounded-2xl font-mono">
            <span className="text-base leading-none mt-0.5">✕</span>
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="fullName"
              className="font-mono text-[10px] uppercase tracking-widest text-[hsl(51,3%,41%)] ml-0.5"
            >
              Họ và tên
            </Label>
            <Input
              id="fullName"
              {...register('fullName')}
              placeholder="Nguyễn Văn A"
              className="h-12 bg-transparent border-b border-x-0 border-t-0 border-[hsl(40,18%,81%)] rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 text-base shadow-none font-sans placeholder:text-[hsl(51,3%,65%)]"
            />
            {errors.fullName && (
              <p className="text-xs font-mono text-destructive mt-1">{errors.fullName.message}</p>
            )}
          </div>

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
              {...register('email')}
              placeholder="student@fpt.edu.vn"
              className="h-12 bg-transparent border-b border-x-0 border-t-0 border-[hsl(40,18%,81%)] rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 text-base shadow-none font-sans placeholder:text-[hsl(51,3%,65%)]"
            />
            {errors.email && (
              <p className="text-xs font-mono text-destructive mt-1">{errors.email.message}</p>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isPersonalEmail && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: '24px' }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >
              <div className="bg-[hsl(40,33%,96%)] border border-[hsl(40,18%,81%)] p-6 rounded-2xl space-y-5">
                <p className="text-xs font-serif text-[hsl(161,88%,13%)] leading-relaxed">
                  Bạn đang sử dụng email cá nhân. Vui lòng cung cấp thêm thông tin để hệ thống kiểm
                  tra danh sách cho phép (Allowlist) hoặc duyệt thủ công.
                </p>
                <div className="space-y-2">
                  <Label
                    htmlFor="studentCode"
                    className="font-mono text-[10px] uppercase tracking-widest text-primary ml-0.5"
                  >
                    Mã Sinh Viên *
                  </Label>
                  <Input
                    id="studentCode"
                    {...register('studentCode')}
                    placeholder="Ví dụ: SE123456"
                    className="h-11 bg-white border-[hsl(40,18%,81%)] focus-visible:ring-primary/30 font-mono text-sm"
                  />
                  {errors.studentCode && (
                    <p className="text-xs font-mono text-destructive mt-1">
                      {errors.studentCode.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="campus"
                    className="font-mono text-[10px] uppercase tracking-widest text-primary ml-0.5"
                  >
                    Cơ sở (Không bắt buộc)
                  </Label>
                  <Input
                    id="campus"
                    {...register('campus')}
                    placeholder="Ví dụ: FPT HCM"
                    className="h-11 bg-white border-[hsl(40,18%,81%)] focus-visible:ring-primary/30 font-mono text-sm"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="font-mono text-[10px] uppercase tracking-widest text-[hsl(51,3%,41%)] ml-0.5"
            >
              Mật khẩu
            </Label>
            <PasswordInput
              id="password"
              {...register('password')}
              className="h-12 bg-transparent border-b border-x-0 border-t-0 border-[hsl(40,18%,81%)] rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 text-base shadow-none placeholder:text-[hsl(51,3%,65%)]"
            />
            {errors.password && (
              <p className="text-xs font-mono text-destructive mt-1">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="font-mono text-[10px] uppercase tracking-widest text-[hsl(51,3%,41%)] ml-0.5"
            >
              Xác nhận mật khẩu
            </Label>
            <PasswordInput
              id="confirmPassword"
              {...register('confirmPassword')}
              className="h-12 bg-transparent border-b border-x-0 border-t-0 border-[hsl(40,18%,81%)] rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 text-base shadow-none placeholder:text-[hsl(51,3%,65%)]"
            />
            {errors.confirmPassword && (
              <p className="text-xs font-mono text-destructive mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-12 rounded-full font-mono text-xs tracking-widest uppercase mt-4 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-[0_4px_20px_-4px_rgba(6,95,70,0.4)]"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Đăng ký ngay'
          )}
        </Button>

        <p className="text-center font-mono text-xs text-[hsl(51,3%,41%)] tracking-wide">
          Đã có tài khoản?{' '}
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
