import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Users, UserPlus, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { useSubject, useAssignLecturer, useRemoveLecturer, useLecturers } from './queries'
import { usePermission } from '@/store/useUserStore'

export default function SubjectMembersPage() {
  const { id = '' } = useParams<{ id: string }>()
  const isAdmin = usePermission('subject:assign-lecturer')

  const { data: subject, isLoading } = useSubject(id)
  const { data: allLecturers } = useLecturers()
  const assignLecturer = useAssignLecturer()
  const removeLecturer = useRemoveLecturer()

  const [assignOpen, setAssignOpen] = useState(false)

  const lecturers = subject?.lecturers ?? []
  const assignedIds = new Set(lecturers.map(l => l.id))
  const available = (allLecturers?.items ?? []).filter(l => !assignedIds.has(l.id))

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-medium text-foreground">Members</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Lecturers assigned to this subject</p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setAssignOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-sm font-medium rounded-md"
          >
            <UserPlus className="h-4 w-4 mr-1.5" />
            Assign lecturer
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg bg-muted" />
          ))}
        </div>
      ) : lecturers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No lecturers assigned"
          description={isAdmin ? 'Use the button above to assign a lecturer.' : 'Contact an admin to assign lecturers to this subject.'}
          action={isAdmin ? (
            <Button
              onClick={() => setAssignOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-sm font-medium rounded-md"
            >
              <UserPlus className="h-4 w-4 mr-1.5" />
              Assign lecturer
            </Button>
          ) : undefined}
        />
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">Name</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">Role</th>
                {isAdmin && <th className="py-3 px-4 w-10" />}
              </tr>
            </thead>
            <tbody>
              {lecturers.map(lecturer => (
                <tr key={lecturer.id} className="border-b hover:bg-muted/50 transition-colors duration-150">
                  <td className="py-3 px-4 text-foreground">{lecturer.fullName}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{lecturer.email}</td>
                  <td className="py-3 px-4">
                    <Badge className="text-[10px] rounded bg-secondary text-muted-foreground border-border">
                      Lecturer
                    </Badge>
                  </td>
                  {isAdmin && (
                    <td className="py-3 px-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={removeLecturer.isPending}
                        onClick={() => removeLecturer.mutate({ subjectId: id, lecturerId: lecturer.id })}
                        className="h-7 w-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign lecturer dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="bg-card border rounded-lg shadow-none p-0 max-w-md">
          <DialogHeader className="px-5 py-4 border-b">
            <DialogTitle className="text-base font-semibold text-foreground">Assign lecturer</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-0.5">
              Select a lecturer to assign to this subject.
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 max-h-80 overflow-y-auto">
            {available.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">All lecturers are already assigned.</p>
            ) : (
              available.map(l => (
                <button
                  key={l.id}
                  disabled={assignLecturer.isPending}
                  onClick={() => {
                    assignLecturer.mutate({ subjectId: id, lecturerId: l.id }, {
                      onSuccess: () => setAssignOpen(false),
                    })
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left hover:bg-secondary transition-colors duration-150 disabled:opacity-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{l.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{l.email}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
