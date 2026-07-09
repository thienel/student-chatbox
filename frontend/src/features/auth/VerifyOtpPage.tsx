import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useVerifyOtp, useResendOtp } from '@/api/queries/auth'
import { AuthCard } from './components/AuthCard'
import { OtpInput } from './components/OtpInput'
import { Button } from '@/components/ui/button'

export default function VerifyOtpPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email')
  const isManual = searchParams.get('isManual') === 'true'

  // Mutations
  const verifyOtpMutation = useVerifyOtp()
  const resendOtpMutation = useResendOtp()

  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    if (!email) {
      navigate('/login', { replace: true })
    }
  }, [email, navigate])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    } else {
      setCanResend(true)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (otp.length !== 6 || !email) return

    setError('')
    try {
      await verifyOtpMutation.mutateAsync({ email, otp })
      // On success, redirect to login with a success message
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
      setCanResend(false)
      setOtp('')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể gửi lại mã. Vui lòng thử lại sau.')
    }
  }

  return (
    <AuthCard title="Xác thực Email" subtitle={`Mã xác thực 6 số đã được gửi đến ${email || ''}`}>
      <form onSubmit={handleVerify} className="space-y-6 flex flex-col items-center">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md w-full">
            {error}
          </div>
        )}
        
        <OtpInput value={otp} onChange={setOtp} length={6} disabled={verifyOtpMutation.isPending} error={!!error} />

        <Button 
          type="submit" 
          className="w-full font-bold" 
          disabled={verifyOtpMutation.isPending || otp.length !== 6}
        >
          {verifyOtpMutation.isPending ? 'Đang xác thực...' : 'Xác thực'}
        </Button>

        <div className="text-center text-sm font-geist text-gray-500">
          Chưa nhận được mã?{' '}
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendOtpMutation.isPending}
              className="text-primary hover:underline font-semibold"
            >
              {resendOtpMutation.isPending ? 'Đang gửi...' : 'Gửi lại mã'}
            </button>
          ) : (
            <span className="text-gray-400">
              Gửi lại sau {countdown}s
            </span>
          )}
        </div>
      </form>
    </AuthCard>
  )
}
