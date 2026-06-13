import { Outlet, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { Topbar } from './Topbar'
import { Dock } from './Dock'
import { SubjectTabs } from './SubjectTabs'
import { Toaster } from '@/components/ui/toaster'
import { CommandPalette } from '@/components/shared/CommandPalette'
import { useBreadcrumbStore } from '@/store/useBreadcrumbStore'
import { useSubject } from '@/features/subjects/queries'
import { SubjectClassProvider, useSubjectClass } from '@/features/classes/ClassContext'
import { ClassBar } from '@/features/classes/ClassBar'
import { ClassGate } from '@/features/classes/ClassGate'

function SubjectBody({ subjectId }: { subjectId: string }) {
  const { needsEnroll } = useSubjectClass()
  if (needsEnroll) return <ClassGate subjectId={subjectId} />
  return <Outlet />
}

export function SubjectShell() {
  const { id = '' } = useParams<{ id: string }>()
  const { data: subject } = useSubject(id)
  const setBreadcrumbs = useBreadcrumbStore(s => s.set)
  const resetBreadcrumbs = useBreadcrumbStore(s => s.reset)

  useEffect(() => {
    if (subject) {
      setBreadcrumbs([
        { label: 'Subjects', href: '/subjects' },
        { label: `${subject.code} — ${subject.name}` },
      ])
    }
    return () => resetBreadcrumbs()
  }, [subject, setBreadcrumbs, resetBreadcrumbs])

  return (
    <SubjectClassProvider subjectId={id}>
      <div className="min-h-screen bg-zinc-950">
        <Topbar />
        <div className="fixed top-12 left-0 right-0 z-[39]">
          <SubjectTabs subjectId={id} />
          <ClassBar />
        </div>
        <main className="pt-[7.75rem] pb-20 min-h-screen">
          <SubjectBody subjectId={id} />
        </main>
        <Dock />
        <CommandPalette />
        <Toaster />
      </div>
    </SubjectClassProvider>
  )
}
