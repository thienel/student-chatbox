import { Outlet, Link, useLocation } from 'react-router-dom'
import { Users, BookOpen, Settings, ScrollText, LayoutDashboard, BarChart2, Shield } from 'lucide-react'
import { Topbar } from './Topbar'
import { Dock } from './Dock'
import { Toaster } from '@/components/ui/toaster'
import { CommandPalette } from '@/components/shared/CommandPalette'
import { cn } from '@/lib/utils'

const adminTabs = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Verifications', href: '/admin/verifications', icon: Shield },
  { label: 'Subjects', href: '/admin/subjects', icon: BookOpen },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart2 },
  { label: 'Roles', href: '/admin/rbac', icon: Shield },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: ScrollText },
]

export function AdminShell() {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen bg-muted">
      <Topbar />
      <div className="fixed top-12 left-0 right-0 z-[39] flex items-center gap-0 border-b px-5 bg-muted">
        {adminTabs.map(tab => {
          const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              to={tab.href}
              className={cn(
                'flex items-center gap-1.5 h-10 px-4 text-xs font-mono uppercase tracking-widest border-b-2 -mb-px',
                'transition-colors duration-150',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </Link>
          )
        })}
      </div>
      <main className="pt-[5.5rem] pb-20 min-h-screen">
        <Outlet />
      </main>
      <Dock />
      <CommandPalette />
      <Toaster />
    </div>
  )
}
