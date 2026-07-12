import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useVerifyOtp, useResendOtp } from '@/api/queries/auth'
import { AuthCard } from './components/AuthCard'
import { OtpInput } from './components/OtpInput'
import { Button } from '@/components/ui/button'

export default function VerifyOtpPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email')
  const isManual = searchParams.get('isManual') === 'true'

  const verifyOtpMutation = useVerifyOtp()
  const resendOtpMutation = useResendOtp()

  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(60)
  const canResend = countdown === 0

  useEffect(() => {
    if (!email) navigate('/login', { replace: true })
  }, [email, navigate])

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (otp.length !== 6 || !email) return
    setError('')
    try {
      await verifyOtpMutation.mutateAsync({ email, otp })
      const successMessage = isManual
        ? 'Xác minh email thành công. Vui lòng chờ quản trị viên phê duyệt.'
        : 'Xác thực thành công. Vui lòng đăng nhập.'
      navigate('/login', { state: { message: successMessage } })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Mã xác thực không đúng hoặc đã hết hạn.')
    }
  }

  const handleResend = async () => {
    if (!email) return
    setError('')
    try {
      await resendOtpMutation.mutateAsync({ email })
      setCountdown(60)
      setOtp('')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể gửi lại mã. Vui lòng thử lại sau.')
    }
  }

  const iconEl = (
    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
      <ShieldCheck className="w-6 h-6 text-primary" />
    </div>
  )

  return (
    <AuthCard
      title="Xác thực Email"
      subtitle={`Mã xác thực 6 số đã được gửi đến\n${email || ''}`}
      icon={iconEl}
    >
      <form onSubmit={handleVerify} className="space-y-6 flex flex-col items-center">
        {error && (
          <div className="flex items-start gap-3 bg-destructive/5 border border-destructive/20 text-destructive text-xs p-4 rounded-2xl font-mono w-full">
            <span className="text-base leading-none mt-0.5">✕</span>
            <span>{error}</span>
          </div>
        )}

        {/* Email reminder */}
        <div className="w-full bg-primary/5 border border-primary/15 rounded-2xl px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[hsl(51,3%,41%)] mb-1">Gửi đến</p>
          <p className="font-mono text-sm text-[hsl(161,88%,13%)] font-semibold">{email}</p>
        </div>

        <OtpInput value={otp} onChange={setOtp} length={6} disabled={verifyOtpMutation.isPending} error={!!error} />

        <Button
          type="submit"
          className="w-full h-12 rounded-full font-mono text-xs tracking-widest uppercase transition-all hover:scale-[1.01] active:scale-[0.99] shadow-[0_4px_20px_-4px_rgba(6,95,70,0.4)]"
          disabled={verifyOtpMutation.isPending || otp.length !== 6}
        >
          {verifyOtpMutation.isPending ? 'Đang xác thực...' : 'Xác thực'}
        </Button>

        <div className="text-center font-mono text-xs text-[hsl(51,3%,41%)] tracking-wide">
          Chưa nhận được mã?{' '}
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendOtpMutation.isPending}
              className="text-[hsl(161,88%,13%)] border-b border-[hsl(161,88%,13%)]/40 hover:text-primary hover:border-primary pb-px transition-colors font-semibold"
            >
              {resendOtpMutation.isPending ? 'Đang gửi...' : 'Gửi lại mã'}
            </button>
          ) : (
            <span className="text-[hsl(51,3%,60%)]">
              Gửi lại sau{' '}
              <span className="font-semibold text-[hsl(161,88%,13%)]">{countdown}s</span>
            </span>
          )}
        </div>
      </form>
    </AuthCard>
  )
}
