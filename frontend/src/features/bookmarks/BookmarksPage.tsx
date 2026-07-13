import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, FileText, Layers, ClipboardList, MessageSquare, Trash2, ChevronRight } from 'lucide-react'
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/errors'
import { useBookmarks, useDeleteBookmark } from '@/api/queries/bookmarks'
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function resourceHref(_type: BookmarkResourceType) {
  return '#'
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
    } catch (err) {
      toast({ variant: 'destructive', description: getErrorMessage(err, 'Failed to remove bookmark.') })
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-medium text-ink tracking-tight">Bookmarks</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{bookmarks.length} saved</p>
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
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:bg-secondary hover:text-foreground border border-border',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg bg-muted" />
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
            const href = resourceHref(bm.resourceType)
            return (
              <div
                key={bm.id}
                className="bg-card border rounded-lg p-4 flex items-center gap-3 group hover:border-primary/50 transition-colors duration-150"
              >
                <Link to={href} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {bm.resourceId}
                    </p>
                    {bm.note && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{bm.note}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                      {bm.resourceType.replace('_', ' ')}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors duration-150" />
                </Link>
                <ConfirmDeleteDialog
                  title="Remove Bookmark?"
                  description="Are you sure you want to remove this bookmark?"
                  onConfirm={() => handleDelete(bm.id)}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
