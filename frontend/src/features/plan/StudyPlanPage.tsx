import { CalendarCheck, Layers, Target, ClipboardList, Clock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/lib/utils'
import { useCurrentStudyPlan } from '@/features/flashcards/study-queries'
import type { StudyTaskType } from '@/types'

const taskIcon: Record<StudyTaskType, typeof Layers> = {
  review_flashcards: Layers,
  study_topic: Target,
  take_exam: ClipboardList,
}

function isToday(dateStr: string): boolean {
  return new Date().toISOString().slice(0, 10) === dateStr
}

export default function StudyPlanPage() {
  const { data: plan, isLoading } = useCurrentStudyPlan()

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <div className="flex items-center gap-2 mb-1">
        <CalendarCheck className="h-4 w-4 text-zinc-400" />
        <h1 className="text-lg font-semibold text-zinc-50">This Week's Study Plan</h1>
      </div>
      {plan && (
        <p className="text-xs text-zinc-500 mb-6">
          Week of {new Date(plan.weekStartDate).toLocaleDateString()}
        </p>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg bg-zinc-900" />)}
        </div>
      ) : !plan ? (
        <EmptyState icon={CalendarCheck} title="No plan yet" description="Your weekly study plan will appear here." />
      ) : (
        <div className="space-y-2">
          {plan.planData.days.map(day => (
            <div
              key={day.date}
              className={cn(
                'bg-zinc-900 border rounded-lg p-4',
                isToday(day.date) ? 'border-zinc-600' : 'border-zinc-800',
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-50">{day.dayName}</span>
                  {isToday(day.date) && (
                    <span className="text-[10px] uppercase tracking-wide text-emerald-400 bg-emerald-950 border border-emerald-900 rounded px-1.5 py-0.5">Today</span>
                  )}
                </div>
                {day.totalEstimatedMinutes > 0 && (
                  <span className="flex items-center gap-1 text-xs text-zinc-500">
                    <Clock className="h-3 w-3" />{day.totalEstimatedMinutes} min
                  </span>
                )}
              </div>
              {day.tasks.length === 0 ? (
                <p className="text-xs text-zinc-600">Rest day — no tasks.</p>
              ) : (
                <div className="space-y-1.5">
                  {day.tasks.map((task, i) => {
                    const Icon = taskIcon[task.type]
                    return (
                      <div key={i} className="flex items-start gap-2.5 rounded-md bg-zinc-800/50 px-3 py-2">
                        <Icon className="h-3.5 w-3.5 text-zinc-400 mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-zinc-200">{task.title}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{task.description}</p>
                        </div>
                        <span className="text-xs text-zinc-600 shrink-0 tabular-nums">{task.estimatedMinutes}m</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
