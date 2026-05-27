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
  admin: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  lecturer: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  student: 'bg-zinc-900 text-zinc-500 border-zinc-800',
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
          <h1 className="text-xl font-semibold text-zinc-50">Users</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{data?.total ?? 0} total</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200 h-8 px-3 text-sm font-medium rounded-md"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New User
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-8 bg-zinc-900 border-zinc-800 text-zinc-50 placeholder:text-zinc-600 h-9 rounded-md"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg bg-zinc-900" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="No users found" />
      ) : (
        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide">User</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden sm:table-cell">Role</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden md:table-cell">Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden lg:table-cell">Joined</th>
                <th className="w-10 py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors duration-150">
                  <td className="py-3 px-4">
                    <p className="text-zinc-300 font-medium">{user.fullName}</p>
                    <p className="text-xs text-zinc-500">{user.email}</p>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <Badge className={cn('text-[10px] rounded capitalize', roleColor[user.role] ?? roleColor['student'])}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <Badge className={cn('text-[10px] rounded capitalize', user.status === 'active'
                      ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      : 'bg-red-950 text-red-400 border-red-900'
                    )}>
                      {user.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-zinc-500 text-xs hidden lg:table-cell">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 w-44">
                        {user.status === 'active' ? (
                          <DropdownMenuItem
                            onClick={() => updateStatus.mutate({ id: user.id, status: 'suspended' })}
                            className="text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 cursor-pointer"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Suspend
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => updateStatus.mutate({ id: user.id, status: 'active' })}
                            className="text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 cursor-pointer"
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => { setResetId(user.id); setNewPass('') }}
                          className="text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 cursor-pointer"
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
        <DialogContent className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-none p-0 max-w-md">
          <div className="px-5 py-4 border-b border-zinc-800">
            <DialogTitle className="text-base font-semibold text-zinc-50">Create User</DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 mt-0.5">Add a new user to the system.</DialogDescription>
          </div>
          <form onSubmit={handleSubmit(onCreateSubmit)}>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm text-zinc-300">Full Name</Label>
                <Input {...register('fullName')} className="bg-zinc-950 border-zinc-800 text-zinc-50" />
                {errors.fullName && <p className="text-xs text-red-400">{errors.fullName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-zinc-300">Email</Label>
                <Input {...register('email')} type="email" className="bg-zinc-950 border-zinc-800 text-zinc-50" />
                {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-zinc-300">Temporary Password</Label>
                <Input {...register('temporaryPassword')} type="password" className="bg-zinc-950 border-zinc-800 text-zinc-50" />
                {errors.temporaryPassword && <p className="text-xs text-red-400">{errors.temporaryPassword.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-zinc-300">Role</Label>
                <select
                  {...register('role')}
                  className="w-full h-9 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-50 text-sm px-3"
                >
                  <option value="student">Student</option>
                  <option value="lecturer">Lecturer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-zinc-800 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 h-8 px-3 text-sm rounded-md">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200 h-8 px-3 text-sm rounded-md">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetId} onOpenChange={v => !v && setResetId(null)}>
        <DialogContent className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-none p-0 max-w-sm">
          <div className="px-5 py-4 border-b border-zinc-800">
            <DialogTitle className="text-base font-semibold text-zinc-50">Reset Password</DialogTitle>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-zinc-300">New Password</Label>
              <Input
                type="password"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-zinc-50"
              />
            </div>
          </div>
          <div className="px-5 py-4 border-t border-zinc-800 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setResetId(null)} className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 h-8 px-3 text-sm rounded-md">
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
              className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200 h-8 px-3 text-sm rounded-md"
            >
              {resetPassword.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reset'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
