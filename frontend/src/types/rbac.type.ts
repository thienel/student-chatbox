export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  permissions?: string[];
  createdAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface CreateRoleRequest { name: string; description?: string; permissions?: string[] }