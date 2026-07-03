import { ScrollText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { useAuditLogs } from './queries'

export default function AdminAuditLogsPage() {
  const { data, isLoading } = useAuditLogs({ page: 1, limit: 50 })
  const logs = data?.items ?? []

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Audit Logs</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{data?.total ?? 0} events</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg bg-muted" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="No audit logs" />
      ) : (
        <div className="border rounded-lg overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">Action</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden sm:table-cell">User</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden md:table-cell">Resource</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b hover:bg-muted/50 transition-colors duration-150">
                  <td className="py-3 px-4">
                    <Badge className="text-[10px] rounded font-mono bg-secondary text-muted-foreground border">
                      {log.action}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs hidden sm:table-cell">
                    {log.userFullName ?? log.userEmail ?? '—'}
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    {log.resourceType && (
                      <span className="text-xs text-muted-foreground">
                        {log.resourceType}{log.resourceId ? ` · ${log.resourceId.slice(0, 8)}` : ''}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs hidden lg:table-cell">
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
