import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { allowlistApi } from '@/api/endpoints/allowlist'
import { queryKeys } from '@/api/queryKeys'
import type { AllowlistRecordInput, BulkImportAllowlistRequest } from '@/types'

export const useAllowlist = (params?: { search?: string; status?: string; limit?: number; offset?: number }) => {
  return useQuery({
    queryKey: queryKeys.allowlist.list(params),
    queryFn: () => allowlistApi.list(params),
    placeholderData: (prev) => prev,
  })
}

export const useCreateAllowlistRecord = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AllowlistRecordInput) => allowlistApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allowlist.list(undefined) }) // Invalidate list
    },
  })
}

export const useBulkImportAllowlist = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: BulkImportAllowlistRequest) => allowlistApi.bulkImport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allowlist.list(undefined) })
    },
  })
}

export const useEnableAllowlistRecord = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => allowlistApi.enable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allowlist.list(undefined) })
    },
  })
}

export const useDisableAllowlistRecord = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => allowlistApi.disable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allowlist.list(undefined) })
    },
  })
}
