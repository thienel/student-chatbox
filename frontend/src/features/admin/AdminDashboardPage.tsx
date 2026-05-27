import { Users, BookOpen, FileText, Activity } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminStats } from './queries'

interface StatCardProps {
  label: string
  value: number | undefined
  icon: React.ComponentType<{ className?: string }>
  isLoading: boolean
}

function StatCard({ label, value, icon: Icon, isLoading }: StatCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-zinc-500 uppercase tracking-wide">{label}</p>
        <div className="h-7 w-7 rounded-md bg-zinc-800 flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-zinc-400" />
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-7 w-16 bg-zinc-800" />
      ) : (
        <p className="text-2xl font-semibold text-zinc-50">{value ?? 0}</p>
      )}
    </div>
  )
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useAdminStats()

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-50">Admin Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-0.5">System overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Users" value={stats?.totalUsers} icon={Users} isLoading={isLoading} />
        <StatCard label="Subjects" value={stats?.totalSubjects} icon={BookOpen} isLoading={isLoading} />
        <StatCard label="Documents" value={stats?.totalDocuments} icon={FileText} isLoading={isLoading} />
        <StatCard label="Active" value={stats?.usersByRole.student} icon={Activity} isLoading={isLoading} />
      </div>

      {stats && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">Users by Role</p>
          <div className="space-y-2">
            {Object.entries(stats.usersByRole).map(([role, count]) => (
              <div key={role} className="flex items-center gap-3">
                <span className="text-xs text-zinc-400 w-16 capitalize">{role}</span>
                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-400 rounded-full transition-all"
                    style={{ width: `${stats.totalUsers ? (count / stats.totalUsers) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-500 w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
