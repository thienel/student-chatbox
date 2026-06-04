import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, FileText, Layers, ClipboardList, MessageSquare, Trash2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { useToast } from '@/hooks/use-toast'
import { useBookmarks, useDeleteBookmark } from './queries'
import type { BookmarkResourceType } from '@/types'

const FILTERS: { label: string; value: BookmarkResourceType | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Documents', value: 'document' },
  { label: 'Flashcards', value: 'flashcard_set' },
  { label: 'Exams', value: 'exam' },
  { label: 'Messages', value: 'message' },
]

const ResourceIcon: Record<BookmarkResourceType, React.ElementType> = {
  document: FileText,
  flashcard_set: Layers,
  exam: ClipboardList,
  message: MessageSquare,
}

function resourceHref(type: BookmarkResourceType, resourceId: string) {
  switch (type) {
    case 'document': return '#'
    case 'flashcard_set': return '#'
    case 'exam': return '#'
    case 'message': return '#'
  }
}

export default function BookmarksPage() {
  const [filter, setFilter] = useState<BookmarkResourceType | undefined>(undefined)
  const { data: bookmarks = [], isLoading } = useBookmarks(filter)
  const remove = useDeleteBookmark()
  const { toast } = useToast()

  const handleDelete = async (id: string) => {
    try {
      await remove.mutateAsync(id)
      toast({ description: 'Bookmark removed.' })
    } catch {
      toast({ variant: 'destructive', description: 'Failed to remove bookmark.' })
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <div className="mb-6">
        <h2 className="text-base font-medium text-zinc-50">Bookmarks</h2>
        <p className="text-xs text-zinc-500 mt-0.5">{bookmarks.length} saved</p>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.label}
            onClick={() => setFilter(f.value)}
            className={[
              'px-3 py-1 rounded-md text-xs font-medium transition-colors duration-150',
              filter === f.value
                ? 'bg-zinc-700 text-zinc-50'
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 border border-zinc-800',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg bg-zinc-900" />
          ))}
        </div>
      ) : bookmarks.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No bookmarks"
          description="Save documents, flashcard sets, exams, or messages to access them here."
        />
      ) : (
        <div className="space-y-2">
          {bookmarks.map(bm => {
            const Icon = ResourceIcon[bm.resourceType]
            const href = resourceHref(bm.resourceType, bm.resourceId)
            return (
              <div
                key={bm.id}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center gap-3 group hover:border-zinc-700 transition-colors duration-150"
              >
                <Link to={href} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-8 w-8 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-zinc-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-50 truncate">
                      {bm.resourceId}
                    </p>
                    {bm.note && (
                      <p className="text-xs text-zinc-500 mt-0.5 truncate">{bm.note}</p>
                    )}
                    <p className="text-xs text-zinc-700 mt-0.5 capitalize">
                      {bm.resourceType.replace('_', ' ')}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-600 shrink-0 group-hover:text-zinc-400 transition-colors duration-150" />
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(bm.id)}
                  className="h-7 w-7 rounded-md text-zinc-600 hover:text-red-400 hover:bg-zinc-800 shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
