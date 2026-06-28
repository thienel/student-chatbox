import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Layers, Sparkles, Trash2, Loader2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/useAuthStore'
import { useSubjectClass } from '@/features/classes/ClassContext'
import { DocumentPicker } from '@/components/shared/DocumentPicker'
import { NeedClassNotice } from '@/features/classes/NeedClassNotice'
import { getErrorMessage } from '@/lib/errors'
import { useFlashcardSets, useGenerateFlashcards, useDeleteFlashcardSet } from './queries'

export default function SubjectFlashcardsPage() {
  const { id: subjectId = '' } = useParams<{ id: string }>()
  const user = useAuthStore(s => s.user)
  const canGenerate = user?.permissions?.includes('ai:generate-flashcard')
  const canDelete = user?.permissions?.includes('flashcard:delete')
  const { toast } = useToast()

  const [genOpen, setGenOpen] = useState(false)
  const [topic, setTopic] = useState('')
  const [cardCount, setCardCount] = useState('10')
  const [documentIds, setDocumentIds] = useState<string[]>([])

  const { classId, isLecturer, needsClass } = useSubjectClass()
  const { data: sets = [], isLoading } = useFlashcardSets(subjectId, classId)
  const generate = useGenerateFlashcards(subjectId, classId)
  const remove = useDeleteFlashcardSet(subjectId)

  const handleGenerate = async () => {
    try {
      await generate.mutateAsync({
        topic: topic.trim() || undefined,
        cardCount: Number(cardCount),
        documentIds: documentIds.length ? documentIds : undefined,
      })
      toast({ description: 'Flashcard set generated.' })
      setGenOpen(false)
      setTopic('')
      setCardCount('10')
      setDocumentIds([])
    } catch (err) {
      toast({ variant: 'destructive', description: getErrorMessage(err, 'Failed to generate flashcards.') })
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-medium text-zinc-50">Flashcard Sets</h2>
          <p className="text-xs text-zinc-500 mt-0.5">{sets.length} sets</p>
        </div>
        {canGenerate && (
          <Button
            onClick={() => setGenOpen(true)}
            className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200 h-8 px-3 text-sm font-medium rounded-md"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Generate
          </Button>
        )}
      </div>

      {isLecturer && needsClass ? (
        <NeedClassNotice noun="Flashcard sets" />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg bg-zinc-900" />
          ))}
        </div>
      ) : sets.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No flashcard sets"
          description={canGenerate ? 'Generate a flashcard set from subject documents.' : 'No flashcard sets available yet.'}
          action={canGenerate ? (
            <Button
              onClick={() => setGenOpen(true)}
              className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200 h-8 px-3 text-sm font-medium rounded-md"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Generate first set
            </Button>
          ) : undefined}
        />
      ) : (
        <div className="space-y-2">
          {sets.map(set => (
            <div
              key={set.id}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center justify-between group hover:border-zinc-700 transition-colors duration-150"
            >
              <Link
                to={`/subjects/${subjectId}/flashcards/${set.id}`}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <div className="h-8 w-8 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
                  <Layers className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-50 truncate">{set.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {new Date(set.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-600 ml-auto shrink-0 group-hover:text-zinc-400 transition-colors duration-150" />
              </Link>
              {canDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-md text-zinc-600 hover:text-red-400 hover:bg-zinc-800 ml-2 shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-zinc-900 border border-zinc-800">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-zinc-50">Delete flashcard set?</AlertDialogTitle>
                      <AlertDialogDescription className="text-zinc-400">This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => remove.mutate(set.id)}
                        className="bg-red-950 text-red-400 border border-red-900 hover:bg-red-900"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Generate Dialog */}
      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-none p-0 max-w-md">
          <div className="px-5 py-4 border-b border-zinc-800">
            <DialogTitle className="text-base font-semibold text-zinc-50">Generate Flashcards</DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 mt-0.5">
              AI will generate cards from subject documents.
            </DialogDescription>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Topic (optional)</Label>
              <Input
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Dependency Injection"
                className="bg-zinc-800 border-zinc-700 text-zinc-50 placeholder:text-zinc-600 h-9 text-sm rounded-md focus-visible:ring-1 focus-visible:ring-zinc-600"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Number of cards</Label>
              <Input
                type="number"
                value={cardCount}
                onChange={e => setCardCount(e.target.value)}
                min={1}
                max={50}
                className="bg-zinc-800 border-zinc-700 text-zinc-50 h-9 text-sm rounded-md focus-visible:ring-1 focus-visible:ring-zinc-600"
              />
            </div>
            <DocumentPicker
              subjectId={subjectId}
              value={documentIds}
              onChange={setDocumentIds}
            />
          </div>
          <div className="px-5 py-4 border-t border-zinc-800 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setGenOpen(false)}
              className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 h-8 px-3 text-sm rounded-md"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generate.isPending}
              className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200 h-8 px-3 text-sm font-medium rounded-md"
            >
              {generate.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Generate
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
