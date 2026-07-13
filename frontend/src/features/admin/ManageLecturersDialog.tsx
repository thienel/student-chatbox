import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Loader2, GraduationCap, ShieldCheck } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSubject, useAssignLecturer, useRemoveLecturer } from '@/api/queries/subjects'
import { useUsers } from '@/api/queries/users'
import { Skeleton } from '@/components/ui/skeleton'

export function ManageLecturersDialog({
  subjectId,
  open,
  onOpenChange,
}: {
  subjectId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data: subject, isLoading: subjectLoading } = useSubject(subjectId || '')
  const { data: usersData, isLoading: usersLoading } = useUsers({ role: 'lecturer', limit: 100 })
  
  const assign = useAssignLecturer()
  const remove = useRemoveLecturer()
  
  const [search, setSearch] = useState('')

  if (!subjectId) return null

  const assignedLecturers = subject?.lecturers || []
  const assignedIds = new Set(assignedLecturers.map(l => l.id))
  
  const allLecturers = usersData?.items || []
  const availableLecturers = allLecturers.filter(l => !assignedIds.has(l.id) && l.fullName.toLowerCase().includes(search.toLowerCase()))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border border-border/60 rounded-[2rem] shadow-2xl p-0 max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-8 py-8 border-b border-border/40 bg-muted/10 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          <DialogTitle className="text-3xl font-serif text-primary-ink relative z-10 flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            Manage Lecturers
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground font-mono mt-2 relative z-10">
            {subjectLoading ? <Skeleton className="h-4 w-48" /> : `Assign or remove lecturers for ${subject?.code} - ${subject?.name}`}
          </DialogDescription>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-card relative z-10">
          {/* Currently Assigned */}
          <section>
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4 pl-1">Assigned Lecturers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {subjectLoading ? (
                <Skeleton className="h-16 w-full rounded-2xl" />
              ) : assignedLecturers.length === 0 ? (
                <div className="col-span-full py-6 text-center border border-dashed border-border/60 rounded-2xl bg-muted/5">
                  <p className="text-sm font-mono text-muted-foreground">No lecturers assigned yet.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {assignedLecturers.map((l) => (
                    <motion.div
                      key={l.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      layout
                      className="flex items-center justify-between p-3 rounded-2xl border border-primary/20 bg-primary/5 group"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="text-sm font-serif font-semibold text-foreground truncate">{l.fullName}</p>
                        <p className="text-[10px] font-mono text-muted-foreground truncate">{l.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove.mutate({ subjectId, lecturerId: l.id })}
                        disabled={remove.isPending}
                        className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        {remove.isPending && remove.variables?.lecturerId === l.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </section>

          {/* Available Lecturers */}
          <section>
            <div className="flex items-center justify-between mb-4 pl-1">
              <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Available Lecturers</h3>
              <Input
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-48 h-8 text-xs font-mono rounded-full bg-muted/20 border-border/50"
              />
            </div>
            
            <div className="space-y-2">
              {usersLoading ? (
                <Skeleton className="h-14 w-full rounded-2xl" />
              ) : availableLecturers.length === 0 ? (
                <div className="py-6 text-center border border-dashed border-border/60 rounded-2xl bg-muted/5">
                  <p className="text-sm font-mono text-muted-foreground">No matching lecturers found.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {availableLecturers.map((l) => (
                    <motion.div
                      key={l.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      layout
                      className="flex items-center justify-between p-3 rounded-2xl border border-border/50 bg-muted/10 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-serif text-sm border border-border/50">
                          {l.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-serif font-medium text-foreground truncate flex items-center gap-2">
                            {l.fullName}
                            {l.status === 'active' && <ShieldCheck className="h-3 w-3 text-emerald-500" />}
                          </p>
                          <p className="text-[10px] font-mono text-muted-foreground truncate">{l.email}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => assign.mutate({ subjectId, lecturerId: l.id })}
                        disabled={assign.isPending}
                        className="h-8 rounded-full px-4 text-xs font-mono bg-card border border-border/60 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-sm"
                      >
                        {assign.isPending && assign.variables?.lecturerId === l.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Plus className="h-3 w-3 mr-1" /> Assign</>}
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </section>
        </div>
        
        <div className="px-8 py-5 border-t border-border/40 flex justify-end bg-muted/5 shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full font-mono text-xs px-6">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
