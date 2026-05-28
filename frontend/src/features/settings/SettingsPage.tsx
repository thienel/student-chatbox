import { useAuthStore } from '@/store/useAuthStore'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const roleColor: Record<string, string> = {
  admin: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  lecturer: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  student: 'bg-zinc-900 text-zinc-500 border-zinc-800',
}

export default function SettingsPage() {
  const user = useAuthStore(s => s.user)

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-50">Settings</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Account information</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg divide-y divide-zinc-800">
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Full Name</p>
            <p className="text-sm text-zinc-300">{user?.fullName}</p>
          </div>
        </div>
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Email</p>
            <p className="text-sm text-zinc-300">{user?.email}</p>
          </div>
        </div>
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Role</p>
            <Badge className={cn('text-[10px] rounded capitalize mt-1', roleColor[user?.role ?? 'student'])}>
              {user?.role}
            </Badge>
          </div>
        </div>
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Status</p>
            <Badge className={cn('text-[10px] rounded capitalize mt-1',
              user?.status === 'active'
                ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                : 'bg-red-950 text-red-400 border-red-900'
            )}>
              {user?.status}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
