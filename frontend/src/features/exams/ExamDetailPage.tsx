import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ClipboardList, Clock, BarChart2, Loader2, Pencil, Lock, ChevronRight, ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/errors'
import { useExam, useStartAttempt } from '@/api/queries/exams'
import { useSubjectClass } from '@/features/classes/ClassContext'

export default function ExamDetailPage() {
  const { id: subjectId = '', examId = '' } = useParams<{ id: string; examId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { isLecturer, basePath } = useSubjectClass()

  const { data: exam, isLoading } = useExam(subjectId, examId)
  const start = useStartAttempt(subjectId)

  const handleStart = async () => {
    try {
      const result = await start.mutateAsync(examId)
      navigate(`${basePath}/exams/${examId}/attempt/${result.attempt.id}`, {
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

  const isLocked = (exam.attemptCount ?? 0) > 0
  const showEditButton = isLecturer && exam.type === 'official'

  return (
    <div className="max-w-2xl mx-auto px-6 py-6">
      {/* Back link */}
      <Link
        to={`${basePath}/exams`}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to exams
      </Link>

      {/* Header card */}
      <div className="bg-card border rounded-lg p-6 mb-4">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-md bg-secondary flex items-center justify-center shrink-0">
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-semibold text-foreground">{exam.title}</h2>
              {showEditButton && (
                isLocked ? (
                  <div
                    className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-not-allowed select-none"
                    title={`Locked — ${exam.attemptCount} attempt(s) already submitted`}
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Locked
                  </div>
                ) : (
                  <Button
                    asChild
                    variant="outline"
                    className="border bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground h-7 px-2.5 text-xs rounded-md shrink-0"
                  >
                    <Link to={`${basePath}/exams/${examId}/edit`}>
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit exam
                    </Link>
                  </Button>
                )
              )}
            </div>
            {exam.description && (
              <p className="text-sm text-muted-foreground mt-1">{exam.description}</p>
            )}
            <div className="flex items-center flex-wrap gap-3 mt-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <BarChart2 className="h-3.5 w-3.5" />
                {exam.questionCount} questions
              </div>
              {exam.durationMinutes ? (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {exam.durationMinutes} min
                </div>
              ) : null}
              {exam.difficulty && (
                <Badge className="text-xs font-medium bg-secondary text-muted-foreground border-border rounded-md capitalize">
                  {exam.difficulty}
                </Badge>
              )}
              {exam.type === 'official' && (
                <Badge className="text-xs font-medium bg-emerald-50 text-emerald-700 border-emerald-200 rounded-md">
                  Official
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions (shown to students) or question list (shown to lecturer) */}
      {isLecturer && exam.questions && exam.questions.length > 0 ? (
        <div className="bg-card border rounded-lg overflow-hidden mb-4">
          <div className="px-5 py-3 border-b bg-secondary">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Questions & Answers
            </p>
          </div>
          <div className="divide-y">
            {exam.questions.map((q, idx) => (
              <div key={q.id} className="px-5 py-4 space-y-2">
                <p className="text-sm font-medium text-foreground">
                  <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                  {q.content}
                </p>
                <div className="space-y-1">
                  {q.options.map(o => (
                    <div
                      key={o.key}
                      className={`flex items-center gap-2.5 text-sm rounded-md px-2 py-1 ${
                        o.key === q.correctAnswer
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'text-muted-foreground'
                      }`}
                    >
                      <span
                        className={`h-5 w-5 rounded text-xs font-semibold flex items-center justify-center shrink-0 border ${
                          o.key === q.correctAnswer
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : 'border-border bg-secondary text-muted-foreground'
                        }`}
                      >
                        {o.key}
                      </span>
                      {o.text}
                      {o.key === q.correctAnswer && (
                        <ChevronRight className="h-3.5 w-3.5 text-emerald-600 ml-auto" />
                      )}
                    </div>
                  ))}
                </div>
                {q.explanation && (
                  <p className="text-xs text-muted-foreground mt-1 pl-1">
                    💡 {q.explanation}
                  </p>
                )}
                {q.topic && (
                  <p className="text-xs text-muted-foreground pl-1">
                    Topic: {q.topic}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-card border rounded-lg p-5 mb-4">
          <p className="text-sm font-medium text-foreground mb-2">Instructions</p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>· Answer all {exam.questionCount} multiple-choice questions.</li>
            <li>· Each question has one correct answer.</li>
            <li>· Your score will be shown upon submission.</li>
            {exam.durationMinutes ? (
              <li>· You have {exam.durationMinutes} minutes to complete this exam.</li>
            ) : null}
          </ul>
        </div>
      )}

      {/* Start button (students only) */}
      {!isLecturer && (
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
      )}
    </div>
  )
}
