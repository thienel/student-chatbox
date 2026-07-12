import { Link } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { useSubjectClass } from './ClassContext'

/** Shown to a lecturer/admin who hasn't created a class yet in this subject. */
export function NeedClassNotice({ noun }: { noun: string }) {
  const { basePath } = useSubjectClass()
  
  return (
    <EmptyState
      icon={GraduationCap}
      title="Create a class first"
      description={`${noun} belong to a class. Create one to start adding content.`}
      action={
        <Link
          to={`${basePath}/classes`}
          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-sm font-medium rounded-md"
        >
          <GraduationCap className="h-4 w-4" />
          Go to Classes
        </Link>
      }
    />
  )
}
