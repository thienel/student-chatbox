import axiosInstance from '@/api/axiosInstance'
import type { ApiResponse, Role, Permission, CreateRoleRequest } from '@/types'

export const rbacApi = {
  listRoles: () =>
    axiosInstance.get<ApiResponse<Role[]>>('/rbac/roles').then(r => r.data.data),

  createRole: (data: CreateRoleRequest) =>
    axiosInstance.post<ApiResponse<Role>>('/rbac/roles', data).then(r => r.data.data),

  listPermissions: () =>
    axiosInstance.get<ApiResponse<Permission[]>>('/rbac/permissions').then(r => r.data.data),

  updateRolePermissions: (roleId: string, permissionNames: string[]) =>
    axiosInstance
      .put<ApiResponse<Role>>(`/rbac/roles/${roleId}/permissions`, { permissionNames })
      .then(r => r.data.data),
}
