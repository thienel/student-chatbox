import { useState } from 'react'
import { Plus, Search, UserX, UserCheck, Key, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { EmptyState } from '@/components/shared/EmptyState'
import { useUsers, useCreateUser, useUpdateUserStatus, useResetPassword } from './queries'
import { Users, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

const createSchema = z.object({
  email: z.string().email(),
  temporaryPassword: z.string().min(8, 'Min 8 characters'),
  fullName: z.string().min(1),
  role: z.enum(['admin', 'lecturer', 'student']),
})
type CreateForm = z.infer<typeof createSchema>

const roleColor: Record<string, string> = {
  admin: 'bg-secondary text-foreground border',
  lecturer: 'bg-secondary text-muted-foreground border',
  student: 'bg-muted text-muted-foreground border',
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [resetId, setResetId] = useState<string | null>(null)
  const [newPass, setNewPass] = useState('')

  const { data, isLoading } = useUsers({ search: search || undefined, limit: 50 })
  const createUser = useCreateUser()
  const updateStatus = useUpdateUserStatus()
  const resetPassword = useResetPassword()

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'student' },
  })

  const onCreateSubmit = async (data: CreateForm) => {
    await createUser.mutateAsync(data)
    setCreateOpen(false)
    reset()
  }

  const users = data?.items ?? []

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{data?.total ?? 0} total</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          variant="outline"
          className="border bg-card hover:bg-secondary text-foreground h-8 px-3 text-sm font-medium rounded-md"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New User
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-8 bg-card border text-foreground placeholder:text-muted-foreground h-9 rounded-md"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg bg-muted" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="No users found" />
      ) : (
        <div className="border rounded-lg overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">User</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Role</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden md:table-cell">Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Joined</th>
                <th className="w-10 py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b hover:bg-muted/50 transition-colors duration-150">
                  <td className="py-3 px-4">
                    <p className="text-foreground font-medium">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <Badge className={cn('text-[10px] rounded capitalize', roleColor[user.role] ?? roleColor['student'])}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <Badge className={cn('text-[10px] rounded capitalize border', user.status === 'active'
                      ? 'bg-secondary text-muted-foreground'
                      : 'bg-destructive/10 text-destructive border-destructive/20'
                    )}>
                      {user.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs hidden lg:table-cell">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border w-44">
                        {user.status === 'active' ? (
                          <DropdownMenuItem
                            onClick={() => updateStatus.mutate({ id: user.id, status: 'suspended' })}
                            className="text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Suspend
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => updateStatus.mutate({ id: user.id, status: 'active' })}
                            className="text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => { setResetId(user.id); setNewPass('') }}
                          className="text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
                        >
                          <Key className="h-4 w-4 mr-2" />
                          Reset password
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border rounded-lg shadow-none p-0 max-w-md">
          <div className="px-5 py-4 border-b">
            <DialogTitle className="text-base font-semibold text-foreground">Create User</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-0.5">Add a new user to the system.</DialogDescription>
          </div>
          <form onSubmit={handleSubmit(onCreateSubmit)}>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm text-foreground">Full Name</Label>
                <Input {...register('fullName')} className="bg-secondary border text-foreground" />
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-foreground">Email</Label>
                <Input {...register('email')} type="email" className="bg-secondary border text-foreground" />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-foreground">Temporary Password</Label>
                <Input {...register('temporaryPassword')} type="password" className="bg-secondary border text-foreground" />
                {errors.temporaryPassword && <p className="text-xs text-destructive">{errors.temporaryPassword.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-foreground">Role</Label>
                <select
                  {...register('role')}
                  className="w-full h-9 rounded-md bg-secondary border text-foreground text-sm px-3"
                >
                  <option value="student">Student</option>
                  <option value="lecturer">Lecturer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="px-5 py-4 border-t flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="border bg-transparent text-muted-foreground hover:bg-secondary h-8 px-3 text-sm rounded-md">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-sm rounded-md">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetId} onOpenChange={v => !v && setResetId(null)}>
        <DialogContent className="bg-card border rounded-lg shadow-none p-0 max-w-sm">
          <div className="px-5 py-4 border-b">
            <DialogTitle className="text-base font-semibold text-foreground">Reset Password</DialogTitle>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-foreground">New Password</Label>
              <Input
                type="password"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                className="bg-secondary border text-foreground"
              />
            </div>
          </div>
          <div className="px-5 py-4 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={() => setResetId(null)} className="border bg-transparent text-muted-foreground hover:bg-secondary h-8 px-3 text-sm rounded-md">
              Cancel
            </Button>
            <Button
              disabled={!newPass || resetPassword.isPending}
              onClick={async () => {
                if (resetId && newPass) {
                  await resetPassword.mutateAsync({ id: resetId, newPassword: newPass })
                  setResetId(null)
                }
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-sm rounded-md"
            >
              {resetPassword.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reset'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
