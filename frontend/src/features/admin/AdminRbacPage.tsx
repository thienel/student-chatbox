import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rbacApi } from '@/api/endpoints/rbac'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/errors'
import { Plus, ChevronDown, ChevronRight } from 'lucide-react'
import type { Role } from '@/types'

export default function AdminRbacPage() {
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['rbac', 'roles'],
    queryFn: rbacApi.listRoles,
  })

  const { data: permissions = [] } = useQuery({
    queryKey: ['rbac', 'permissions'],
    queryFn: rbacApi.listPermissions,
  })

  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const [expandedRole, setExpandedRole] = useState<string | null>(null)
  const [rolePerms, setRolePerms] = useState<Record<string, string[]>>({})

  const createRole = useMutation({
    mutationFn: () => rbacApi.createRole({ name: newName.trim(), description: newDesc.trim() || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rbac', 'roles'] })
      toast({ description: 'Role created.' })
      setCreateOpen(false)
      setNewName('')
      setNewDesc('')
    },
    onError: (err) => toast({ variant: 'destructive', description: getErrorMessage(err, 'Failed to create role.') }),
  })

  const updatePerms = useMutation({
    mutationFn: ({ roleId, perms }: { roleId: string; perms: string[] }) =>
      rbacApi.updateRolePermissions(roleId, perms),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rbac', 'roles'] })
      toast({ description: 'Permissions updated.' })
    },
    onError: (err) => toast({ variant: 'destructive', description: getErrorMessage(err, 'Failed to update permissions.') }),
  })

  const handleExpand = (role: Role) => {
    if (expandedRole === role.id) {
      setExpandedRole(null)
      return
    }
    setExpandedRole(role.id)
    setRolePerms(prev => ({
      ...prev,
      [role.id]: role.permissions ?? [],
    }))
  }

  const togglePerm = (roleId: string, permName: string) => {
    setRolePerms(prev => {
      const cur = prev[roleId] ?? []
      return {
        ...prev,
        [roleId]: cur.includes(permName) ? cur.filter(p => p !== permName) : [...cur, permName],
      }
    })
  }

  const groupedPerms = permissions.reduce<Record<string, string[]>>((acc, p) => {
    const [group] = p.name.split(':')
    acc[group] = [...(acc[group] ?? []), p.name]
    return acc
  }, {})

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-medium text-foreground">Roles & Permissions</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{roles.length} roles</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          variant="outline"
          className="border bg-card hover:bg-secondary text-foreground h-8 px-3 text-sm font-medium rounded-md"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          New Role
        </Button>
      </div>

      {rolesLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {roles.map(role => (
            <div key={role.id} className="bg-card border rounded-lg overflow-hidden">
              <button
                onClick={() => handleExpand(role)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors duration-150"
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{role.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {role.permissions?.length ?? 0} permissions
                    {role.description ? ` · ${role.description}` : ''}
                  </p>
                </div>
                {expandedRole === role.id
                  ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                }
              </button>

              {expandedRole === role.id && (
                <div className="border-t p-4">
                  <div className="space-y-4">
                    {Object.entries(groupedPerms).map(([group, perms]) => (
                      <div key={group}>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{group}</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {perms.map(permName => {
                            const checked = (rolePerms[role.id] ?? []).includes(permName)
                            return (
                              <label
                                key={permName}
                                className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors duration-150"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => togglePerm(role.id, permName)}
                                  className="h-3.5 w-3.5 rounded border-muted-foreground bg-secondary accent-primary cursor-pointer"
                                />
                                <span>{permName.split(':')[1]}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end mt-4 pt-3 border-t">
                    <Button
                      onClick={() => updatePerms.mutate({ roleId: role.id, perms: rolePerms[role.id] ?? [] })}
                      disabled={updatePerms.isPending}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 h-7 px-3 text-xs font-medium rounded-md"
                    >
                      Save permissions
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border shadow-none p-0 max-w-sm">
          <div className="px-5 py-4 border-b">
            <DialogTitle className="text-base font-semibold text-foreground">Create Role</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-0.5">
              Add a new role to the system.
            </DialogDescription>
          </div>
          <div className="p-5 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Name</Label>
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. teaching_assistant"
                className="bg-secondary border text-foreground placeholder:text-muted-foreground h-9 text-sm rounded-md focus-visible:ring-1 focus-visible:ring-muted-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description (optional)</Label>
              <Input
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="e.g. Can manage course materials"
                className="bg-secondary border text-foreground placeholder:text-muted-foreground h-9 text-sm rounded-md focus-visible:ring-1 focus-visible:ring-muted-foreground"
              />
            </div>
          </div>
          <div className="px-5 py-4 border-t flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              className="border bg-transparent text-muted-foreground hover:bg-secondary h-8 px-3 text-sm rounded-md"
            >
              Cancel
            </Button>
            <Button
              onClick={() => createRole.mutate()}
              disabled={!newName.trim() || createRole.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-sm font-medium rounded-md"
            >
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
