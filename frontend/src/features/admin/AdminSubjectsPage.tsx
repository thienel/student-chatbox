import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Trash2, Loader2, ExternalLink } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { BookOpen } from 'lucide-react'
import { useSubjects, useCreateSubject, useDeleteSubject } from '@/api/queries/subjects'
import { cn } from '@/lib/utils'

const createSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
})
type CreateForm = z.infer<typeof createSchema>

export default function AdminSubjectsPage() {
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  const navigate = useNavigate()
  const { data, isLoading } = useSubjects({ search: search || undefined, limit: 50 })
  const createSubject = useCreateSubject()
  const deleteSubject = useDeleteSubject()

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  })

  const onSubmit = async (data: CreateForm) => {
    await createSubject.mutateAsync(data)
    setCreateOpen(false)
    reset()
  }

  const subjects = data?.items ?? []

  return (
    <div className="max-w-7xl mx-auto px-8 py-10">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif text-primary-ink mb-2">Subject Directory</h1>
          <p className="text-sm text-muted-foreground font-mono">
            {data?.total ?? 0} active subjects registered
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-card p-2 rounded-full border border-border/50 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subjects..."
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
            New Subject
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl bg-muted/50 border border-border/30" />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <div className="border border-border/50 bg-card rounded-3xl p-16 shadow-sm">
          <EmptyState icon={BookOpen} title="No subjects yet" />
        </div>
      ) : (
        <div className="border border-border/50 rounded-3xl overflow-hidden bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                <th className="text-left py-5 px-6 text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Subject</th>
                <th className="text-left py-5 px-6 text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Code</th>
                <th className="text-left py-5 px-6 text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Status</th>
                <th className="w-24 py-5 px-6" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {subjects.map(s => (
                <tr
                  key={s.id}
                  className="hover:bg-muted/30 transition-colors duration-150 cursor-pointer group"
                  onClick={() => navigate(`/subjects/${s.id}/documents`)}
                >
                  <td className="py-4 px-6">
                    <p className="text-foreground font-serif text-lg font-medium">{s.name}</p>
                    {s.description && <p className="text-xs text-muted-foreground font-mono mt-1 truncate max-w-[280px]">{s.description}</p>}
                  </td>
                  <td className="py-4 px-6 text-muted-foreground text-sm font-mono font-semibold hidden sm:table-cell">{s.code}</td>
                  <td className="py-4 px-6 hidden md:table-cell">
                    <Badge className={cn('text-[10px] rounded-full uppercase font-mono tracking-wider px-3 py-1 border', 
                      s.status === 'active'
                      ? 'bg-primary/5 text-primary border-primary/20'
                      : 'bg-muted text-muted-foreground border-border/50'
                    )}>
                      {s.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/subjects/${s.id}/documents`)}
                        className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                        title="View subject"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSubject.mutate(s.id)}
                        className="h-9 w-9 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border border-border/60 rounded-[2rem] shadow-xl p-0 max-w-md overflow-hidden">
          <div className="px-8 py-6 border-b border-border/40 bg-muted/10">
            <DialogTitle className="text-2xl font-serif text-primary-ink">Create Subject</DialogTitle>
            <DialogDescription className="text-sm font-mono text-muted-foreground mt-2">Add a new subject to the system.</DialogDescription>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-8 space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground ml-1">Code</Label>
                <Input {...register('code')} placeholder="e.g. CS101" className="rounded-xl font-mono text-sm border-border/60 bg-muted/5 focus-visible:ring-primary h-11 px-4" />
                {errors.code && <p className="text-xs text-destructive ml-1">{errors.code.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground ml-1">Name</Label>
                <Input {...register('name')} placeholder="Introduction to CS" className="rounded-xl font-mono text-sm border-border/60 bg-muted/5 focus-visible:ring-primary h-11 px-4" />
                {errors.name && <p className="text-xs text-destructive ml-1">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground ml-1">Description (optional)</Label>
                <Input {...register('description')} className="rounded-xl font-mono text-sm border-border/60 bg-muted/5 focus-visible:ring-primary h-11 px-4" />
              </div>
            </div>
            <div className="px-8 py-5 border-t border-border/40 flex justify-end gap-3 bg-muted/10">
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} className="rounded-full font-mono text-xs px-5 hover:bg-muted/50">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-full font-mono text-xs tracking-wider px-6 shadow-sm">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
