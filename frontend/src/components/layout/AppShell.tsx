import { Outlet } from 'react-router-dom'
import { Topbar } from './Topbar'
import { Dock } from './Dock'
import { Toaster } from '@/components/ui/toaster'
import { CommandPalette } from '@/components/shared/CommandPalette'

export function AppShell() {
  return (
    <div className="min-h-screen bg-background relative z-0 overflow-hidden">
      {/* Ambient background glow - perfectly centered */}
      <div className="fixed top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-[100%] blur-[100px] pointer-events-none -z-10" />
      <Topbar />
      <main className="pt-12 pb-20 min-h-screen">
        <Outlet />
      </main>
      <Dock />
      <CommandPalette />
      <Toaster />
    </div>
  )
}
