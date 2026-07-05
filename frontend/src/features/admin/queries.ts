import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/api/endpoints/users'
import { systemApi } from '@/api/endpoints/system'

export const userKeys = {
  all: () => ['users'] as const,
  list: (filters?: object) => [...userKeys.all(), 'list', filters] as const,
  detail: (id: string) => [...userKeys.all(), id] as const,
}

export function useUsers(params?: { page?: number; limit?: number; role?: string; status?: string; search?: string }) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => usersApi.list(params),
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => usersApi.get(id),
    enabled: !!id,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all() }),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { fullName: string } }) =>
      usersApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: userKeys.all() })
      qc.invalidateQueries({ queryKey: userKeys.detail(id) })
    },
  })
}

export function useUpdateUserStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: 'active' | 'suspended' | 'rejected' | 'pending_email_verification' | 'pending_manual_verification'; reason?: string }) =>
      usersApi.updateStatus(id, status, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all() }),
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      usersApi.resetPassword(id, newPassword),
  })
}

export const verificationKeys = {
  all: () => ['verifications'] as const,
  list: () => [...verificationKeys.all(), 'list'] as const,
  detail: (id: string) => [...verificationKeys.all(), id] as const,
}

export function usePendingVerifications() {
  return useQuery({
    queryKey: verificationKeys.list(),
    queryFn: () => usersApi.getPendingVerifications(),
  })
}

export function useVerificationDetail(id: string) {
  return useQuery({
    queryKey: verificationKeys.detail(id),
    queryFn: () => usersApi.getVerificationDetail(id),
    enabled: !!id,
  })
}

export function useApproveVerification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => usersApi.approveVerification(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: verificationKeys.all() }),
  })
}

export function useRejectVerification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => usersApi.rejectVerification(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: verificationKeys.all() }),
  })
}

export function useRequestMoreInfoVerification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => usersApi.requestMoreInfoVerification(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: verificationKeys.all() }),
  })
}

export const systemKeys = {
  settings: () => ['system', 'settings'] as const,
  auditLogs: (params?: object) => ['system', 'audit-logs', params] as const,
  stats: () => ['system', 'stats'] as const,
}

export function useSystemSettings() {
  return useQuery({
    queryKey: systemKeys.settings(),
    queryFn: systemApi.getSettings,
  })
}

export function useAuditLogs(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: systemKeys.auditLogs(params),
    queryFn: () => systemApi.getAuditLogs(params),
  })
}

export function useAdminStats() {
  return useQuery({
    queryKey: systemKeys.stats(),
    queryFn: systemApi.getStats,
  })
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (settings: Record<string, string>) => systemApi.updateSettings(settings),
    onSuccess: () => qc.invalidateQueries({ queryKey: systemKeys.settings() }),
  })
}
