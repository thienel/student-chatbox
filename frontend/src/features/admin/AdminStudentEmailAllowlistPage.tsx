import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search, ShieldCheck, Mail, Loader2, UploadCloud, MoreHorizontal, Check, ShieldX } from 'lucide-react'
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
import { cn } from '@/lib/utils'

import { useAllowlist, useCreateAllowlist, useBulkImportAllowlist, useEnableAllowlist, useDisableAllowlist } from './allowlist-queries'
import { BulkImportDialog } from './components/BulkImportDialog'

const createSchema = z.object({
  personalEmail: z.string().email('Invalid email'),
  studentCode: z.string().min(3, 'Student code required'),
})
type CreateForm = z.infer<typeof createSchema>

export default function AdminStudentEmailAllowlistPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') || 'all'
  const [activeTab, setActiveTab] = useState<'all' | 'available' | 'claimed' | 'disabled'>(
    (initialTab as any) || 'all'
  )
  const [search, setSearch] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)

  useEffect(() => {
    setSearchParams({ tab: activeTab })
  }, [activeTab, setSearchParams])

  let statusFilter: string | undefined = undefined
  if (activeTab === 'available') statusFilter = 'available'
  if (activeTab === 'claimed') statusFilter = 'claimed'
  if (activeTab === 'disabled') statusFilter = 'disabled'

  const { data, isLoading } = useAllowlist({ search: search || undefined, status: statusFilter, limit: 50 })

  const createRecord = useCreateAllowlist()
  const bulkImport = useBulkImportAllowlist()
  const enableRecord = useEnableAllowlist()
  const disableRecord = useDisableAllowlist()

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  })

  const onCreateSubmit = async (data: CreateForm) => {
    await createRecord.mutateAsync(data)
    setCreateOpen(false)
    reset()
  }

  const handleBulkImport = async (records: { personalEmail: string; studentCode: string }[]) => {
    await bulkImport.mutateAsync({ records })
  }

  const records = data?.items ?? []

  return (
    <div className="max-w-7xl mx-auto px-8 py-10">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif text-primary-ink mb-2">Email Allowlist</h1>
          <p className="text-sm text-muted-foreground font-mono">
            {data?.total ?? 0} {activeTab} records found
          </p>
        </div>
        <div className="flex items-center gap-4 bg-card p-2 rounded-full border border-border/50 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search email or code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-11 w-64 bg-muted/20 border-transparent focus-visible:ring-primary font-mono text-sm rounded-full h-10"
            />
          </div>
          <Button
            onClick={() => setBulkOpen(true)}
            variant="outline"
            className="rounded-full font-mono text-xs tracking-wider uppercase h-10 px-6 bg-muted/30 border-transparent hover:border-border/50"
          >
            <UploadCloud className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
          <Button
            onClick={() => setCreateOpen(true)}
            className="rounded-full font-mono text-xs tracking-wider uppercase h-10 px-6 shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Email
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 bg-muted/20 p-1.5 rounded-full w-fit border border-border/40">
        {(['all', 'available', 'claimed', 'disabled'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-6 py-2.5 font-mono text-xs uppercase tracking-widest transition-all duration-300 rounded-full",
              activeTab === tab ? "bg-card text-primary shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl bg-muted/50 border border-border/30" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="border border-border/50 bg-card rounded-3xl p-16 text-center flex flex-col items-center shadow-sm">
          <div className="p-4 bg-muted/30 rounded-full mb-4">
            <ShieldCheck className="w-12 h-12 text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">No records found</p>
        </div>
      ) : (
        <div className="border border-border/50 bg-card rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                <th className="text-left py-5 px-6 text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Identity</th>
                <th className="text-left pl-10 py-5 px-6 text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th className="text-left py-5 px-6 text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Date Added</th>
                <th className="w-24 py-5 px-6 text-center text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {records.map((record: any) => (
                <tr key={record.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2.5 rounded-full text-primary shrink-0 hidden sm:block">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-foreground font-medium font-serif text-lg">{record.personalEmail}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5 tracking-wide">ID: {record.studentCode}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-6 hidden sm:table-cell">
                    {!record.isActive ? (
                      <Badge variant="outline" className="border-destructive/30 text-destructive bg-destructive/5 text-[10px] rounded-full uppercase font-mono tracking-wider px-3 py-1">
                        Disabled
                      </Badge>
                    ) : record.isClaimed ? (
                      <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-[10px] rounded-full uppercase font-mono tracking-wider px-3 py-1">
                        Claimed
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/5 text-[10px] rounded-full uppercase font-mono tracking-wider px-3 py-1">
                        Available
                      </Badge>
                    )}
                  </td>

                  <td className="py-4 px-6 hidden lg:table-cell">
                    <p className="text-muted-foreground font-mono text-xs">
                      {new Date(record.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </td>

                  <td className="py-4 px-6 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 rounded-xl font-mono text-xs">
                        {!record.isActive ? (
                          <DropdownMenuItem onClick={() => enableRecord.mutate(record.id)} className="gap-2 cursor-pointer text-emerald-600 focus:text-emerald-700">
                            <Check className="h-3.5 w-3.5" /> Enable
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => disableRecord.mutate(record.id)} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                            <ShieldX className="h-3.5 w-3.5" /> Disable
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <BulkImportDialog 
        open={bulkOpen} 
        onOpenChange={setBulkOpen} 
        onImport={handleBulkImport} 
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[425px] border-border/50 bg-card rounded-[2rem] p-8">
          <div className="mb-6">
            <DialogTitle className="text-2xl font-serif text-primary-ink mb-1">Add to Allowlist</DialogTitle>
            <DialogDescription className="font-mono text-xs text-muted-foreground">
              Authorize a personal email for student registration.
            </DialogDescription>
          </div>
          
          <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="personalEmail" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Personal Email</Label>
              <Input 
                id="personalEmail" 
                type="email" 
                {...register('personalEmail')} 
                placeholder="student@gmail.com"
                className="rounded-xl font-mono text-sm border-border/60 focus-visible:ring-primary h-11 px-4 bg-muted/5" 
              />
              {errors.personalEmail && <p className="text-destructive font-mono text-xs">{errors.personalEmail.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="studentCode" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Student Code</Label>
              <Input 
                id="studentCode" 
                {...register('studentCode')} 
                placeholder="SE123456"
                className="rounded-xl font-mono text-sm border-border/60 focus-visible:ring-primary h-11 px-4 bg-muted/5" 
              />
              {errors.studentCode && <p className="text-destructive font-mono text-xs">{errors.studentCode.message}</p>}
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} className="rounded-full font-mono text-xs tracking-wider uppercase h-11 px-6">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-full font-mono text-xs tracking-wider uppercase h-11 px-8 shadow-sm">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Record
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
