import { useParams } from 'react-router-dom'
import { Users, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/errors'
import { useSubjectClass } from './ClassContext'
import { NeedClassNotice } from './NeedClassNotice'
import { useClassStudents, useRemoveClassStudent } from './queries'

export default function StudentsPage() {
  const { id: subjectId = '' } = useParams<{ id: string }>()
  const { toast } = useToast()
  const { classId, needsClass, classes, activeClassId, loading: classLoading } = useSubjectClass()
  const activeClass = classes.find(c => c.id === activeClassId)

  const { data: students = [], isLoading } = useClassStudents(subjectId, classId)
  const remove = useRemoveClassStudent(subjectId, classId)

  if (needsClass) return <div className="max-w-3xl mx-auto px-6 py-6"><NeedClassNotice noun="Students" /></div>

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <div className="mb-6">
        <h2 className="text-base font-medium text-zinc-50">Students</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          {activeClass ? `Enrolled in ${activeClass.name}` : 'Enrolled in this class'} · {students.length}
        </p>
      </div>

      {classLoading || (!!classId && isLoading) ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg bg-zinc-900" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students yet"
          description="Share this class's password so students can join."
        />
      ) : (
        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide">Name</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide">Email</th>
                <th className="py-3 px-4 w-10" />
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors duration-150">
                  <td className="py-3 px-4 text-zinc-300">{s.fullName}</td>
                  <td className="py-3 px-4 text-zinc-500 text-xs">{s.email}</td>
                  <td className="py-3 px-4">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-md text-zinc-600 hover:text-red-400 hover:bg-zinc-800"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-zinc-900 border border-zinc-800">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-zinc-50">Remove student?</AlertDialogTitle>
                          <AlertDialogDescription className="text-zinc-400">
                            {s.fullName} will be removed from this class and lose access to its content.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              remove.mutate(s.id, {
                                onError: err =>
                                  toast({ variant: 'destructive', description: getErrorMessage(err, 'Failed to remove student.') }),
                              })
                            }
                            className="bg-red-950 text-red-400 border border-red-900 hover:bg-red-900"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
