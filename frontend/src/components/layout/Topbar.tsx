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
import { useBreadcrumbStore } from '@/store/useBreadcrumbStore'
import { useCommandPalette } from '@/hooks/useCommandPalette'
import { cn } from '@/lib/utils'

function getDefaultCrumb(pathname: string): Array<{ label: string; href?: string }> {
  if (pathname.startsWith('/admin')) return [{ label: 'Admin' }]
  if (pathname.startsWith('/subjects')) return [{ label: 'Subjects' }]
  if (pathname.startsWith('/chats')) return [{ label: 'My Chats' }]
  if (pathname.startsWith('/settings')) return [{ label: 'Settings' }]
  return [{ label: 'Home' }]
}

export function Topbar() {
  const { open: openCmd } = useCommandPalette()
  const user = useAuthStore(s => s.user)
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
    <header className="fixed top-0 left-0 right-0 z-40 h-12 flex items-center justify-between px-5 bg-background border-b">
      <nav className="flex items-center gap-1.5 text-sm min-w-0">
        {displayCrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
            {crumb.href ? (
              <Link
                to={crumb.href}
                className="text-muted-foreground hover:text-foreground transition-colors duration-150 truncate"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className={cn(
                'truncate',
                i === displayCrumbs.length - 1 ? 'text-foreground font-medium' : 'text-muted-foreground'
              )}>
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={openCmd}
          className="flex items-center gap-2 h-7 px-2.5 rounded-md bg-secondary border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-colors duration-150 text-xs"
        >
          <Search className="h-3 w-3" />
          <span>Search</span>
          <kbd className="ml-1 text-[10px] text-muted-foreground font-mono">⌘K</kbd>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center justify-center h-7 w-7 rounded-md bg-secondary border text-muted-foreground text-xs font-medium hover:bg-muted transition-colors duration-150">
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card border">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium text-foreground truncate">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem asChild className="text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer">
              <Link to="/settings">
                <User className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              onClick={logout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
