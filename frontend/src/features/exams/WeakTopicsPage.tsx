import { useParams, Link } from 'react-router-dom'
import { Target, Star, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/lib/utils'
import { useMyWeakTopics } from './queries'
import type { TopicClassification } from '@/types'

const classMeta: Record<TopicClassification, { label: string; cls: string; bar: string }> = {
  weak: { label: 'Weak', cls: 'bg-red-950 text-red-400 border-red-900', bar: 'bg-red-500' },
  developing: { label: 'Developing', cls: 'bg-amber-950 text-amber-400 border-amber-900', bar: 'bg-amber-500' },
  strong: { label: 'Strong', cls: 'bg-emerald-950 text-emerald-400 border-emerald-900', bar: 'bg-emerald-500' },
}

export default function WeakTopicsPage() {
  const { id: subjectId = '' } = useParams<{ id: string }>()
  const { data, isLoading } = useMyWeakTopics(subjectId)
  const topics = data?.topics ?? []

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <div className="flex items-center gap-2 mb-1">
        <Target className="h-4 w-4 text-zinc-400" />
        <h2 className="text-base font-medium text-zinc-50">Weak Topics</h2>
      </div>
      <p className="text-xs text-zinc-500 mb-6">Based on all your completed exams in this subject.</p>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg bg-zinc-900" />)}
        </div>
      ) : topics.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="Not enough data yet"
          description="Take a few exams to see which topics need more practice."
        />
      ) : (
        <div className="space-y-2">
          {topics.map(t => {
            const meta = classMeta[t.classification]
            const pct = Math.round(t.correctRate * 100)
            return (
              <div key={t.topic} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-zinc-50 truncate">{t.topic}</p>
                  <Badge className={cn('shrink-0 text-xs rounded-md', meta.cls)}>{meta.label}</Badge>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full', meta.bar)} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-zinc-500 tabular-nums shrink-0">
                    {pct}% · {t.correctCount}/{t.totalQuestions}
                  </span>
                </div>
                {t.suggestedFlashcardSets.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-zinc-800/70">
                    <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide mb-2">Suggested practice</p>
                    <div className="flex flex-wrap gap-2">
                      {t.suggestedFlashcardSets.map(s => (
                        <Link
                          key={s.id}
                          to={`/subjects/${subjectId}/flashcards/${s.id}`}
                          className="inline-flex items-center gap-1.5 text-xs text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md px-2 py-1"
                        >
                          {s.title}
                          <span className="flex items-center gap-0.5 text-amber-400">
                            <Star className="h-3 w-3 fill-amber-400" />{s.starCount}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
