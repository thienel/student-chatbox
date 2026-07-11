import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  Users, BookOpen, Settings, LayoutDashboard, ChevronRight,
  ArrowLeft, FileText, GraduationCap, Activity, MessagesSquare,
  ClipboardList, Layers
} from 'lucide-react'
import { Topbar } from './Topbar'
import { Dock } from './Dock'
import { Toaster } from '@/components/ui/toaster'
import { CommandPalette } from '@/components/shared/CommandPalette'
import { cn } from '@/lib/utils'
import { useSubject } from '@/api/queries/subjects'

export function LecturerShell() {
  const { pathname } = useLocation()

  // Contextual parsing: check if URL contains a subject ID
  const match = pathname.match(/\/lecturer\/subjects\/([^\/]+)/)
  const subjectId = match ? match[1] : null

  // Fetch subject details if in subject context
  const { data: subject } = useSubject(subjectId || '')

  // Sidebar items depending on context
  const generalTabs = [
    { label: 'Dashboard', href: '/lecturer/dashboard', icon: LayoutDashboard, exact: true },
    { label: 'My Subjects', href: '/lecturer/subjects', icon: BookOpen },
    { label: 'Settings', href: '/lecturer/settings', icon: Settings },
  ]

  const subjectTabs = subjectId ? [
    { label: 'Documents', href: `/lecturer/subjects/${subjectId}/documents`, icon: FileText },
    { label: 'Classes', href: `/lecturer/subjects/${subjectId}/classes`, icon: GraduationCap },
    { label: 'Students', href: `/lecturer/subjects/${subjectId}/students`, icon: Users },
    { label: 'Engagement', href: `/lecturer/subjects/${subjectId}/engagement`, icon: Activity },
    { label: 'Q&A Board', href: `/lecturer/subjects/${subjectId}/board`, icon: MessagesSquare },
    { label: 'Exams', href: `/lecturer/subjects/${subjectId}/exams`, icon: ClipboardList },
    { label: 'Flashcards', href: `/lecturer/subjects/${subjectId}/flashcards`, icon: Layers },
  ] : []

  return (
    <div className="min-h-screen bg-muted/20">
      <Topbar />

      {/* Left Sidebar */}
      <aside className="fixed left-0 top-14 w-64 h-[calc(100vh-3.5rem)] bg-card border-r border-border/50 shadow-sm z-30 flex flex-col rounded-tr-3xl overflow-hidden">
        {subjectId && subject ? (
          // Subject context header
          <div className="p-6 pb-2 border-b border-border/40 bg-muted/5">
            <Link
              to="/lecturer/dashboard"
              className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-primary transition-colors mb-4"
            >
              <ArrowLeft className="h-3 w-3" /> Back to Dashboard
            </Link>
            <div className="space-y-1">
              <span className="inline-block text-[10px] font-mono font-bold tracking-widest uppercase bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                {subject.code}
              </span>
              <h2 className="text-sm font-serif font-medium text-foreground truncate" title={subject.name}>
                {subject.name}
              </h2>
            </div>
          </div>
        ) : (
          // Default context header
          <div className="p-6 pb-2">
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground font-semibold">
              Lecturer Panel
            </h2>
          </div>
        )}

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {subjectId && subject ? (
            // Render subject specific navigation
            subjectTabs.map(tab => {
              const isActive = pathname.startsWith(tab.href)
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
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-primary rounded-r-full" />
                  )}
                  <tab.icon className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isActive ? "scale-110" : "group-hover:scale-110")} />
                  <span className="truncate flex-1">{tab.label}</span>
                  <ChevronRight className={cn("h-3.5 w-3.5 opacity-0 -translate-x-2 transition-all duration-200", !isActive && "group-hover:opacity-50 group-hover:translate-x-0")} />
                </Link>
              )
            })
          ) : (
            // Render general navigation
            generalTabs.map(tab => {
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
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-primary rounded-r-full" />
                  )}
                  <tab.icon className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isActive ? "scale-110" : "group-hover:scale-110")} />
                  <span className="truncate flex-1">{tab.label}</span>
                  <ChevronRight className={cn("h-3.5 w-3.5 opacity-0 -translate-x-2 transition-all duration-200", !isActive && "group-hover:opacity-50 group-hover:translate-x-0")} />
                </Link>
              )
            })
          )}
        </nav>

        {/* Sidebar bottom indicator */}
        <div className="p-4 border-t border-border/40 mt-auto bg-muted/10">
          <div className="rounded-2xl bg-card border border-border/50 p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono text-muted-foreground">Lecturer Workspace</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 pt-14 pb-20 min-h-screen">
        <Outlet />
      </main>

      <Dock />
      <CommandPalette />
      <Toaster />
    </div>
  )
}
