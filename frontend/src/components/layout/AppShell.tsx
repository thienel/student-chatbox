import { Outlet } from 'react-router-dom'
import { Topbar } from './Topbar'
import { Dock } from './Dock'
import { Toaster } from '@/components/ui/toaster'
import { CommandPalette } from '@/components/shared/CommandPalette'

export function AppShell() {
  return (
    <div className="min-h-screen bg-background">
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
