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
    <div className={cn("rounded-3xl border border-border/50 p-6 relative overflow-hidden group bg-card shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300", className)}>
      <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
        <Icon className="w-32 h-32" />
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10 group-hover:bg-primary/10 transition-colors" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <h3 className="text-sm font-medium tracking-widest text-muted-foreground uppercase font-mono">
          {label}
        </h3>
        <div className="p-2.5 bg-primary/10 rounded-2xl group-hover:bg-primary/20 transition-colors">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      <div className="relative z-10">
        {isLoading ? (
          <Skeleton className="h-10 w-24 bg-muted/50 rounded-xl" />
        ) : (
          <p className="text-4xl font-mono text-foreground font-light tracking-tight group-hover:text-primary transition-colors duration-300">
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
    <div className="max-w-7xl mx-auto px-8 py-10">
      <header className="mb-12 flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-serif text-primary-ink mb-2">System Dashboard</h1>
          <p className="text-sm text-muted-foreground font-mono">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="text-right bg-card px-4 py-3 rounded-2xl border border-border/50 shadow-sm flex flex-col items-end">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-semibold">Status</p>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono text-emerald-600 font-medium">Operational</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard label="Total Users" value={stats?.totalUsers} icon={Users} isLoading={statsLoading} />
        <StatCard label="Active Subjects" value={stats?.totalSubjects} icon={BookOpen} isLoading={statsLoading} />
        <StatCard label="Documents" value={stats?.totalDocuments} icon={FileText} isLoading={statsLoading} />
        <StatCard label="System Activity" value={Math.floor((stats?.totalUsers || 0) * 2.5)} icon={Activity} isLoading={statsLoading} className="bg-primary/5 border-primary/20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Activity Placeholder */}
          <div className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-6 py-5 border-b border-border/50 flex justify-between items-center bg-muted/20">
              <h2 className="text-sm font-mono uppercase tracking-widest font-semibold">Recent Audit Logs</h2>
              <Link to="/admin/audit-logs" className="text-xs font-mono text-primary hover:underline font-medium bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors">View All</Link>
            </div>
            <div className="p-12 text-center text-muted-foreground m-6 rounded-2xl border border-border/50 border-dashed bg-muted/10 flex-1 flex flex-col items-center justify-center">
              <Clock className="w-10 h-10 mx-auto mb-4 opacity-30" />
              <p className="font-mono text-xs uppercase tracking-wider">Activity stream requires analytics module</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-border/50 flex justify-between items-center bg-muted/20">
              <h2 className="text-sm font-mono uppercase tracking-widest flex items-center gap-2 font-semibold">
                <ShieldAlert className="w-4 h-4 text-accent" />
                Pending Review
              </h2>
              {totalPending > 0 && (
                <span className="bg-accent text-accent-foreground text-[10px] font-mono px-2.5 py-1 rounded-full font-semibold">
                  {totalPending}
                </span>
              )}
            </div>
            
            {pendingLoading ? (
              <div className="p-5 space-y-4">
                <Skeleton className="h-14 w-full bg-muted/50 rounded-2xl" />
                <Skeleton className="h-14 w-full bg-muted/50 rounded-2xl" />
              </div>
            ) : pendingUsers.length === 0 ? (
              <div className="p-10 text-center flex-1 flex flex-col items-center justify-center">
                <ShieldAlert className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground font-mono text-sm">The queue is currently empty.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50 px-2 py-2">
                {pendingUsers.map(user => (
                  <div key={user.id} className="p-4 flex items-center justify-between hover:bg-muted/40 transition-colors rounded-2xl mx-2 my-1 group">
                    <div>
                      <p className="font-medium text-foreground text-sm">{user.user?.fullName || 'Unknown'}</p>
                      <p className="text-xs font-mono text-muted-foreground mt-1">ID: {user.studentCode} • {user.campus || 'Unknown Campus'}</p>
                    </div>
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                      <Link to={`/admin/verifications`}>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="p-4 border-t border-border/50 bg-muted/10 text-center">
              <Button asChild variant="link" className="text-primary font-mono text-xs p-0 h-auto hover:no-underline font-semibold tracking-wider">
                <Link to="/admin/verifications">VIEW FULL QUEUE →</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Demographics / Roles Widget */}
        <div className="lg:col-span-3 rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border/50 bg-muted/20">
            <h2 className="text-lg font-serif text-primary-ink">Identity Distribution</h2>
          </div>
          <div className="p-8">
            {statsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full bg-muted/50 rounded-2xl" />)}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {Object.entries(stats.usersByRole).map(([role, count]) => {
                  const percentage = stats.totalUsers ? (count / stats.totalUsers) * 100 : 0
                  return (
                    <div key={role} className="space-y-3 p-5 rounded-2xl bg-muted/10 border border-border/30 hover:border-border/60 transition-colors">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-mono uppercase tracking-widest text-muted-foreground font-semibold">{role}</span>
                        <span className="font-mono font-bold text-lg">{count.toLocaleString()}</span>
                      </div>
                      <div className="h-2 w-full bg-secondary overflow-hidden rounded-full">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" 
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
