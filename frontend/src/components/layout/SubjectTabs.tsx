import { Link, useLocation } from 'react-router-dom'
import { FileText, MessageSquare, Users, Layers, ClipboardList, GraduationCap, Target, MessagesSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePermission } from '@/store/useAuthStore'

interface SubjectTabsProps {
  subjectId: string
}

export function SubjectTabs({ subjectId }: SubjectTabsProps) {
  const { pathname } = useLocation()

  // Each tab is shown only if the user holds the permission that backs it.
  const perms = {
    documents: usePermission('document:read'),
    chat: usePermission('chat:create'),
    flashcards: usePermission('flashcard:read'),
    exams: usePermission('exam:read'),
    weakTopics: usePermission('exam:take'),
    board: usePermission('subject:read'),
    classes: usePermission('class:manage'),
    members: usePermission('subject:assign-lecturer'),
  }

  const tabs = [
    perms.documents && { label: 'Documents', href: `/subjects/${subjectId}/documents`, icon: FileText },
    perms.chat && { label: 'Chat', href: `/subjects/${subjectId}/chat`, icon: MessageSquare },
    perms.flashcards && { label: 'Flashcards', href: `/subjects/${subjectId}/flashcards`, icon: Layers },
    perms.exams && { label: 'Exams', href: `/subjects/${subjectId}/exams`, icon: ClipboardList },
    perms.weakTopics && { label: 'Weak Topics', href: `/subjects/${subjectId}/weak-topics`, icon: Target },
    perms.board && { label: 'Board', href: `/subjects/${subjectId}/board`, icon: MessagesSquare },
    // Lecturers manage their class roster; admins manage subject lecturers.
    perms.classes && { label: 'Students', href: `/subjects/${subjectId}/students`, icon: Users },
    perms.classes && { label: 'Classes', href: `/subjects/${subjectId}/classes`, icon: GraduationCap },
    perms.members && { label: 'Members', href: `/subjects/${subjectId}/members`, icon: Users },
  ].filter(Boolean) as { label: string; href: string; icon: typeof FileText }[]

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
