import { Link } from 'react-router-dom'
import { ChevronDown, GraduationCap, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useSubjectClass } from './ClassContext'

export function ClassBar() {
  const { subjectId, isStudent, isLecturer, myClass, classes, activeClassId, setActiveClass, loading } =
    useSubjectClass()

  if (loading) return null

  // Students see a read-only label of the class they joined.
  if (isStudent) {
    if (!myClass) return null
    return (
      <div className="flex items-center gap-1.5 px-5 h-9 bg-zinc-950 border-b border-zinc-900 text-xs text-zinc-500">
        <GraduationCap className="h-3.5 w-3.5" />
        <span>
          Class: <span className="text-zinc-300">{myClass.name}</span>
          {myClass.lecturer && <span className="text-zinc-600"> · {myClass.lecturer.fullName}</span>}
        </span>
      </div>
    )
  }

  if (!isLecturer) return null

  const active = classes.find(c => c.id === activeClassId)

  return (
    <div className="flex items-center justify-between px-5 h-9 bg-zinc-950 border-b border-zinc-900">
      {classes.length === 0 ? (
        <Link
          to={`/subjects/${subjectId}/classes`}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-50"
        >
          <GraduationCap className="h-3.5 w-3.5" />
          No class yet — create one to add content
        </Link>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-50 outline-none">
            <GraduationCap className="h-3.5 w-3.5" />
            <span>
              Class: <span className="text-zinc-200">{active?.name ?? 'Select'}</span>
            </span>
            <ChevronDown className="h-3 w-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 min-w-48"
          >
            {classes.map(c => (
              <DropdownMenuItem
                key={c.id}
                onClick={() => setActiveClass(c.id)}
                className="text-sm focus:bg-zinc-800 focus:text-zinc-50 cursor-pointer"
              >
                <Check
                  className={cn(
                    'h-3.5 w-3.5 mr-2',
                    c.id === activeClassId ? 'opacity-100' : 'opacity-0',
                  )}
                />
                {c.name}
                <span className="ml-auto text-zinc-600 text-xs">{c.studentCount ?? 0}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Link
        to={`/subjects/${subjectId}/classes`}
        className="text-xs text-zinc-500 hover:text-zinc-300"
      >
        Manage classes
      </Link>
    </div>
  )
}
