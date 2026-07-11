import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/api/endpoints/analytics'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

function StatCard({ label, value, className }: { label: string; value: string | number; className?: string }) {
  return (
    <div className={cn("bg-card border border-border/50 rounded-3xl p-8 shadow-sm relative overflow-hidden group hover:-translate-y-1 hover:shadow-md transition-all duration-300", className)}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10 group-hover:bg-primary/10 transition-colors" />
      <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest mb-3">{label}</p>
      <p className="text-5xl font-light text-foreground font-mono tracking-tight group-hover:text-primary transition-colors">{value}</p>
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
    <div className="max-w-7xl mx-auto px-8 py-10">
      <header className="mb-10">
        <h1 className="text-4xl font-serif text-primary-ink mb-2">Analytics</h1>
        <p className="text-sm text-muted-foreground font-mono">Platform-wide usage overview</p>
      </header>

      {/* Overview stats */}
      <h2 className="text-xs font-semibold text-foreground font-mono uppercase tracking-widest mb-4 ml-2">Overview</h2>
      {ovLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-3xl bg-muted/50 border border-border/30" />
          ))}
        </div>
      ) : overview ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard label="Total Users" value={overview.totalUsers} />
          <StatCard label="Total Subjects" value={overview.totalSubjects} />
          <StatCard label="Total Documents" value={overview.totalDocuments} />
        </div>
      ) : null}

      {/* AI Usage */}
      <h2 className="text-xs font-semibold text-foreground font-mono uppercase tracking-widest mb-4 ml-2">AI Usage</h2>
      {aiLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl bg-muted/50 border border-border/30" />
          ))}
        </div>
      ) : aiUsage && aiFeatures.length > 0 ? (
        <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-3 px-8 py-5 border-b border-border/50 bg-muted/20">
            <p className="text-xs font-semibold font-mono text-muted-foreground uppercase tracking-wider">Feature</p>
            <p className="text-xs font-semibold font-mono text-muted-foreground text-right uppercase tracking-wider">All-time</p>
            <p className="text-xs font-semibold font-mono text-muted-foreground text-right uppercase tracking-wider">Today</p>
          </div>
          <div className="divide-y divide-border/30">
            {aiFeatures.map((feature) => (
              <div
                key={feature}
                className="grid grid-cols-3 px-8 py-5 hover:bg-muted/30 transition-colors"
              >
                <p className="text-base text-foreground font-medium">{feature}</p>
                <p className="text-base text-muted-foreground font-mono text-right tabular-nums">
                  {aiUsage.allTime[feature] ?? 0}
                </p>
                <p className="text-base text-foreground font-mono font-semibold text-right tabular-nums">
                  {aiUsage.today[feature] ?? 0}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : aiUsage ? (
        <div className="border border-border/50 bg-card rounded-3xl p-10 text-center shadow-sm">
          <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest">No AI usage recorded yet.</p>
        </div>
      ) : null}
    </div>
  )
}
