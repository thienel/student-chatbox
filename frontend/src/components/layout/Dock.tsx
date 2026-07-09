import { Link, useLocation } from 'react-router-dom'
import { Home, BookOpen, MessageSquare, Bookmark, ShieldCheck, Settings, Users, CalendarCheck, Award } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useUserStore, usePermission } from '@/store/useUserStore'

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
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
          {isActive && (
            <span className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 h-0.5 w-3 rounded-full bg-primary" />
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="top" className="bg-card border text-foreground text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

export function Dock() {
  const user = useUserStore(s => s.user)
  const isAdmin = user?.role === 'admin'
  const isLecturer = user?.role === 'lecturer'
  const canCommunity = usePermission('flashcard:read')
  const canStudyPlan = usePermission('flashcard:study')

  if (isLecturer) return null
  if (isAdmin) return null

  return (
    <TooltipProvider delayDuration={300}>
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-3 h-12 bg-background border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
        <DockItem to="/home" icon={Home} label="Home" exact />
        <DockItem to="/subjects" icon={BookOpen} label="Subjects" />
        <DockItem to="/chats" icon={MessageSquare} label="My Chats" />
        <DockItem to="/bookmarks" icon={Bookmark} label="Bookmarks" />
        {canStudyPlan && <DockItem to="/study-plan" icon={CalendarCheck} label="Study Plan" />}
        {canStudyPlan && <DockItem to="/badges" icon={Award} label="Badges" />}
        {canCommunity && <DockItem to="/community" icon={Users} label="Community" />}
        {isAdmin && (
          <>
            <div className="w-px h-5 bg-border mx-1" />
            <DockItem to="/admin" icon={ShieldCheck} label="Admin" />
          </>
        )}
        <div className="w-px h-5 bg-border mx-1" />
        <DockItem to="/settings" icon={Settings} label="Settings" />
      </nav>
    </TooltipProvider>
  )
}
