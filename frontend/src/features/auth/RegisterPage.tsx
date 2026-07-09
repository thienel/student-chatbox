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

const registerSchema = z.object({
  fullName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string(),
  studentCode: z.string().optional(),
  campus: z.string().optional(),
  reasonForNoFptEmail: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Mật khẩu xác nhận không khớp",
      path: ["confirmPassword"]
    })
  }
  
  const validDomains = ['@student.fpt.edu.vn', '@fpt.edu.vn', '@fu.edu.vn']
  const isFptEmail = validDomains.some(domain => data.email?.toLowerCase().endsWith(domain))
  
  if (!isFptEmail && data.email) {
    if (!data.studentCode || data.studentCode.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vui lòng nhập Mã số sinh viên khi dùng email cá nhân",
        path: ["studentCode"]
      })
    }
  }
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const registerMutation = useRegister()
  const [error, setError] = useState('')

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const emailValue = watch('email')
  const debouncedEmail = useDebounce(emailValue, 300)
  
  const validDomains = ['@student.fpt.edu.vn', '@fpt.edu.vn', '@fu.edu.vn']
  // Check if it's a non-FPT email that is somewhat valid (contains @)
  const isPersonalEmail = debouncedEmail && debouncedEmail.includes('@') && !validDomains.some(domain => debouncedEmail.toLowerCase().endsWith(domain))

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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.')
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex">
      {/* Left Pane - Branding */}
      <div className="hidden lg:flex w-1/2 bg-primary-ink p-16 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
        
        <div>
          <h2 className="text-white font-serif text-3xl font-bold tracking-tight">EduChat</h2>
        </div>
        
        <div className="z-10">
          <blockquote className="space-y-6">
            <p className="text-3xl font-serif text-white/90 leading-tight">
              "Khởi đầu hành trình học tập thông minh. Tương tác với kho kiến thức vô tận, tạo flashcard tự động và chinh phục mục tiêu cùng AI."
            </p>
            <footer className="text-white/60 font-mono text-sm tracking-widest uppercase">
              EduChat Ecosystem
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-16 relative">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h1 className="text-4xl font-serif text-primary-ink mb-3">Tạo tài khoản</h1>
            <p className="text-muted-foreground font-mono text-sm">Điền thông tin để tham gia EduChat ngay hôm nay.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl border border-destructive/20 font-mono">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="fullName" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Họ và tên</Label>
              <Input id="fullName" {...register('fullName')} placeholder="Nguyễn Văn A" className="h-12 bg-transparent border-b border-x-0 border-t-0 border-border/50 rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 text-lg shadow-none" />
              {errors.fullName && <p className="text-destructive font-mono text-xs mt-1">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Địa chỉ Email</Label>
              <Input id="email" type="email" {...register('email')} placeholder="student@fpt.edu.vn" className="h-12 bg-transparent border-b border-x-0 border-t-0 border-border/50 rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 text-lg shadow-none" />
              {errors.email && <p className="text-destructive font-mono text-xs mt-1">{errors.email.message}</p>}
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
                  <div className="bg-primary/5 border border-primary/10 p-6 rounded-2xl space-y-5">
                    <p className="text-sm font-serif text-primary-ink/80 leading-relaxed">
                      Bạn đang sử dụng email cá nhân. Vui lòng cung cấp thêm thông tin để hệ thống kiểm tra danh sách cho phép (Allowlist) hoặc duyệt thủ công.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="studentCode" className="font-mono text-[10px] uppercase tracking-wider text-primary">Mã Sinh Viên *</Label>
                      <Input id="studentCode" {...register('studentCode')} placeholder="Ví dụ: SE123456" className="h-11 bg-white/50 border-primary/20 focus-visible:ring-primary/30 font-mono text-sm" />
                      {errors.studentCode && <p className="text-destructive font-mono text-xs mt-1">{errors.studentCode.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="campus" className="font-mono text-[10px] uppercase tracking-wider text-primary">Cơ sở (Không bắt buộc)</Label>
                      <Input id="campus" {...register('campus')} placeholder="Ví dụ: FPT HCM" className="h-11 bg-white/50 border-primary/20 focus-visible:ring-primary/30 font-mono text-sm" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2 pt-2">
              <Label htmlFor="password" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Mật khẩu</Label>
              <PasswordInput id="password" {...register('password')} className="h-12 bg-transparent border-b border-x-0 border-t-0 border-border/50 rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 text-lg shadow-none" />
              {errors.password && <p className="text-destructive font-mono text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Xác nhận mật khẩu</Label>
              <PasswordInput id="confirmPassword" {...register('confirmPassword')} className="h-12 bg-transparent border-b border-x-0 border-t-0 border-border/50 rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 text-lg shadow-none" />
              {errors.confirmPassword && <p className="text-destructive font-mono text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 rounded-full font-mono text-sm tracking-widest uppercase mt-8 transition-all hover:scale-[1.02] active:scale-100" 
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Đăng ký ngay'}
            </Button>

            <p className="text-center text-sm font-mono text-muted-foreground mt-8">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-primary-ink border-b border-primary-ink pb-0.5 hover:text-primary hover:border-primary transition-colors">
                Đăng nhập
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
