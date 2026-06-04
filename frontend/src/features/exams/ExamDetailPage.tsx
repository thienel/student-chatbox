import { useParams, useNavigate } from 'react-router-dom'
import { ClipboardList, Clock, BarChart2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useExam, useStartAttempt } from './queries'

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
    } catch {
      toast({ variant: 'destructive', description: 'Failed to start exam.' })
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">
        <Skeleton className="h-24 rounded-lg bg-zinc-900" />
        <Skeleton className="h-40 rounded-lg bg-zinc-900" />
      </div>
    )
  }

  if (!exam) return null

  return (
    <div className="max-w-2xl mx-auto px-6 py-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-4">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
            <ClipboardList className="h-5 w-5 text-zinc-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-zinc-50">{exam.title}</h2>
            {exam.description && (
              <p className="text-sm text-zinc-400 mt-1">{exam.description}</p>
            )}
            <div className="flex items-center flex-wrap gap-3 mt-3">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <BarChart2 className="h-3.5 w-3.5" />
                {exam.questionCount} questions
              </div>
              {exam.timeLimitMins && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <Clock className="h-3.5 w-3.5" />
                  {exam.timeLimitMins} min
                </div>
              )}
              <Badge className="text-xs font-medium bg-zinc-800 text-zinc-400 border-zinc-700 rounded-md capitalize">
                {exam.difficulty}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 mb-4">
        <p className="text-sm font-medium text-zinc-300 mb-2">Instructions</p>
        <ul className="space-y-1.5 text-sm text-zinc-500">
          <li>· Answer all {exam.questionCount} multiple-choice questions.</li>
          <li>· Each question has one correct answer.</li>
          <li>· Your score will be shown upon submission.</li>
          {exam.timeLimitMins && (
            <li>· You have {exam.timeLimitMins} minutes to complete this exam.</li>
          )}
        </ul>
      </div>

      <Button
        onClick={handleStart}
        disabled={start.isPending}
        className="w-full bg-zinc-50 text-zinc-950 hover:bg-zinc-200 h-9 text-sm font-medium rounded-md"
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
