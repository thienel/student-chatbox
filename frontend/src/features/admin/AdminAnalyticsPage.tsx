import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/api/endpoints/analytics'
import { Skeleton } from '@/components/ui/skeleton'

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-card border rounded-lg p-5">
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-semibold text-foreground tabular-nums">{value}</p>
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

  const aiFeatures = aiUsage
    ? Object.keys({ ...aiUsage.allTime, ...aiUsage.today })
    : []

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="mb-6">
        <h2 className="text-base font-medium text-foreground">Analytics</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Platform-wide usage overview</p>
      </div>

      {/* Overview stats */}
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Overview</p>
      {ovLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg bg-muted" />
          ))}
        </div>
      ) : overview ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          <StatCard label="Total Users" value={overview.totalUsers} />
          <StatCard label="Total Subjects" value={overview.totalSubjects} />
          <StatCard label="Total Documents" value={overview.totalDocuments} />
        </div>
      ) : null}

      {/* AI Usage */}
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">AI Usage</p>
      {aiLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg bg-muted" />
          ))}
        </div>
      ) : aiUsage && aiFeatures.length > 0 ? (
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="grid grid-cols-3 px-4 py-2.5 border-b bg-secondary">
            <p className="text-xs font-medium text-muted-foreground">Feature</p>
            <p className="text-xs font-medium text-muted-foreground text-right">All-time</p>
            <p className="text-xs font-medium text-muted-foreground text-right">Today</p>
          </div>
          {aiFeatures.map((feature, i) => (
            <div
              key={feature}
              className={[
                'grid grid-cols-3 px-4 py-3',
                i < aiFeatures.length - 1 ? 'border-b' : '',
              ].join(' ')}
            >
              <p className="text-sm text-foreground font-medium">{feature}</p>
              <p className="text-sm text-foreground text-right tabular-nums">
                {aiUsage.allTime[feature] ?? 0}
              </p>
              <p className="text-sm text-foreground text-right tabular-nums">
                {aiUsage.today[feature] ?? 0}
              </p>
            </div>
          ))}
        </div>
      ) : aiUsage ? (
        <p className="text-sm text-muted-foreground">No AI usage recorded yet.</p>
      ) : null}
    </div>
  )
}
