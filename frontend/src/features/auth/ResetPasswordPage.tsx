import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { KeyRound, Lock } from 'lucide-react'
import { useVerifyResetOtp, useResetPassword } from '@/api/queries/auth'
import { AuthCard } from './components/AuthCard'
import { OtpInput } from './components/OtpInput'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email')

  const verifyResetOtpMutation = useVerifyResetOtp()
  const resetPasswordMutation = useResetPassword()

  const [step, setStep] = useState<1 | 2>(1)
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!email) navigate('/login', { replace: true })
  }, [email, navigate])

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) {
      setError('Mã xác thực phải gồm 6 chữ số')
      return
    }
    setError('')
    try {
      await verifyResetOtpMutation.mutateAsync({ email: email!, otp })
      setStep(2)
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Mã xác thực không đúng hoặc đã hết hạn.')
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }
    setError('')
    try {
      await resetPasswordMutation.mutateAsync({ email: email!, otp, newPassword })
      navigate('/login', { state: { message: 'Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập.' } })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu.')
    }
  }

  const step1Icon = (
    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
      <KeyRound className="w-6 h-6 text-primary" />
    </div>
  )

  const step2Icon = (
    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
      <Lock className="w-6 h-6 text-primary" />
    </div>
  )

  return (
    <AuthCard
      title={step === 1 ? 'Xác thực mã OTP' : 'Tạo mật khẩu mới'}
      subtitle={step === 1 ? `Nhập mã OTP đã gửi đến ${email || ''}` : 'Vui lòng nhập mật khẩu mới của bạn'}
      icon={step === 1 ? step1Icon : step2Icon}
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-2 -mt-2">
        <div className={`flex-1 h-1 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-primary' : 'bg-[hsl(40,18%,81%)]'}`} />
        <div className={`flex-1 h-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-primary' : 'bg-[hsl(40,18%,81%)]'}`} />
      </div>

      {step === 1 ? (
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          {error && (
            <div className="flex items-start gap-3 bg-destructive/5 border border-destructive/20 text-destructive text-xs p-4 rounded-2xl font-mono">
              <span className="text-base leading-none mt-0.5">✕</span>
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col items-center gap-3">
            <Label className="font-mono text-[10px] uppercase tracking-widest text-[hsl(51,3%,41%)] self-start">
              Mã xác thực 6 số
            </Label>
            <OtpInput value={otp} onChange={setOtp} length={6} disabled={verifyResetOtpMutation.isPending} error={!!error} />
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-full font-mono text-xs tracking-widest uppercase transition-all hover:scale-[1.01] active:scale-[0.99] shadow-[0_4px_20px_-4px_rgba(6,95,70,0.4)]"
            disabled={verifyResetOtpMutation.isPending || otp.length !== 6}
          >
            {verifyResetOtpMutation.isPending ? 'Đang kiểm tra...' : 'Tiếp tục →'}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-6">
          {error && (
            <div className="flex items-start gap-3 bg-destructive/5 border border-destructive/20 text-destructive text-xs p-4 rounded-2xl font-mono">
              <span className="text-base leading-none mt-0.5">✕</span>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label
              htmlFor="newPassword"
              className="font-mono text-[10px] uppercase tracking-widest text-[hsl(51,3%,41%)] ml-0.5"
            >
              Mật khẩu mới
            </Label>
            <PasswordInput
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={resetPasswordMutation.isPending}
              placeholder="Tối thiểu 6 ký tự"
              className="h-12 bg-transparent border-b border-x-0 border-t-0 border-[hsl(40,18%,81%)] rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 text-base shadow-none placeholder:text-[hsl(51,3%,65%)]"
            />
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
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={resetPasswordMutation.isPending}
              placeholder="Nhập lại mật khẩu"
              className="h-12 bg-transparent border-b border-x-0 border-t-0 border-[hsl(40,18%,81%)] rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 text-base shadow-none placeholder:text-[hsl(51,3%,65%)]"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-full font-mono text-xs tracking-widest uppercase transition-all hover:scale-[1.01] active:scale-[0.99] shadow-[0_4px_20px_-4px_rgba(6,95,70,0.4)]"
            disabled={resetPasswordMutation.isPending || !newPassword || !confirmPassword}
          >
            {resetPasswordMutation.isPending ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
          </Button>
        </form>
      )}
    </AuthCard>
  )
}
