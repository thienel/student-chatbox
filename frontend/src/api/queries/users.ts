import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/api/endpoints/users'
import { queryKeys } from '@/api/queryKeys'
import type { CreateUserRequest, User } from '@/types'

export const useUsers = (params?: { page?: number; limit?: number; role?: string; status?: string; search?: string }) => {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => usersApi.list(params),
    placeholderData: (prev) => prev,
  })
}

export const useUser = (id: string) => {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => usersApi.get(id),
    enabled: !!id,
  })
}

export const useCreateUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateUserRequest) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    },
  })
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pick<User, 'fullName'>> }) => usersApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    },
  })
}

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: 'active' | 'suspended' | 'rejected' | 'pending_email_verification' | 'pending_manual_verification'; reason?: string }) =>
      usersApi.updateStatus(id, status, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    },
  })
}

export const useResetUserPassword = () => {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) => usersApi.resetPassword(id, newPassword),
  })
}

// Admin Verification Endpoints
export const usePendingVerifications = () => {
  return useQuery({
    queryKey: queryKeys.users.verifications,
    queryFn: () => usersApi.getPendingVerifications(),
  })
}

export const useVerificationDetail = (id: string) => {
  return useQuery({
    queryKey: queryKeys.users.verificationDetail(id),
    queryFn: () => usersApi.getVerificationDetail(id),
    enabled: !!id,
  })
}

export const useApproveVerification = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => usersApi.approveVerification(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.verifications })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.verificationDetail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    },
  })
}

export const useRejectVerification = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => usersApi.rejectVerification(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.verifications })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.verificationDetail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    },
  })
}

export const useRequestMoreInfoVerification = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => usersApi.requestMoreInfoVerification(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.verifications })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.verificationDetail(id) })
    },
  })
}
