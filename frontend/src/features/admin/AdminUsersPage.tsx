import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search, UserX, UserCheck, Key, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

import { useUsers, useCreateUser, useUpdateUserStatus } from './queries'
import { Users, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

const createSchema = z.object({
  email: z.string().email(),
  temporaryPassword: z.string().min(8, 'Min 8 characters'),
  fullName: z.string().min(1),
  role: z.enum(['admin', 'lecturer', 'student']),
})
type CreateForm = z.infer<typeof createSchema>

export default function AdminUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') || 'all'
  const [activeTab, setActiveTab] = useState<'all' | 'suspended'>(initialTab === 'suspended' ? 'suspended' : 'all')
  const [search, setSearch] = useState('')
  
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    setSearchParams({ tab: activeTab })
  }, [activeTab, setSearchParams])

  const statusFilter = activeTab === 'suspended' ? 'suspended' : undefined
  const { data, isLoading } = useUsers({ search: search || undefined, status: statusFilter, limit: 50 })
  
  const createUser = useCreateUser()
  const updateStatus = useUpdateUserStatus()

  const { register, handleSubmit, formState: { isSubmitting }, reset } = useForm<CreateForm>({
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
    <div className="max-w-7xl mx-auto px-6 py-8">
      <header className="mb-8 pb-6 border-b border-border flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-primary-ink mb-2">User Registry</h1>
          <p className="text-sm text-muted-foreground font-mono">
            {data?.total ?? 0} {activeTab} accounts found
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 w-64 bg-card border-border font-mono text-sm rounded-none"
            />
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="rounded-none font-mono text-xs tracking-wider uppercase h-10 px-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Identity
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={cn(
            "px-6 py-3 font-mono text-xs uppercase tracking-widest transition-colors border-b-2 -mb-px",
            activeTab === 'all' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          All Accounts
        </button>
        <button
          onClick={() => setActiveTab('suspended')}
          className={cn(
            "px-6 py-3 font-mono text-xs uppercase tracking-widest transition-colors border-b-2 -mb-px",
            activeTab === 'suspended' ? "border-destructive text-destructive" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Suspended
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-none bg-muted/50 border border-border" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="border border-border bg-card p-12 text-center flex flex-col items-center">
          <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">No records found</p>
        </div>
      ) : (
        <div className="border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-4 px-5 text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">Identity</th>
                <th className="text-left py-4 px-5 text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Role</th>
                <th className="text-left py-4 px-5 text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Registered</th>
                <th className="w-24 py-4 px-5 text-right text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-muted/10 transition-colors">
                  <td className="py-4 px-5">
                    <p className="text-foreground font-medium font-serif text-base">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{user.email}</p>
                  </td>
                  
                  <td className="py-4 px-5 hidden sm:table-cell">
                    <Badge variant="outline" className={cn(
                      'text-[10px] rounded-none uppercase font-mono tracking-wider',
                      user.role === 'admin' ? 'border-primary text-primary' : 'border-muted-foreground text-muted-foreground'
                    )}>
                      {user.role}
                    </Badge>
                  </td>
                  
                  <td className="py-4 px-5 text-muted-foreground text-xs font-mono hidden lg:table-cell">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  
                  <td className="py-4 px-5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-border rounded-none font-mono text-xs w-48 p-0">
                        {user.status === 'active' ? (
                          <DropdownMenuItem
                            onClick={() => updateStatus.mutate({ id: user.id, status: 'suspended' })}
                            className="px-3 py-2 text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-none"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Suspend Access
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => updateStatus.mutate({ id: user.id, status: 'active' })}
                            className="px-3 py-2 text-primary focus:text-primary focus:bg-primary/10 cursor-pointer rounded-none"
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Restore Access
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => { console.log('Reset Password for', user.id) }}
                          className="px-3 py-2 text-muted-foreground focus:text-foreground focus:bg-muted cursor-pointer rounded-none border-t border-border"
                        >
                          <Key className="h-4 w-4 mr-2" />
                          Reset Key
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
        <DialogContent className="bg-card border-border rounded-none shadow-none p-0 max-w-md">
          <div className="px-6 py-5 border-b border-border">
            <DialogTitle className="text-xl font-serif text-primary-ink">Register Identity</DialogTitle>
          </div>
          <form onSubmit={handleSubmit(onCreateSubmit)}>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Full Name</Label>
                <Input {...register('fullName')} className="rounded-none font-mono text-sm border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Email</Label>
                <Input {...register('email')} type="email" className="rounded-none font-mono text-sm border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Temp Password</Label>
                <Input {...register('temporaryPassword')} type="password" className="rounded-none font-mono text-sm border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Role</Label>
                <select
                  {...register('role')}
                  className="w-full h-10 rounded-none bg-transparent border border-border text-foreground font-mono text-sm px-3 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="student">Student</option>
                  <option value="lecturer">Lecturer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end gap-3 bg-muted/10">
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} className="rounded-none font-mono text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-none font-mono text-xs tracking-wider">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Register'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
