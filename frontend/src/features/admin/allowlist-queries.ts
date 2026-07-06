import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { allowlistApi } from '@/api/endpoints/allowlist'
import { useToast } from '@/hooks/use-toast'

export const useAllowlist = (params?: { search?: string; status?: string; limit?: number; offset?: number }) => {
  return useQuery({
    queryKey: ['admin-allowlist', params],
    queryFn: () => allowlistApi.list(params),
  })
}

export const useCreateAllowlist = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: allowlistApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-allowlist'] })
      toast({ title: 'Success', description: 'Added email to allowlist.' })
    },
    onError: (err: any) => {
      toast({ 
        title: 'Error', 
        description: err.response?.data?.message || 'Failed to add email', 
        variant: 'destructive' 
      })
    }
  })
}

export const useBulkImportAllowlist = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: allowlistApi.bulkImport,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-allowlist'] })
      toast({ title: 'Success', description: `Imported ${data.importedCount} records successfully.` })
    },
    onError: (err: any) => {
      toast({ 
        title: 'Import Failed', 
        description: err.response?.data?.message || 'Failed to import records', 
        variant: 'destructive' 
      })
    }
  })
}

export const useEnableAllowlist = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: allowlistApi.enable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-allowlist'] })
      toast({ title: 'Success', description: 'Record enabled.' })
    },
  })
}

export const useDisableAllowlist = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: allowlistApi.disable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-allowlist'] })
      toast({ title: 'Disabled', description: 'Record disabled.' })
    },
  })
}
