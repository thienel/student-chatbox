import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search, Loader2 } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { useUsers, useCreateUser, useUpdateUserStatus } from './queries'
import { Users } from 'lucide-react'
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

  const { register, control, handleSubmit, formState: { isSubmitting }, reset } = useForm<CreateForm>({
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
    <div className="max-w-7xl mx-auto px-8 py-10">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif text-primary-ink mb-2">User Registry</h1>
          <p className="text-sm text-muted-foreground font-mono">
            {data?.total ?? 0} {activeTab} accounts found
          </p>
        </div>
        <div className="flex items-center gap-4 bg-card p-2 rounded-full border border-border/50 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-11 w-64 bg-muted/20 border-transparent focus-visible:ring-primary font-mono text-sm rounded-full h-10"
            />
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="rounded-full font-mono text-xs tracking-wider uppercase h-10 px-6 shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Identity
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-muted/20 p-1.5 rounded-full w-fit border border-border/40">
        <button
          onClick={() => setActiveTab('all')}
          className={cn(
            "px-6 py-2.5 font-mono text-xs uppercase tracking-widest transition-all duration-300 rounded-full",
            activeTab === 'all' ? "bg-card text-primary shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          All Accounts
        </button>
        <button
          onClick={() => setActiveTab('suspended')}
          className={cn(
            "px-6 py-2.5 font-mono text-xs uppercase tracking-widest transition-all duration-300 rounded-full",
            activeTab === 'suspended' ? "bg-card text-destructive shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          Suspended
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl bg-muted/50 border border-border/30" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="border border-border/50 bg-card rounded-3xl p-16 text-center flex flex-col items-center shadow-sm">
          <div className="p-4 bg-muted/30 rounded-full mb-4">
            <Users className="w-12 h-12 text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">No records found</p>
        </div>
      ) : (
        <div className="border border-border/50 bg-card rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                <th className="text-left py-5 px-6 text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Identity</th>
                <th className="text-left pl-10 py-5 px-6 text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Role</th>
                <th className="text-left py-5 px-6 text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Registered</th>
                <th className="w-24 py-5 px-6 text-center text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="py-4 px-6">
                    <p className="text-foreground font-medium font-serif text-lg">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-1">{user.email}</p>
                  </td>

                  <td className="py-4 px-6 hidden sm:table-cell">
                    <Badge variant="outline" className={cn(
                      'text-[10px] rounded-full uppercase font-mono tracking-wider px-3 py-1',
                      user.roleName === 'admin' ? 'border-primary/50 text-primary bg-primary/5' : 'border-border text-muted-foreground'
                    )}>
                      {user.roleName}
                    </Badge>
                  </td>

                  <td className="py-4 px-6 text-muted-foreground text-xs font-mono hidden lg:table-cell">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>

                  <td className="py-4 px-6 text-right">
                    {user.status === 'active' ? (
                      <Button variant="outline" onClick={() => updateStatus.mutate({ id: user.id, status: 'suspended' })} className="px-3 py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-xl transition-colors">
                        Suspend Access
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={() => updateStatus.mutate({ id: user.id, status: 'active' })} className="px-3 py-2.5 text-primary focus:text-primary focus:bg-primary/10 cursor-pointer rounded-xl transition-colors">
                        Restore Access
                      </Button>
                    )}
                  </td>


                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border border-border/60 rounded-[2rem] shadow-xl p-0 max-w-md overflow-hidden">
          <div className="px-8 py-6 border-b border-border/40 bg-muted/10">
            <DialogTitle className="text-2xl font-serif text-primary-ink">Register Identity</DialogTitle>
          </div>
          <form onSubmit={handleSubmit(onCreateSubmit)}>
            <div className="p-8 space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                <Input {...register('fullName')} className="rounded-xl font-mono text-sm border-border/60 focus-visible:ring-primary h-11 px-4" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground ml-1">Email</Label>
                <Input {...register('email')} type="email" className="rounded-xl font-mono text-sm border-border/60 focus-visible:ring-primary h-11 px-4" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground ml-1">Temp Password</Label>
                <Input {...register('temporaryPassword')} type="password" className="rounded-xl font-mono text-sm border-border/60 focus-visible:ring-primary h-11 px-4" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground ml-1">Role</Label>
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="w-full h-11 rounded-xl bg-card border border-border/60 text-foreground font-mono text-sm px-4 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-transparent transition-all shadow-sm">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/60 bg-card shadow-lg font-mono text-sm">
                        <SelectItem value="student" className="rounded-lg py-2.5 pl-9 pr-4 cursor-pointer focus:bg-muted/50">Student</SelectItem>
                        <SelectItem value="lecturer" className="rounded-lg py-2.5 pl-9 pr-4 cursor-pointer focus:bg-muted/50">Lecturer</SelectItem>
                        <SelectItem value="admin" className="rounded-lg py-2.5 pl-9 pr-4 cursor-pointer focus:bg-muted/50">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="px-8 py-5 border-t border-border/40 flex justify-end gap-3 bg-muted/10">
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} className="rounded-full font-mono text-xs px-5 hover:bg-muted/50">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-full font-mono text-xs tracking-wider px-6 shadow-sm">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Register'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

