import { Outlet, Link, useLocation } from 'react-router-dom'
import { Users, BookOpen, Settings, ScrollText, LayoutDashboard, BarChart2, Shield, ChevronRight } from 'lucide-react'
import { Topbar } from './Topbar'
import { Dock } from './Dock'
import { Toaster } from '@/components/ui/toaster'
import { CommandPalette } from '@/components/shared/CommandPalette'
import { cn } from '@/lib/utils'

const adminTabs = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Verifications', href: '/admin/verifications', icon: Shield },
  { label: 'Allowlist', href: '/admin/allowlist', icon: Shield },
  { label: 'Subjects', href: '/admin/subjects', icon: BookOpen },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart2 },
  { label: 'Roles', href: '/admin/rbac', icon: Shield },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: ScrollText },
]

export function AdminShell() {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen bg-muted/20">
      <Topbar />
      
      {/* Left Sidebar */}
      <aside className="fixed left-0 top-14 w-64 h-[calc(100vh-3.5rem)] bg-card border-r border-border/50 shadow-sm z-30 flex flex-col rounded-tr-3xl overflow-hidden">
        <div className="p-6 pb-2">
          <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground font-semibold">Admin Panel</h2>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {adminTabs.map(tab => {
            const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.href}
                to={tab.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 group relative overflow-hidden',
                  isActive
                    ? 'text-primary bg-primary/10 shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-primary rounded-r-full" />
                )}
                
                <tab.icon className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isActive ? "scale-110" : "group-hover:scale-110")} />
                <span className="truncate flex-1">{tab.label}</span>
                
                {/* Subtle arrow on hover */}
                <ChevronRight className={cn("h-3.5 w-3.5 opacity-0 -translate-x-2 transition-all duration-200", !isActive && "group-hover:opacity-50 group-hover:translate-x-0")} />
              </Link>
            )
          })}
        </nav>

        {/* Optional bottom area in sidebar */}
        <div className="p-4 border-t border-border/40 mt-auto bg-muted/10">
          <div className="rounded-2xl bg-card border border-border/50 p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono text-muted-foreground">All systems operational</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="ml-64 pt-14 pb-20 min-h-screen">
        <Outlet />
      </main>
      <Dock />
      <CommandPalette />
      <Toaster />
    </div>
  )
}
