import { Link, useLocation } from 'react-router-dom'
import { FileText, MessageSquare, Users, Layers, ClipboardList, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'

interface SubjectTabsProps {
  subjectId: string
}

export function SubjectTabs({ subjectId }: SubjectTabsProps) {
  const { pathname } = useLocation()
  const role = useAuthStore(s => s.user?.role)
  const canManageClasses = role === 'lecturer' || role === 'admin'

  const tabs = [
    { label: 'Documents', href: `/subjects/${subjectId}/documents`, icon: FileText },
    { label: 'Chat', href: `/subjects/${subjectId}/chat`, icon: MessageSquare },
    { label: 'Flashcards', href: `/subjects/${subjectId}/flashcards`, icon: Layers },
    { label: 'Exams', href: `/subjects/${subjectId}/exams`, icon: ClipboardList },
    { label: 'Members', href: `/subjects/${subjectId}/members`, icon: Users },
    ...(canManageClasses
      ? [{ label: 'Classes', href: `/subjects/${subjectId}/classes`, icon: GraduationCap }]
      : []),
  ]

  return (
    <div className="flex items-center gap-0 border-b border-zinc-900 px-5 bg-zinc-950">
      {tabs.map(tab => (
        <Link
          key={tab.href}
          to={tab.href}
          className={cn(
            'flex items-center gap-1.5 h-10 px-3 text-sm border-b-2 -mb-px',
            'transition-colors duration-150',
            pathname.startsWith(tab.href)
              ? 'border-zinc-50 text-zinc-50'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          )}
        >
          <tab.icon className="h-3.5 w-3.5" />
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
