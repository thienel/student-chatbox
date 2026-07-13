import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { GraduationCap, Plus, Users, Loader2, KeyRound } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/errors'
import { useClasses, useCreateClass } from '@/api/queries/classes'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
}

export default function ClassesPage() {
  const { id: subjectId = '' } = useParams<{ id: string }>()
  const { toast } = useToast()
  const { data: classes = [], isLoading } = useClasses(subjectId)
  const create = useCreateClass(subjectId)

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')

  const submit = () => {
    if (!name.trim() || !password.trim()) return
    create.mutate(
      { name: name.trim(), password },
      {
        onSuccess: () => {
          toast({ description: 'Class created.' })
          setName('')
          setPassword('')
          setOpen(false)
        },
        onError: (err) =>
          toast({ variant: 'destructive', description: getErrorMessage(err, 'Failed to create class.') }),
      },
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-serif text-primary-ink tracking-tight mb-2">Subject Classes</h2>
          <p className="text-sm font-mono text-muted-foreground">
            Manage your class sessions and student enrollments.
          </p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-5 text-sm font-medium rounded-full shadow-sm hover:shadow-md transition-all shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Class
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl bg-muted/50 border border-border/30" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <div className="border border-border/50 bg-card rounded-3xl p-16 text-center shadow-sm">
          <EmptyState
            icon={GraduationCap}
            title="No classes established"
            description="Create your first class and share its password with your students."
          />
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          <AnimatePresence>
            {classes.map(c => (
              <motion.div
                variants={itemVariants}
                layout
                key={c.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between bg-card card-texture border border-border/50 rounded-2xl px-6 py-5 gap-4 hover:border-primary/40 hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-12 w-12 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors text-muted-foreground">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-serif font-semibold text-foreground truncate group-hover:text-primary transition-colors">{c.name}</p>
                    {c.lecturer && (
                      <p className="text-[11px] font-mono text-muted-foreground truncate mt-0.5">Prof. {c.lecturer.fullName}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-6 shrink-0 border-t sm:border-t-0 sm:border-l border-border/40 pt-4 sm:pt-0 sm:pl-6">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Students</span>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <Users className="h-4 w-4 text-emerald-500" />
                      {c.studentCount ?? 0}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border border-border/60 rounded-[2rem] shadow-2xl p-0 max-w-md overflow-hidden">
          <div className="px-8 py-8 border-b border-border/40 bg-muted/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            <DialogTitle className="text-3xl font-serif text-primary-ink relative z-10">New Class</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground font-mono mt-2 relative z-10">
              Create a private session for your students.
            </DialogDescription>
          </div>
          <div className="p-8 space-y-6 bg-card relative z-10">
            <div className="space-y-2">
              <Label htmlFor="class-name" className="text-xs font-mono uppercase tracking-widest text-muted-foreground ml-1">Class Name</Label>
              <Input
                id="class-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. SE1702 — Morning"
                className="rounded-xl font-mono text-sm border-border/60 bg-card hover:bg-muted/10 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:border-primary h-12 px-4 transition-all duration-300 shadow-sm hover:shadow"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-class-password" className="text-xs font-mono uppercase tracking-widest text-muted-foreground ml-1">Enrollment Password</Label>
              <div className="relative group">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <Input
                  id="new-class-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  placeholder="Shared with students"
                  className="rounded-xl font-mono text-sm border-border/60 bg-card hover:bg-muted/10 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:border-primary h-12 pl-11 pr-4 transition-all duration-300 shadow-sm hover:shadow"
                />
              </div>
              <p className="text-[10px] text-muted-foreground/70 font-mono ml-1 mt-1.5">You cannot reuse a password across your own classes.</p>
            </div>
          </div>
          <div className="px-8 py-6 border-t border-border/40 flex justify-end gap-3 bg-muted/5 relative z-10">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              className="rounded-full font-mono text-xs px-6 hover:bg-muted/50"
            >
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={!name.trim() || !password.trim() || create.isPending}
              className="rounded-full font-mono text-xs tracking-wider px-8 shadow-sm"
            >
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Class'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
