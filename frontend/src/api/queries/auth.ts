import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/api/endpoints/auth'
import { queryKeys } from '@/api/queryKeys'
import type { LoginRequest, RegisterStudentRequest } from '@/types'

export const useMe = () => {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => authApi.me(),
  })
}

export const useLogin = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data.email, data.password!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me })
    },
  })
}

export const useRegister = () => {
  return useMutation({
    mutationFn: (data: RegisterStudentRequest) => authApi.registerStudent(data),
  })
}

export const useVerifyOtp = () => {
  return useMutation({
    mutationFn: (data: { email: string; otp: string }) => authApi.verifyOtp(data.email, data.otp),
  })
}

export const useResendOtp = () => {
  return useMutation({
    mutationFn: (data: { email: string }) => authApi.resendOtp(data.email),
  })
}

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (data: { email: string }) => authApi.forgotPassword(data.email),
  })
}

export const useVerifyResetOtp = () => {
  return useMutation({
    mutationFn: (data: { email: string; otp: string }) => authApi.verifyResetOtp(data.email, data.otp),
  })
}

export const useResetPassword = () => {
  return useMutation({
    mutationFn: (data: { email: string; otp: string; newPassword: string }) => authApi.resetPassword(data.email, data.otp, data.newPassword),
  })
}

export const useLogout = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.clear()
    },
  })
}
