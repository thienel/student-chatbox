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
  const { isStudent, isLecturer, myClass, classes, activeClassId, setActiveClass, loading, basePath } =
    useSubjectClass()

  if (loading) return null

  // Students see a read-only label of the class they joined.
  if (isStudent) {
    if (!myClass) return null
    return (
      <div className="flex items-center gap-1.5 px-4 sm:px-6 h-9 bg-secondary/50 text-xs text-muted-foreground border-b-0">
        <GraduationCap className="h-3.5 w-3.5" />
        <span>
          Class: <span className="text-foreground">{myClass.name}</span>
          {myClass.lecturer && <span className="text-muted-foreground"> · {myClass.lecturer.fullName}</span>}
        </span>
      </div>
    )
  }

  if (!isLecturer) return null

  const active = classes.find(c => c.id === activeClassId)

  return (
    <div className="flex items-center justify-between px-4 sm:px-6 h-9 bg-secondary/30">
      {classes.length === 0 ? (
        <Link
          to={`${basePath}/classes`}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <GraduationCap className="h-3.5 w-3.5" />
          No class yet — create one to add content
        </Link>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground outline-none">
            <GraduationCap className="h-3.5 w-3.5" />
            <span>
              Class: <span className="text-foreground">{active?.name ?? 'Select'}</span>
            </span>
            <ChevronDown className="h-3 w-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="bg-popover border text-popover-foreground min-w-48"
          >
            {classes.map(c => (
              <DropdownMenuItem
                key={c.id}
                onClick={() => setActiveClass(c.id)}
                className="text-sm focus:bg-accent focus:text-accent-foreground cursor-pointer"
              >
                <Check
                  className={cn(
                    'h-3.5 w-3.5 mr-2',
                    c.id === activeClassId ? 'opacity-100' : 'opacity-0',
                  )}
                />
                {c.name}
                <span className="ml-auto text-muted-foreground text-xs">{c.studentCount ?? 0}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Link
        to={`${basePath}/classes`}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        Manage classes
      </Link>
    </div>
  )
}
