import { Link, useLocation } from 'react-router-dom'
import { Home, BookOpen, MessageSquare, Bookmark, ShieldCheck, Settings } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'

interface DockItemProps {
  to: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  exact?: boolean
}

function DockItem({ to, icon: Icon, label, exact }: DockItemProps) {
  const { pathname } = useLocation()
  const isActive = exact ? pathname === to : pathname.startsWith(to)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={to}
          className={cn(
            'relative flex items-center justify-center h-8 w-8 rounded-xl',
            'transition-colors duration-150',
            isActive
              ? 'bg-zinc-800 text-zinc-50'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
          {isActive && (
            <span className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 h-0.5 w-3 rounded-full bg-zinc-50" />
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="top" className="bg-zinc-800 border-zinc-700 text-zinc-200 text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

export function Dock() {
  const user = useAuthStore(s => s.user)
  const isAdmin = user?.role === 'admin'

  return (
    <TooltipProvider delayDuration={300}>
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-3 h-12 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <DockItem to="/home" icon={Home} label="Home" exact />
        <DockItem to="/subjects" icon={BookOpen} label="Subjects" />
        <DockItem to="/chats" icon={MessageSquare} label="My Chats" />
        <DockItem to="/bookmarks" icon={Bookmark} label="Bookmarks" />
        {isAdmin && (
          <>
            <div className="w-px h-5 bg-zinc-800 mx-1" />
            <DockItem to="/admin" icon={ShieldCheck} label="Admin" />
          </>
        )}
        <div className="w-px h-5 bg-zinc-800 mx-1" />
        <DockItem to="/settings" icon={Settings} label="Settings" />
      </nav>
    </TooltipProvider>
  )
}
