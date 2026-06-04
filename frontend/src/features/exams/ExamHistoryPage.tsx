import { Link } from 'react-router-dom'
import { ClipboardList, ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { useMyAttempts } from './queries'

export default function ExamHistoryPage() {
  const { data: attempts = [], isLoading } = useMyAttempts()

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <div className="mb-6">
        <h2 className="text-base font-medium text-zinc-50">Exam History</h2>
        <p className="text-xs text-zinc-500 mt-0.5">{attempts.length} attempts</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg bg-zinc-900" />
          ))}
        </div>
      ) : attempts.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No exam attempts"
          description="Take an exam to see your history here."
        />
      ) : (
        <div className="space-y-2">
          {attempts.map(attempt => (
            <Link
              key={attempt.id}
              to={`/exam-attempts/${attempt.id}`}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center gap-3 group hover:border-zinc-700 transition-colors duration-150"
            >
              <div className="h-8 w-8 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
                <ClipboardList className="h-4 w-4 text-zinc-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-50 truncate">
                  {(attempt as any).exam?.title ?? 'Exam'}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {new Date(attempt.submittedAt ?? attempt.startedAt).toLocaleDateString()}
                  {attempt.timeSpentSecs ? ` · ${Math.round(attempt.timeSpentSecs / 60)} min` : ''}
                </p>
              </div>
              {attempt.score != null && (
                <Badge className="shrink-0 text-xs font-medium bg-zinc-800 text-zinc-300 border-zinc-700 rounded-md tabular-nums">
                  {attempt.score.toFixed(1)} / 10
                </Badge>
              )}
              <ChevronRight className="h-4 w-4 text-zinc-600 shrink-0 group-hover:text-zinc-400 transition-colors duration-150" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
