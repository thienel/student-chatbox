import { useState } from 'react'
import { Plus, Search, Trash2, Loader2 } from 'lucide-react'
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
          <h1 className="text-xl font-semibold text-zinc-50">Subjects</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{data?.total ?? 0} total</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200 h-8 px-3 text-sm font-medium rounded-md"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New Subject
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
        <Input
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-8 bg-zinc-900 border-zinc-800 text-zinc-50 placeholder:text-zinc-600 h-9 rounded-md"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg bg-zinc-900" />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <EmptyState icon={BookOpen} title="No subjects yet" />
      ) : (
        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide">Subject</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden sm:table-cell">Code</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden md:table-cell">Status</th>
                <th className="w-10 py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {subjects.map(s => (
                <tr key={s.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors duration-150">
                  <td className="py-3 px-4">
                    <p className="text-zinc-300">{s.name}</p>
                    {s.description && <p className="text-xs text-zinc-500 truncate max-w-[240px]">{s.description}</p>}
                  </td>
                  <td className="py-3 px-4 text-zinc-500 text-xs font-mono hidden sm:table-cell">{s.code}</td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <Badge className={cn('text-[10px] rounded capitalize', s.status === 'active'
                      ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      : 'bg-zinc-900 text-zinc-600 border-zinc-800'
                    )}>
                      {s.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteSubject.mutate(s.id)}
                      className="h-7 w-7 rounded-md text-zinc-600 hover:text-red-400 hover:bg-zinc-800"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-none p-0 max-w-md">
          <div className="px-5 py-4 border-b border-zinc-800">
            <DialogTitle className="text-base font-semibold text-zinc-50">Create Subject</DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 mt-0.5">Add a new subject to the system.</DialogDescription>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm text-zinc-300">Code</Label>
                <Input {...register('code')} placeholder="e.g. CS101" className="bg-zinc-950 border-zinc-800 text-zinc-50" />
                {errors.code && <p className="text-xs text-red-400">{errors.code.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-zinc-300">Name</Label>
                <Input {...register('name')} placeholder="Introduction to CS" className="bg-zinc-950 border-zinc-800 text-zinc-50" />
                {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-zinc-300">Description (optional)</Label>
                <Input {...register('description')} className="bg-zinc-950 border-zinc-800 text-zinc-50" />
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
    </div>
  )
}
