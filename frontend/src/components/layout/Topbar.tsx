import { Link, useLocation } from 'react-router-dom'
import { Search, ChevronRight, LogOut, User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/store/useAuthStore'
import { useUserStore } from '@/store/useUserStore'
import { useBreadcrumbStore } from '@/store/useBreadcrumbStore'
import { useCommandPalette } from '@/hooks/useCommandPalette'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/logo'

function getDefaultCrumb(pathname: string): Array<{ label: string; href?: string }> {
  if (pathname.startsWith('/admin')) return [{ label: 'Admin' }]
  if (pathname.startsWith('/lecturer')) return [{ label: 'Lecturer' }]
  if (pathname.startsWith('/subjects')) return [{ label: 'Subjects' }]
  if (pathname.startsWith('/chats')) return [{ label: 'My Chats' }]
  if (pathname.startsWith('/settings')) return [{ label: 'Settings' }]
  return [{ label: 'Home' }]
}

export function Topbar() {
  const { open: openCmd } = useCommandPalette()
  const user = useUserStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const { pathname } = useLocation()
  const crumbs = useBreadcrumbStore(s => s.crumbs)

  const displayCrumbs = crumbs.length > 0 ? crumbs : getDefaultCrumb(pathname)

  const initials = user?.fullName
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?'

  return (
    <header className="fixed top-4 left-0 right-0 z-40 flex justify-center pointer-events-none px-4 sm:px-6">
      <div className="w-full max-w-5xl h-14 bg-background/95 backdrop-blur-md border border-border shadow-sm rounded-2xl pointer-events-auto flex items-center justify-between px-5 transition-all duration-200">
        <div className="flex items-center gap-3 min-w-0">
        <Link to="/" className="flex-shrink-0 flex items-center hover:opacity-80 transition-opacity duration-150" title="Home">
          <Logo className="h-10 w-auto" />
        </Link>
        <div className="w-[1px] h-4 bg-border hidden sm:block" />
        <nav className="flex items-center gap-2 text-sm min-w-0">
          {displayCrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2 min-w-0">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />}
            {crumb.href ? (
              <Link
                to={crumb.href}
                className="font-data text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors duration-150 truncate"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className={cn(
                'font-data text-[11px] uppercase tracking-widest truncate',
                i === displayCrumbs.length - 1 ? 'text-foreground font-semibold' : 'text-muted-foreground'
              )}>
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </nav>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={openCmd}
          className="group relative flex items-center gap-2 h-8 px-3 rounded-lg bg-card border-2 border-b-[3px] border-border text-muted-foreground hover:bg-muted hover:text-foreground active:border-b-2 active:translate-y-[1px] transition-all duration-150 text-xs shadow-sm"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="font-medium">Search</span>
          <kbd className="ml-1 text-[10px] text-muted-foreground font-data bg-background border px-1.5 rounded uppercase tracking-wider group-hover:bg-card">⌘K</kbd>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary border text-muted-foreground text-xs font-semibold hover:bg-muted hover:ring-2 hover:ring-primary ring-offset-2 transition-all duration-150 focus:outline-none">
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card card-texture border-2 border-border shadow-md rounded-xl overflow-hidden mt-2 p-1">
            <div className="px-3 py-2.5 relative z-10 bg-paper/50 rounded-t-lg mb-1">
              <p className="text-sm font-semibold text-foreground truncate">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground truncate font-data mt-0.5">{user?.email}</p>
            </div>
            <DropdownMenuSeparator className="bg-border mx-2" />
            <DropdownMenuItem asChild className="text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer relative z-10 rounded-md mx-1 px-3 h-9">
              <Link to={user?.roleName === 'admin' ? '/admin/settings' : user?.roleName === 'lecturer' ? '/lecturer/settings' : '/settings'}>
                <User className="h-4 w-4 mr-2" />
                <span className="font-medium text-sm">Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border mx-2" />
            <DropdownMenuItem
              onClick={logout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer relative z-10 rounded-md mx-1 px-3 h-9"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="font-medium text-sm">Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </div>
    </header>
  )
}
