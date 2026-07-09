import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { CheckCircle2, XCircle, ChevronLeft } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useAttemptResult } from '@/api/queries/exams'

export default function ExamResultPage() {
  const { id: subjectId, attemptId = '' } = useParams<{ id?: string; attemptId: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useAttemptResult(attemptId)

  // When accessed via global route (/exam-attempts/:id), redirect to subject-scoped URL
  useEffect(() => {
    if (!subjectId && data) {
      navigate(
        `/subjects/${data.exam.subjectId}/exams/${data.exam.id}/result/${attemptId}`,
        { replace: true }
      )
    }
  }, [subjectId, data, navigate, attemptId])

  if (isLoading || (!subjectId && !data)) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">
        <Skeleton className="h-28 rounded-lg bg-muted" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  if (!data) return null

  const { attempt, exam, questions } = data
  const score = Number(attempt.score ?? 0)
  const scorePercent = Math.round(score * 10)

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <Link
        to={subjectId ? `/subjects/${subjectId}/exam-history` : '/exam-history'}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Exam History
      </Link>

      {/* Score card */}
      <div className="bg-card border rounded-lg p-6 mb-6 text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">{exam.title}</p>
        <p className="text-5xl font-semibold text-foreground tabular-nums">{score.toFixed(1)}</p>
        <p className="text-sm text-muted-foreground mt-1">out of 10 · {scorePercent}%</p>
        <div className="mt-4 h-2 bg-secondary rounded-full overflow-hidden max-w-xs mx-auto">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700"
            style={{ width: `${scorePercent}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          {attempt.timeSpentSecs ? `Completed in ${Math.round(attempt.timeSpentSecs / 60)} min` : ''}
        </p>
      </div>

      {/* Questions review */}
      <div className="space-y-3">
        {questions.map((q, i) => {
          const userAnswer = attempt.answers?.[q.id]
          const isCorrect = userAnswer === q.correctAnswer
          return (
            <div
              key={q.id}
              className={cn(
                'bg-card border rounded-lg p-5',
                isCorrect ? 'border-border' : 'border-destructive/30'
              )}
            >
              <div className="flex items-start gap-3 mb-4">
                {isCorrect
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  : <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                }
                <p className="text-sm text-foreground leading-relaxed">
                  <span className="text-muted-foreground mr-1.5">Q{i + 1}.</span>
                  {q.content}
                </p>
              </div>
              <div className="space-y-1.5 pl-7">
                {q.options.map(opt => {
                  const isUser = opt.key === userAnswer
                  const isCorrectOpt = opt.key === q.correctAnswer
                  return (
                    <div
                      key={opt.key}
                      className={cn(
                        'px-3 py-2 rounded-md text-sm border',
                        isCorrectOpt
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : isUser && !isCorrect
                          ? 'border-destructive/30 bg-destructive/5 text-destructive'
                          : 'border-transparent text-muted-foreground'
                      )}
                    >
                      <span className="font-medium mr-1.5 opacity-70">{opt.key}.</span>
                      {opt.text}
                      {isCorrectOpt && <span className="ml-2 text-xs opacity-70">✓ Correct</span>}
                    </div>
                  )
                })}
              </div>
              {q.explanation && (
                <p className="mt-3 pl-7 text-xs text-muted-foreground leading-relaxed">
                  {q.explanation}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
