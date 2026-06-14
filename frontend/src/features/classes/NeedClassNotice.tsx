import { Link, useParams } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'

/** Shown to a lecturer/admin who hasn't created a class yet in this subject. */
export function NeedClassNotice({ noun }: { noun: string }) {
  const { id: subjectId = '' } = useParams<{ id: string }>()
  return (
    <EmptyState
      icon={GraduationCap}
      title="Create a class first"
      description={`${noun} belong to a class. Create one to start adding content.`}
      action={
        <Link
          to={`/subjects/${subjectId}/classes`}
          className="inline-flex items-center gap-1.5 bg-zinc-50 text-zinc-950 hover:bg-zinc-200 h-8 px-3 text-sm font-medium rounded-md"
        >
          <GraduationCap className="h-4 w-4" />
          Go to Classes
        </Link>
      }
    />
  )
}
