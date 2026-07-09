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
    <div className="max-w-7xl mx-auto px-8 py-10">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif text-primary-ink mb-2">Roles & Permissions</h1>
          <p className="text-sm text-muted-foreground font-mono">{roles.length} roles configured</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="rounded-full font-mono text-xs tracking-wider uppercase h-10 px-6 shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Role
        </Button>
      </header>

      {rolesLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-3xl bg-muted/50 border border-border/30" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {roles.map(role => (
            <div key={role.id} className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md">
              <button
                onClick={() => handleExpand(role)}
                className="w-full flex items-center justify-between px-8 py-5 hover:bg-muted/20 transition-colors duration-150"
              >
                <div className="text-left">
                  <p className="text-lg font-semibold text-foreground">{role.name}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    <span className="font-semibold text-primary/80">{role.permissions?.length ?? 0}</span> permissions
                    {role.description ? ` · ${role.description}` : ''}
                  </p>
                </div>
                <div className="bg-muted/50 p-2 rounded-full">
                  {expandedRole === role.id
                    ? <ChevronDown className="h-5 w-5 text-foreground shrink-0" />
                    : <ChevronRight className="h-5 w-5 text-foreground shrink-0" />
                  }
                </div>
              </button>

              {expandedRole === role.id && (
                <div className="border-t border-border/40 p-8 bg-muted/5">
                  <div className="space-y-8">
                    {Object.entries(groupedPerms).map(([group, perms]) => (
                      <div key={group} className="bg-card p-6 rounded-2xl border border-border/30 shadow-sm">
                        <p className="text-xs font-semibold text-primary font-mono uppercase tracking-widest mb-4">{group}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {perms.map(permName => {
                            const checked = (rolePerms[role.id] ?? []).includes(permName)
                            return (
                              <label
                                key={permName}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors duration-150 border border-transparent hover:border-border/50"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => togglePerm(role.id, permName)}
                                  className="h-4 w-4 rounded-sm border-muted-foreground bg-card accent-primary cursor-pointer"
                                />
                                <span className="text-sm font-medium text-foreground">{permName.split(':')[1]}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end mt-8 pt-6 border-t border-border/40">
                    <Button
                      onClick={() => updatePerms.mutate({ roleId: role.id, perms: rolePerms[role.id] ?? [] })}
                      disabled={updatePerms.isPending}
                      className="rounded-full font-mono text-xs tracking-wider uppercase h-11 px-8 shadow-sm"
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
        <DialogContent className="bg-card border border-border/60 rounded-[2rem] shadow-xl p-0 max-w-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-border/40 bg-muted/10">
            <DialogTitle className="text-2xl font-serif text-primary-ink">Create Role</DialogTitle>
            <DialogDescription className="text-sm font-mono text-muted-foreground mt-2">
              Add a new role to the system.
            </DialogDescription>
          </div>
          <div className="p-8 space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground ml-1">Name</Label>
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. teaching_assistant"
                className="rounded-xl font-mono text-sm border-border/60 bg-muted/5 focus-visible:ring-primary h-11 px-4"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground ml-1">Description (optional)</Label>
              <Input
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="e.g. Can manage course materials"
                className="rounded-xl font-mono text-sm border-border/60 bg-muted/5 focus-visible:ring-primary h-11 px-4"
              />
            </div>
          </div>
          <div className="px-8 py-5 border-t border-border/40 flex justify-end gap-3 bg-muted/10">
            <Button
              variant="ghost"
              onClick={() => setCreateOpen(false)}
              className="rounded-full font-mono text-xs px-5 hover:bg-muted/50"
            >
              Cancel
            </Button>
            <Button
              onClick={() => createRole.mutate()}
              disabled={!newName.trim() || createRole.isPending}
              className="rounded-full font-mono text-xs tracking-wider uppercase px-6 shadow-sm"
            >
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
