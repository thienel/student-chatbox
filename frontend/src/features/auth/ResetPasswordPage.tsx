import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '@/api/endpoints/auth'
import { AuthCard } from './components/AuthCard'
import { OtpInput } from './components/OtpInput'
import { Button } from '@/components/ui/button'

import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email')

  // Step 1: OTP
  const [step, setStep] = useState<1 | 2>(1)
  const [otp, setOtp] = useState('')
  
  // Step 2: New Password
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!email) {
      navigate('/login', { replace: true })
    }
  }, [email, navigate])

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) {
      setError('Mã xác thực phải gồm 6 chữ số')
      return
    }

    setIsLoading(true)
    setError('')
    try {
      await authApi.verifyResetOtp(email!, otp)
      // OTP is valid, proceed to step 2
      setStep(2)
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Mã xác thực không đúng hoặc đã hết hạn.')
    } finally {
      setIsLoading(false)
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

    setIsLoading(true)
    setError('')
    try {
      await authApi.resetPassword(email!, otp, newPassword)
      navigate('/login', { state: { message: 'Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập.' } })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthCard 
      title={step === 1 ? "Xác thực mã OTP" : "Tạo mật khẩu mới"} 
      subtitle={step === 1 ? `Nhập mã gửi đến ${email || ''}` : "Vui lòng nhập mật khẩu mới của bạn"}
    >
      {step === 1 ? (
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md w-full">
              {error}
            </div>
          )}
          
          <div className="flex flex-col items-center">
            <Label className="self-start mb-2">Mã xác thực 6 số</Label>
            <OtpInput value={otp} onChange={setOtp} length={6} disabled={isLoading} />
          </div>

          <Button 
            type="submit" 
            className="w-full font-bold" 
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading ? 'Đang kiểm tra...' : 'Tiếp tục'}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md w-full">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="newPassword">Mật khẩu mới</Label>
            <PasswordInput 
              id="newPassword" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
            <PasswordInput 
              id="confirmPassword" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full font-bold" 
            disabled={isLoading || !newPassword || !confirmPassword}
          >
            {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
          </Button>
        </form>
      )}
    </AuthCard>
  )
}
