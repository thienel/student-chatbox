import { ScrollText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { useAuditLogs } from '@/api/queries/system'

export default function AdminAuditLogsPage() {
  const { data, isLoading } = useAuditLogs({ page: 1, limit: 50 })
  const logs = data?.items ?? []

  return (
    <div className="max-w-7xl mx-auto px-8 py-10">
      <header className="mb-10">
        <h1 className="text-4xl font-serif text-primary-ink mb-2">Audit Logs</h1>
        <p className="text-sm text-muted-foreground font-mono">{data?.total ?? 0} events recorded</p>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl bg-muted/50 border border-border/30" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="border border-border/50 bg-card rounded-3xl p-16 shadow-sm">
          <EmptyState icon={ScrollText} title="No audit logs" />
        </div>
      ) : (
        <div className="border border-border/50 rounded-3xl overflow-hidden bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                <th className="text-left py-5 px-6 text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                <th className="text-left py-5 px-6 text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">User</th>
                <th className="text-left py-5 px-6 text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Resource</th>
                <th className="text-left py-5 px-6 text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors duration-150">
                  <td className="py-4 px-6">
                    <Badge className="text-[10px] rounded-full font-mono bg-muted text-foreground border border-border/50 px-3 py-1 tracking-wider uppercase">
                      {log.action}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-foreground font-medium text-sm hidden sm:table-cell">
                    {log.userFullName ?? log.userEmail ?? '—'}
                  </td>
                  <td className="py-4 px-6 hidden md:table-cell">
                    {log.resourceType && (
                      <span className="text-sm font-mono text-muted-foreground bg-muted/30 px-2 py-1 rounded-md border border-border/30">
                        {log.resourceType}{log.resourceId ? ` · ${log.resourceId.slice(0, 8)}` : ''}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-muted-foreground text-sm font-mono hidden lg:table-cell">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
