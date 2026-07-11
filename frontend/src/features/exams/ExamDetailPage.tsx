import { useParams, useNavigate } from 'react-router-dom'
import { ClipboardList, Clock, BarChart2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/errors'
import { useExam, useStartAttempt } from '@/api/queries/exams'

export default function ExamDetailPage() {
  const { id: subjectId = '', examId = '' } = useParams<{ id: string; examId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const { data: exam, isLoading } = useExam(subjectId, examId)
  const start = useStartAttempt(subjectId)

  const handleStart = async () => {
    try {
      const result = await start.mutateAsync(examId)
      navigate(`/subjects/${subjectId}/exams/${examId}/attempt/${result.attempt.id}`, {
        state: { attempt: result.attempt, exam: result.exam, questions: result.questions },
      })
    } catch (err) {
      toast({ variant: 'destructive', description: getErrorMessage(err, 'Failed to start exam.') })
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">
        <Skeleton className="h-24 rounded-lg bg-muted" />
        <Skeleton className="h-40 rounded-lg bg-muted" />
      </div>
    )
  }

  if (!exam) return null

  return (
    <div className="max-w-2xl mx-auto px-6 py-6">
      <div className="bg-card border rounded-lg p-6 mb-4">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-md bg-secondary flex items-center justify-center shrink-0">
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-foreground">{exam.title}</h2>
            {exam.description && (
              <p className="text-sm text-muted-foreground mt-1">{exam.description}</p>
            )}
            <div className="flex items-center flex-wrap gap-3 mt-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <BarChart2 className="h-3.5 w-3.5" />
                {exam.questionCount} questions
              </div>
              {exam.durationMinutes && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {exam.durationMinutes} min
                </div>
              )}
              <Badge className="text-xs font-medium bg-secondary text-muted-foreground border-border rounded-md capitalize">
                {exam.difficulty}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-5 mb-4">
        <p className="text-sm font-medium text-foreground mb-2">Instructions</p>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li>· Answer all {exam.questionCount} multiple-choice questions.</li>
          <li>· Each question has one correct answer.</li>
          <li>· Your score will be shown upon submission.</li>
          {exam.durationMinutes && (
            <li>· You have {exam.durationMinutes} minutes to complete this exam.</li>
          )}
        </ul>
      </div>

      <Button
        onClick={handleStart}
        disabled={start.isPending}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-sm font-medium rounded-md"
      >
        {start.isPending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            Starting…
          </>
        ) : (
          'Start Exam'
        )}
      </Button>
    </div>
  )
}
