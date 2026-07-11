import { Link, useParams } from 'react-router-dom'
import { ClipboardList, ChevronRight, ChevronLeft } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { useMyAttempts, useExams } from '@/api/queries/exams'

export default function ExamHistoryPage() {
  const { id: subjectId } = useParams<{ id?: string }>()
  const { data: attempts = [], isLoading } = useMyAttempts()
  const { data: subjectExams = [] } = useExams(subjectId ?? '')

  const examIds = subjectId ? new Set(subjectExams.map(e => e.id)) : null
  const examMap = new Map(subjectExams.map(e => [e.id, e]))

  const filtered = examIds
    ? attempts.filter(a => examIds.has(a.examId) && a.status === 'completed')
    : attempts.filter(a => a.status === 'completed')

  const resultUrl = (attempt: typeof attempts[number]) => {
    const sid = attempt.exam?.subjectId ?? subjectId
    if (sid) return `/subjects/${sid}/exams/${attempt.examId}/result/${attempt.id}`
    return `/exam-attempts/${attempt.id}`
  }

  const examTitle = (attempt: typeof attempts[number]) =>
    attempt.exam?.title ?? examMap.get(attempt.examId)?.title ?? 'Exam'

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      {subjectId && (
        <Link
          to={`/subjects/${subjectId}/exams`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Exams
        </Link>
      )}
      <div className="mb-6">
        <h2 className="text-base font-medium text-foreground">Exam History</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{filtered.length} attempts</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No exam attempts"
          description="Take an exam to see your history here."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(attempt => (
            <Link
              key={attempt.id}
              to={resultUrl(attempt)}
              className="bg-card border rounded-lg p-4 flex items-center gap-3 group hover:border-primary/50 transition-colors duration-150"
            >
              <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center shrink-0">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {examTitle(attempt)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(attempt.completedAt ?? attempt.startedAt).toLocaleDateString()}
                  {attempt.timeSpentSecs ? ` · ${Math.round(attempt.timeSpentSecs / 60)} min` : ''}
                </p>
              </div>
              {attempt.score != null && (
                <Badge className="shrink-0 text-xs font-medium bg-secondary text-foreground border-border rounded-md tabular-nums">
                  {Number(attempt.score).toFixed(1)} / 10
                </Badge>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors duration-150" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
