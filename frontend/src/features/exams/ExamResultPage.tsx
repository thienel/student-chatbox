import { useParams, Link } from 'react-router-dom'
import { CheckCircle2, XCircle, ChevronLeft } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useAttemptResult } from './queries'

export default function ExamResultPage() {
  const { attemptId = '' } = useParams<{ attemptId: string }>()
  const { data, isLoading } = useAttemptResult(attemptId)

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">
        <Skeleton className="h-28 rounded-lg bg-zinc-900" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-lg bg-zinc-900" />
        ))}
      </div>
    )
  }

  if (!data) return null

  const { attempt, exam, questions } = data
  const score = attempt.score ?? 0
  const scorePercent = Math.round(score * 10)

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <Link
        to="/exam-history"
        className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-50 transition-colors duration-150 mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Exam History
      </Link>

      {/* Score card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6 text-center">
        <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">{exam.title}</p>
        <p className="text-5xl font-semibold text-zinc-50 tabular-nums">{score.toFixed(1)}</p>
        <p className="text-sm text-zinc-500 mt-1">out of 10 · {scorePercent}%</p>
        <div className="mt-4 h-2 bg-zinc-800 rounded-full overflow-hidden max-w-xs mx-auto">
          <div
            className="h-full bg-zinc-50 rounded-full transition-all duration-700"
            style={{ width: `${scorePercent}%` }}
          />
        </div>
        <p className="text-xs text-zinc-600 mt-3">
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
                'bg-zinc-900 border rounded-lg p-5',
                isCorrect ? 'border-zinc-800' : 'border-red-900/60'
              )}
            >
              <div className="flex items-start gap-3 mb-4">
                {isCorrect
                  ? <CheckCircle2 className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                  : <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                }
                <p className="text-sm text-zinc-50 leading-relaxed">
                  <span className="text-zinc-600 mr-1.5">Q{i + 1}.</span>
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
                          ? 'border-zinc-600 bg-zinc-800 text-zinc-200'
                          : isUser && !isCorrect
                          ? 'border-red-900 bg-red-950/40 text-red-400'
                          : 'border-zinc-900 text-zinc-600'
                      )}
                    >
                      <span className="font-medium mr-1.5 text-zinc-500">{opt.key}.</span>
                      {opt.text}
                      {isCorrectOpt && <span className="ml-2 text-xs text-zinc-500">✓ Correct</span>}
                    </div>
                  )
                })}
              </div>
              {q.explanation && (
                <p className="mt-3 pl-7 text-xs text-zinc-500 leading-relaxed">
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
