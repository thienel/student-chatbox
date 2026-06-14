import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Plus, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { useSubjects } from './queries'
import { useUnenroll } from '@/features/classes/queries'
import { EnrollDialog } from '@/features/classes/EnrollDialog'
import { usePermission } from '@/store/useAuthStore'
import { cn } from '@/lib/utils'

export default function SubjectsPage() {
  const navigate = useNavigate()
  const canCreate = usePermission('subject:create')
  const canEnroll = usePermission('subject:enroll')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useSubjects({ search: search || undefined, limit: 50 })

  const subjects = data?.items ?? []

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-50">Subjects</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {data?.total ?? 0} subjects available
          </p>
        </div>
        {canCreate && (
          <Button
            onClick={() => navigate('/admin/subjects')}
            className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200 h-8 px-3 text-sm font-medium rounded-md"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New Subject
          </Button>
        )}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
        <Input
          placeholder="Search by name or code..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-8 bg-zinc-900 border-zinc-800 text-zinc-50 placeholder:text-zinc-600 h-9 rounded-md"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg bg-zinc-900" />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects found"
          description={search ? 'Try a different search term.' : 'No subjects have been created yet.'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjects.map(subject => (
            <div
              key={subject.id}
              className="group bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors duration-150 cursor-pointer"
              onClick={() => navigate(`/subjects/${subject.id}/documents`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <p className="text-xs font-mono text-zinc-500 mb-0.5">{subject.code}</p>
                  <h3 className="text-sm font-medium text-zinc-50 truncate">{subject.name}</h3>
                </div>
                <Badge className={cn(
                  'text-[10px] rounded shrink-0 ml-2',
                  subject.status === 'active'
                    ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    : 'bg-zinc-900 text-zinc-600 border-zinc-800'
                )}>
                  {subject.status}
                </Badge>
              </div>

              {subject.description && (
                <p className="text-xs text-zinc-500 line-clamp-2 mb-3">{subject.description}</p>
              )}

              {subject.lecturers && subject.lecturers.length > 0 && (
                <p className="text-xs text-zinc-600 mb-3 truncate">
                  {subject.lecturers.map(l => l.fullName).join(', ')}
                </p>
              )}

              {canEnroll && (
                <div className="mt-auto pt-1" onClick={e => e.stopPropagation()}>
                  <EnrollButton subjectId={subject.id} isEnrolled={!!subject.isEnrolled} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function EnrollButton({ subjectId, isEnrolled }: { subjectId: string; isEnrolled: boolean }) {
  const [open, setOpen] = useState(false)
  const unenroll = useUnenroll(subjectId)

  if (isEnrolled) {
    return (
      <Button
        size="sm"
        disabled={unenroll.isPending}
        onClick={() => unenroll.mutate()}
        className="h-7 px-3 text-xs rounded-md w-full bg-transparent border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50"
      >
        {unenroll.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Leave class'}
      </Button>
    )
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        className="h-7 px-3 text-xs rounded-md w-full bg-zinc-50 text-zinc-950 hover:bg-zinc-200"
      >
        Enroll
      </Button>
      <EnrollDialog subjectId={subjectId} open={open} onOpenChange={setOpen} />
    </>
  )
}
