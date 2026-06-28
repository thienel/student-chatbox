import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Activity, Flame, Layers, Star, MessagesSquare, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/lib/utils'
import { useSubjectClass } from './ClassContext'
import { NeedClassNotice } from './NeedClassNotice'
import { useClassEngagement, useStudentEngagement } from './queries'

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString() : '—'
}

const topicCls: Record<string, string> = {
  weak: 'bg-red-950 text-red-400 border-red-900',
  developing: 'bg-amber-950 text-amber-400 border-amber-900',
  strong: 'bg-emerald-950 text-emerald-400 border-emerald-900',
}

export default function EngagementPage() {
  const { id: subjectId = '' } = useParams<{ id: string }>()
  const { classId, needsClass } = useSubjectClass()
  const engagement = useClassEngagement(subjectId, classId)
  const [studentId, setStudentId] = useState<string | null>(null)
  const detail = useStudentEngagement(subjectId, classId, studentId)

  if (needsClass) {
    return <div className="max-w-5xl mx-auto px-6 py-6"><NeedClassNotice noun="Engagement" /></div>
  }

  const items = engagement.data?.items ?? []

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="flex items-center gap-2 mb-1">
        <Activity className="h-4 w-4 text-zinc-400" />
        <h2 className="text-base font-medium text-zinc-50">Student Engagement</h2>
      </div>
      <p className="text-xs text-zinc-500 mb-5">All-time activity for each student in this class.</p>

      {engagement.isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg bg-zinc-900" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={Activity} title="No students" description="No students are enrolled in this class yet." />
      ) : (
        <div className="border border-zinc-800 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wide">
                <th className="text-left py-3 px-4 font-medium">Student</th>
                <th className="text-left py-3 px-4 font-medium">Last active</th>
                <th className="text-right py-3 px-4 font-medium" title="Current streak"><Flame className="h-3.5 w-3.5 inline" /></th>
                <th className="text-right py-3 px-4 font-medium" title="Cards reviewed"><Layers className="h-3.5 w-3.5 inline" /></th>
                <th className="text-right py-3 px-4 font-medium" title="Stars received"><Star className="h-3.5 w-3.5 inline" /></th>
                <th className="text-right py-3 px-4 font-medium" title="Board posts"><MessagesSquare className="h-3.5 w-3.5 inline" /></th>
                <th className="text-right py-3 px-4 font-medium">Avg score</th>
              </tr>
            </thead>
            <tbody>
              {items.map(s => (
                <tr
                  key={s.userId}
                  onClick={() => setStudentId(s.userId)}
                  className="border-b border-zinc-800/50 hover:bg-zinc-900/50 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4">
                    <p className="text-zinc-200">{s.fullName}</p>
                    <p className="text-xs text-zinc-600">{s.email}</p>
                  </td>
                  <td className="py-3 px-4 text-zinc-400 text-xs">{fmtDate(s.stats.lastActiveAt)}</td>
                  <td className="py-3 px-4 text-right text-zinc-300 tabular-nums">{s.stats.currentStreak}</td>
                  <td className="py-3 px-4 text-right text-zinc-300 tabular-nums">{s.stats.totalCardsReviewed}</td>
                  <td className="py-3 px-4 text-right text-zinc-300 tabular-nums">{s.stats.totalStarsReceived}</td>
                  <td className="py-3 px-4 text-right text-zinc-300 tabular-nums">{s.stats.questionsPosted + s.stats.answersPosted}</td>
                  <td className="py-3 px-4 text-right text-zinc-300 tabular-nums">
                    {s.stats.avgExamScore == null ? '—' : `${Number(s.stats.avgExamScore).toFixed(1)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!studentId} onOpenChange={open => { if (!open) setStudentId(null) }}>
        <DialogContent className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-none p-0 max-w-lg">
          <div className="px-5 py-4 border-b border-zinc-800">
            <DialogTitle className="text-base font-semibold text-zinc-50">{detail.data?.fullName ?? 'Student'}</DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 mt-0.5">{detail.data?.email}</DialogDescription>
          </div>
          <div className="p-5 max-h-[60vh] overflow-y-auto space-y-5">
            {detail.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-zinc-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
            ) : detail.data ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Streak', value: detail.data.stats.currentStreak },
                    { label: 'Sessions', value: detail.data.stats.totalStudySessions },
                    { label: 'Cards', value: detail.data.stats.totalCardsReviewed },
                    { label: 'Stars', value: detail.data.stats.totalStarsReceived },
                    { label: 'Questions', value: detail.data.stats.questionsPosted },
                    { label: 'Answers', value: detail.data.stats.answersPosted },
                  ].map(m => (
                    <div key={m.label} className="bg-zinc-800/50 rounded-md px-3 py-2">
                      <p className="text-[11px] text-zinc-500">{m.label}</p>
                      <p className="text-sm font-semibold text-zinc-100 tabular-nums">{m.value}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Exam attempts</p>
                  {detail.data.examAttempts.length === 0 ? (
                    <p className="text-sm text-zinc-600">No completed exams.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {detail.data.examAttempts.map((a, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-zinc-300 truncate">{a.examTitle}</span>
                          <span className="text-zinc-400 tabular-nums shrink-0 ml-2">
                            {a.score == null ? '—' : `${Number(a.score).toFixed(1)}/10`} · {fmtDate(a.attemptedAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {detail.data.weakTopics.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Topics</p>
                    <div className="flex flex-wrap gap-1.5">
                      {detail.data.weakTopics.map(t => (
                        <Badge key={t.topic} className={cn('text-[11px] rounded', topicCls[t.classification])}>
                          {t.topic} · {Math.round(t.correctRate * 100)}%
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
