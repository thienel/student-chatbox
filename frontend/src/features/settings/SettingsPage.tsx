import { useAuthStore } from '@/store/useAuthStore'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const roleColor: Record<string, string> = {
  admin: 'bg-secondary text-foreground border-border',
  lecturer: 'bg-secondary text-muted-foreground border-border',
  student: 'bg-muted text-muted-foreground border-border',
}

export default function SettingsPage() {
  const user = useAuthStore(s => s.user)

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Account information</p>
      </div>

      <div className="bg-card border rounded-lg divide-y divide-border">
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Full Name</p>
            <p className="text-sm text-foreground">{user?.fullName}</p>
          </div>
        </div>
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Email</p>
            <p className="text-sm text-foreground">{user?.email}</p>
          </div>
        </div>
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Role</p>
            <Badge className={cn('text-[10px] rounded capitalize mt-1', roleColor[user?.role ?? 'student'])}>
              {user?.role}
            </Badge>
          </div>
        </div>
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Status</p>
            <Badge className={cn('text-[10px] rounded capitalize mt-1',
              user?.status === 'active'
                ? 'bg-secondary text-muted-foreground border-border'
                : 'bg-destructive/10 text-destructive border-destructive/20'
            )}>
              {user?.status}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
