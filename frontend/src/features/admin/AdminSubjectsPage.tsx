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
import { useSubjects, useCreateSubject, useDeleteSubject } from '@/features/subjects/queries'
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
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Subjects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{data?.total ?? 0} total</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          variant="outline"
          className="border bg-card hover:bg-secondary text-foreground h-8 px-3 text-sm font-medium rounded-md"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New Subject
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-8 bg-card border text-foreground placeholder:text-muted-foreground h-9 rounded-md"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg bg-muted" />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <EmptyState icon={BookOpen} title="No subjects yet" />
      ) : (
        <div className="border rounded-lg overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">Subject</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Code</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden md:table-cell">Status</th>
                <th className="w-10 py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {subjects.map(s => (
                <tr
                  key={s.id}
                  className="border-b hover:bg-muted/50 transition-colors duration-150 cursor-pointer"
                  onClick={() => navigate(`/subjects/${s.id}/documents`)}
                >
                  <td className="py-3 px-4">
                    <p className="text-foreground">{s.name}</p>
                    {s.description && <p className="text-xs text-muted-foreground truncate max-w-[240px]">{s.description}</p>}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs font-mono hidden sm:table-cell">{s.code}</td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <Badge className={cn('text-[10px] rounded capitalize border', s.status === 'active'
                      ? 'bg-secondary text-muted-foreground'
                      : 'bg-muted text-muted-foreground'
                    )}>
                      {s.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/subjects/${s.id}/documents`)}
                        className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
                        title="View subject"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSubject.mutate(s.id)}
                        className="h-7 w-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
        <DialogContent className="bg-card border rounded-lg shadow-none p-0 max-w-md">
          <div className="px-5 py-4 border-b">
            <DialogTitle className="text-base font-semibold text-foreground">Create Subject</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-0.5">Add a new subject to the system.</DialogDescription>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm text-foreground">Code</Label>
                <Input {...register('code')} placeholder="e.g. CS101" className="bg-secondary border text-foreground" />
                {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-foreground">Name</Label>
                <Input {...register('name')} placeholder="Introduction to CS" className="bg-secondary border text-foreground" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-foreground">Description (optional)</Label>
                <Input {...register('description')} className="bg-secondary border text-foreground" />
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
    </div>
  )
}
