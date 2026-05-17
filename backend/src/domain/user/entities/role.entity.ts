export class Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  permissions?: string[];
  createdAt: Date;
}
