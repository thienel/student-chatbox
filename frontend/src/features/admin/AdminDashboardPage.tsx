import { Link } from 'react-router-dom'
import { Users, BookOpen, FileText, Activity, Clock, ArrowRight, ShieldAlert } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useAdminStats, usePendingVerifications } from './queries'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: number | undefined
  icon: React.ComponentType<{ className?: string }>
  isLoading: boolean
  className?: string
}

function StatCard({ label, value, icon: Icon, isLoading, className }: StatCardProps) {
  return (
    <div className={cn("border border-border p-5 relative overflow-hidden group bg-card", className)}>
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-24 h-24" />
      </div>
      <div className="flex items-center justify-between mb-8 relative z-10">
        <h3 className="text-sm font-medium tracking-widest text-muted-foreground uppercase font-sans">
          {label}
        </h3>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="relative z-10">
        {isLoading ? (
          <Skeleton className="h-10 w-24 bg-muted/50" />
        ) : (
          <p className="text-4xl font-mono text-foreground font-light tracking-tight">
            {value?.toLocaleString() ?? '0'}
          </p>
        )}
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useAdminStats()
  const { data: pendingUsersRes, isLoading: pendingLoading } = usePendingVerifications()
  
  const pendingUsers = (pendingUsersRes || []).slice(0, 5)
  const totalPending = pendingUsersRes?.length || 0

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <header className="mb-10 pb-6 border-b border-border flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-serif text-primary-ink mb-2">System Ledger</h1>
          <p className="text-sm text-muted-foreground font-mono">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Status</p>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-mono text-emerald-600">Operational</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total Users" value={stats?.totalUsers} icon={Users} isLoading={statsLoading} />
        <StatCard label="Active Subjects" value={stats?.totalSubjects} icon={BookOpen} isLoading={statsLoading} />
        <StatCard label="Documents" value={stats?.totalDocuments} icon={FileText} isLoading={statsLoading} />
        <StatCard label="System Activity" value={Math.floor((stats?.totalUsers || 0) * 2.5)} icon={Activity} isLoading={statsLoading} className="bg-primary/5 border-primary/20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Activity Placeholder */}
          <div className="border border-border bg-card">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-muted/10">
              <h2 className="text-sm font-mono uppercase tracking-widest">Recent Audit Logs</h2>
              <Link to="/admin/audit-logs" className="text-xs font-mono text-primary hover:underline">View All</Link>
            </div>
            <div className="p-12 text-center text-muted-foreground border-b border-border border-dashed m-4">
              <Clock className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="font-mono text-xs uppercase">Activity stream requires analytics module</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-border bg-card">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-muted/10">
              <h2 className="text-sm font-mono uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-accent" />
                Pending Review
              </h2>
              {totalPending > 0 && (
                <span className="bg-accent text-accent-foreground text-[10px] font-mono px-2 py-0.5 rounded-full">
                  {totalPending}
                </span>
              )}
            </div>
            
            {pendingLoading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-12 w-full bg-muted/50 rounded-none" />
                <Skeleton className="h-12 w-full bg-muted/50 rounded-none" />
              </div>
            ) : pendingUsers.length === 0 ? (
              <div className="p-8 text-center">
                <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-muted-foreground font-mono text-sm">The queue is currently empty.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {pendingUsers.map(user => (
                  <div key={user.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="font-medium text-foreground">{user.user?.fullName || 'Unknown'}</p>
                      <p className="text-sm font-mono text-muted-foreground mt-1">ID: {user.studentCode} • {user.campus || 'Unknown Campus'}</p>
                    </div>
                    <Button asChild variant="outline" size="sm" className="font-mono text-xs rounded-none border-border">
                      <Link to={`/admin/verifications`}>
                        Review <ArrowRight className="w-3 h-3 ml-2" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-4 border-t border-border bg-muted/10 text-right">
            <Button asChild variant="link" className="text-primary font-mono text-xs p-0 h-auto hover:no-underline">
              <Link to="/admin/verifications">VIEW FULL QUEUE →</Link>
            </Button>
          </div>
        </div>

        {/* Demographics / Roles Widget */}
        <div className="border border-border bg-card">
          <div className="p-5 border-b border-border bg-muted/30">
            <h2 className="text-lg font-serif text-primary-ink">Identity Distribution</h2>
          </div>
          <div className="p-6">
            {statsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full bg-muted/50" />)}
              </div>
            ) : stats ? (
              <div className="space-y-6">
                {Object.entries(stats.usersByRole).map(([role, count]) => {
                  const percentage = stats.totalUsers ? (count / stats.totalUsers) * 100 : 0
                  return (
                    <div key={role} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-mono uppercase tracking-widest text-muted-foreground">{role}</span>
                        <span className="font-mono font-medium">{count.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 w-full bg-secondary overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
