import { useParams } from 'react-router-dom'
import { Users } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { useSubject } from './queries'

export default function SubjectMembersPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { data: subject, isLoading } = useSubject(id)

  const lecturers = subject?.lecturers ?? []

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="mb-6">
        <h2 className="text-base font-medium text-zinc-50">Members</h2>
        <p className="text-xs text-zinc-500 mt-0.5">Lecturers assigned to this subject</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg bg-zinc-900" />
          ))}
        </div>
      ) : lecturers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No lecturers assigned"
          description="Contact an admin to assign lecturers to this subject."
        />
      ) : (
        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide">Name</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide">Email</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide">Role</th>
              </tr>
            </thead>
            <tbody>
              {lecturers.map(lecturer => (
                <tr key={lecturer.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors duration-150">
                  <td className="py-3 px-4 text-zinc-300">{lecturer.fullName}</td>
                  <td className="py-3 px-4 text-zinc-500 text-xs">{lecturer.email}</td>
                  <td className="py-3 px-4">
                    <Badge className="text-[10px] rounded bg-zinc-800 text-zinc-400 border-zinc-700">
                      Lecturer
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
