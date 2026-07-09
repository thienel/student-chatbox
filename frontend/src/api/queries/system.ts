import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { systemApi } from '@/api/endpoints/system'
import { queryKeys } from '@/api/queryKeys'

export const useSystemSettings = () => {
  return useQuery({
    queryKey: queryKeys.system.settings,
    queryFn: () => systemApi.getSettings(),
  })
}

export const useUpdateSystemSettings = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settings: Record<string, string>) => systemApi.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.system.settings })
    },
  })
}

export const useAuditLogs = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: queryKeys.system.auditLogs(params),
    queryFn: () => systemApi.getAuditLogs(params),
  })
}

export const useAdminStats = () => {
  return useQuery({
    queryKey: queryKeys.system.stats,
    queryFn: () => systemApi.getStats(),
  })
}
