import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Search, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { useSubjects } from '@/api/queries/subjects'
import { useUnenroll } from '@/api/queries/classes'
import { EnrollDialog } from '@/features/classes/EnrollDialog'
import { usePermission } from '@/store/useUserStore'
import { cn } from '@/lib/utils'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
}

export default function SubjectsPage() {
  const navigate = useNavigate()
  const canEnroll = usePermission('subject:enroll')
  const [search, setSearch] = useState('')
  const { data, isLoading } = useSubjects({ search: search || undefined, limit: 50 })
  const subjects = data?.items ?? []

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-serif text-primary-ink tracking-tight mb-2">Subjects Directory</h1>
          <p className="text-sm font-mono text-muted-foreground">
            {data?.total ?? 0} courses registered
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subjects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-card border-border/50 text-foreground placeholder:text-muted-foreground h-10 rounded-full font-mono text-sm focus-visible:ring-primary shadow-sm"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-3xl bg-muted/50 border border-border/30" />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <div className="border border-border/50 bg-card rounded-3xl p-16 text-center shadow-sm">
          <EmptyState
            icon={BookOpen}
            title="No subjects found"
            description={search ? 'Try a different search term.' : 'The registry is currently empty.'}
          />
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {subjects.map(subject => (
                <motion.div
                  variants={itemVariants}
                  layout
                  key={subject.id}
                  className="bg-card card-texture border border-border/50 rounded-3xl p-6 hover:border-primary/40 hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col group relative overflow-hidden"
                  onClick={() => navigate(
                    window.location.pathname.startsWith('/lecturer')
                      ? `/lecturer/subjects/${subject.id}/classes`
                      : `/subjects/${subject.id}/documents`
                  )}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-primary/10 transition-colors" />
                  
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className="min-w-0 pr-4">
                      <span className="inline-block text-[10px] font-mono font-bold tracking-widest uppercase bg-primary/10 text-primary px-2.5 py-0.5 rounded-full mb-3">
                        {subject.code}
                      </span>
                      <h3 className="text-xl font-serif font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {subject.name}
                      </h3>
                    </div>
                  </div>

                  {subject.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 font-sans leading-relaxed relative z-10">
                      {subject.description}
                    </p>
                  )}

                  <div className="mt-auto pt-4 flex items-end justify-between relative z-10">
                    <div className="min-w-0">
                      {subject.lecturers && subject.lecturers.length > 0 && (
                        <p className="text-[11px] font-mono text-muted-foreground truncate max-w-[150px]">
                          Prof. {subject.lecturers.map(l => l.fullName.split(' ').pop()).join(', ')}
                        </p>
                      )}
                    </div>
                    <Badge className={cn(
                      'text-[9px] font-mono tracking-wider rounded-full px-2 py-0.5 border',
                      subject.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        : 'bg-muted text-muted-foreground'
                    )}>
                      {subject.status}
                    </Badge>
                  </div>

                  {window.location.pathname.startsWith('/lecturer') ? (
                    <div className="mt-4 pt-3 border-t border-border/40 flex gap-2 relative z-10" onClick={e => e.stopPropagation()}>
                      <Button 
                        size="sm" 
                        className="flex-1 h-8 px-4 text-[10px] font-mono rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-none"
                        onClick={() => navigate(`/lecturer/subjects/${subject.id}/classes`)}
                      >
                        Classes
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1 h-8 px-4 text-[10px] font-mono rounded-full bg-secondary text-foreground hover:bg-secondary/80 transition-all shadow-none border border-border/50"
                        onClick={() => navigate(`/lecturer/subjects/${subject.id}/documents`)}
                      >
                        Documents
                      </Button>
                    </div>
                  ) : canEnroll && (
                    <div className="mt-4 pt-3 border-t border-border/40 relative z-10" onClick={e => e.stopPropagation()}>
                      <EnrollButton subjectId={subject.id} isEnrolled={!!subject.isEnrolled} />
                    </div>
                  )}
                </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
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
        className="h-8 px-4 text-xs font-mono rounded-full w-full bg-transparent border border-destructive/20 text-destructive hover:bg-destructive hover:border-destructive hover:text-destructive-foreground transition-all"
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
        className="h-8 px-4 text-xs font-mono rounded-full w-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-none"
      >
        Enroll
      </Button>
      <EnrollDialog subjectId={subjectId} open={open} onOpenChange={setOpen} />
    </>
  )
}
