import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rbacApi } from '@/api/endpoints/rbac'
import { queryKeys } from '@/api/queryKeys'
import type { CreateRoleRequest } from '@/types'

export const useRoles = () => {
  return useQuery({
    queryKey: queryKeys.rbac.roles,
    queryFn: () => rbacApi.listRoles(),
  })
}

export const useCreateRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateRoleRequest) => rbacApi.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rbac.roles })
    },
  })
}

export const usePermissions = () => {
  return useQuery({
    queryKey: queryKeys.rbac.permissions,
    queryFn: () => rbacApi.listPermissions(),
  })
}

export const useUpdateRolePermissions = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ roleId, permissionNames }: { roleId: string; permissionNames: string[] }) => rbacApi.updateRolePermissions(roleId, permissionNames),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rbac.roles })
    },
  })
}
