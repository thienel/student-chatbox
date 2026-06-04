import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/api/endpoints/analytics'
import { Skeleton } from '@/components/ui/skeleton'

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-semibold text-zinc-50 tabular-nums">{value}</p>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const { data: overview, isLoading: ovLoading } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: analyticsApi.overview,
  })

  const { data: aiUsage, isLoading: aiLoading } = useQuery({
    queryKey: ['analytics', 'ai-usage'],
    queryFn: analyticsApi.aiUsage,
  })

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="mb-6">
        <h2 className="text-base font-medium text-zinc-50">Analytics</h2>
        <p className="text-xs text-zinc-500 mt-0.5">Platform-wide usage overview</p>
      </div>

      {/* Overview stats */}
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">Overview</p>
      {ovLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg bg-zinc-900" />
          ))}
        </div>
      ) : overview ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard label="Total Users" value={overview.totalUsers} />
          <StatCard label="Total Subjects" value={overview.totalSubjects} />
          <StatCard label="Total Documents" value={overview.totalDocuments} />
          <StatCard label="Total Chats" value={overview.totalChats} />
        </div>
      ) : null}

      {/* AI Usage */}
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">AI Usage</p>
      {aiLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg bg-zinc-900" />
          ))}
        </div>
      ) : aiUsage ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="grid grid-cols-4 px-4 py-2.5 border-b border-zinc-800 bg-zinc-950">
            <p className="text-xs font-medium text-zinc-500">Feature</p>
            <p className="text-xs font-medium text-zinc-500 text-right">All-time</p>
            <p className="text-xs font-medium text-zinc-500 text-right">Today</p>
            <p className="text-xs font-medium text-zinc-500 text-right">Avg/day</p>
          </div>
          {aiUsage.features.map((f, i) => (
            <div
              key={f.feature}
              className={[
                'grid grid-cols-4 px-4 py-3',
                i < aiUsage.features.length - 1 ? 'border-b border-zinc-800' : '',
              ].join(' ')}
            >
              <p className="text-sm text-zinc-300 font-medium">{f.feature}</p>
              <p className="text-sm text-zinc-50 text-right tabular-nums">{f.total}</p>
              <p className="text-sm text-zinc-50 text-right tabular-nums">{f.today}</p>
              <p className="text-sm text-zinc-400 text-right tabular-nums">
                {f.avgPerDay != null ? f.avgPerDay.toFixed(1) : '—'}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
