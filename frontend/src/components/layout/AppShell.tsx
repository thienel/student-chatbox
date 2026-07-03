import { Outlet, useLocation } from 'react-router-dom'
import { Topbar } from './Topbar'
import { Dock } from './Dock'
import { Toaster } from '@/components/ui/toaster'
import { CommandPalette } from '@/components/shared/CommandPalette'

export function AppShell() {
  const { pathname } = useLocation()
  const isMinimalPage = pathname.includes('/chat/') || pathname.includes('/exams/') || pathname.endsWith('/study')

  return (
    <div className="min-h-screen bg-background relative z-0 overflow-hidden">
      {/* Gradebook Background */}
      {!isMinimalPage && <div className="fixed inset-0 pointer-events-none -z-10 ruled-paper-bg" />}
      {!isMinimalPage && (
        <div className="fixed top-0 bottom-0 left-12 w-[1px] bg-primary/20 pointer-events-none -z-10" />
      )}
      <Topbar />
      <main className="pt-14 pb-20 min-h-screen">
        <Outlet />
      </main>
      <Dock />
      <CommandPalette />
      <Toaster />
    </div>
  )
}
