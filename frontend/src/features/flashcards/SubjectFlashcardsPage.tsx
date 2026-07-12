import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Layers, Sparkles, Trash2, Loader2, ChevronRight, Star, Globe, Lock, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useUserStore } from '@/store/useUserStore'
import { useSubjectClass } from '@/features/classes/ClassContext'
import { DocumentPicker } from '@/components/shared/DocumentPicker'
import { NeedClassNotice } from '@/features/classes/NeedClassNotice'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import {
  useFlashcardSets,
  useGenerateFlashcards,
  useDeleteFlashcardSet,
  useSetFlashcardVisibility,
  useDiscoverFlashcards,
  useToggleStar
} from '@/api/queries/flashcards'

export default function SubjectFlashcardsPage() {
  const { id: subjectId = '' } = useParams<{ id: string }>()
  const user = useUserStore(s => s.user)
  const canGenerate = user?.permissions?.includes('ai:generate-flashcard')
  const canDelete = user?.permissions?.includes('flashcard:delete')
  const canShare = user?.permissions?.includes('flashcard:manage-own')
  const { toast } = useToast()

  const [genOpen, setGenOpen] = useState(false)
  const [topic, setTopic] = useState('')
  const [cardCount, setCardCount] = useState('10')
  const [documentIds, setDocumentIds] = useState<string[]>([])

  const { classId, isLecturer, needsClass, basePath } = useSubjectClass()
  
  // My Sets Data
  const { data: sets = [], isLoading: isSetsLoading } = useFlashcardSets(subjectId, classId)
  
  // Community Sets Data
  const { data: discoverData, isLoading: isDiscoverLoading } = useDiscoverFlashcards({ subjectId })
  const communitySets = discoverData?.items || []

  // Mutations
  const generate = useGenerateFlashcards(subjectId, classId)
  const remove = useDeleteFlashcardSet(subjectId)
  const setVisibility = useSetFlashcardVisibility(subjectId)
  const toggleStar = useToggleStar()

  const handleToggleVisibility = async (setId: string, isPublic: boolean) => {
    try {
      await setVisibility.mutateAsync({ setId, isPublic: !isPublic })
      toast({ description: isPublic ? 'Set is now private.' : 'Set published to the community.' })
    } catch (err) {
      toast({ variant: 'destructive', description: getErrorMessage(err, 'Failed to update visibility.') })
    }
  }

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

  const handleToggleStar = async (e: React.MouseEvent, setId: string, isStarred: boolean) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await toggleStar.mutateAsync({ setId, starred: isStarred })
    } catch (err) {
      toast({ variant: 'destructive', description: getErrorMessage(err, 'Failed to update star.') })
    }
  }

  const isLoading = isSetsLoading || isDiscoverLoading

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-medium text-foreground">Flashcard Sets</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Learn and discover flashcards</p>
        </div>
        {canGenerate && (
          <Button
            onClick={() => setGenOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-sm font-medium rounded-md"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Generate
          </Button>
        )}
      </div>

      {isLecturer && needsClass ? (
        <NeedClassNotice noun="Flashcard sets" />
      ) : (
        <Tabs defaultValue="my-sets" className="space-y-6">
          <TabsList className="bg-secondary/50 border">
            <TabsTrigger value="my-sets" className="text-xs font-medium px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Layers className="h-3.5 w-3.5 mr-1.5" />
              My Sets
            </TabsTrigger>
            <TabsTrigger value="community" className="text-xs font-medium px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Users className="h-3.5 w-3.5 mr-1.5" />
              Community
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-sets" className="mt-0">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg bg-muted" />
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
                    className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-sm font-medium rounded-md"
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
                    className="bg-card card-texture border rounded-lg p-4 flex items-center justify-between group hover:border-muted-foreground/30 transition-colors duration-150 synapse-glow"
                  >
                    <Link
                      to={`${basePath}/flashcards/${set.id}`}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center shrink-0">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{set.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(set.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0 transition-colors duration-150" />
                    </Link>
                    {set.isPublic && (
                      <span className="flex items-center gap-1 text-xs text-accent ml-2 shrink-0 tabular-nums">
                        <Star className="h-3.5 w-3.5 fill-accent" />
                        {set.starCount}
                      </span>
                    )}
                    {canShare && set.createdBy === user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleVisibility(set.id, set.isPublic)}
                        disabled={setVisibility.isPending}
                        title={set.isPublic ? 'Make private' : 'Publish to community'}
                        className={cn(
                          'h-7 w-7 rounded-md ml-2 shrink-0 hover:bg-secondary',
                          set.isPublic ? 'text-[hsl(var(--lime-text))]' : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {set.isPublic ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                      </Button>
                    )}
                    {canDelete && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-2 shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-foreground">Delete flashcard set?</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground">This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border bg-transparent text-foreground hover:bg-secondary">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => remove.mutate(set.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
          </TabsContent>

          <TabsContent value="community" className="mt-0">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg bg-muted" />
                ))}
              </div>
            ) : communitySets.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No community sets"
                description="No public flashcard sets are available in this subject yet."
              />
            ) : (
              <div className="space-y-2">
                {communitySets.map(set => (
                  <div
                    key={set.id}
                    className="bg-card card-texture border rounded-lg p-4 flex items-center justify-between group hover:border-muted-foreground/30 transition-colors duration-150 synapse-glow"
                  >
                    <Link
                      to={`${basePath}/flashcards/${set.id}`}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center shrink-0">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{set.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          By {set.creatorName} • {set.cardCount} cards
                          {set.publishedAt && ` • Published ${new Date(set.publishedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0 transition-colors duration-150" />
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleToggleStar(e, set.id, set.isStarredByMe)}
                      className={cn(
                        "h-8 px-2 ml-3 shrink-0 rounded-md gap-1.5",
                        set.isStarredByMe 
                          ? "text-accent bg-accent/10 hover:bg-accent/20 hover:text-accent" 
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <Star className={cn("h-3.5 w-3.5", set.isStarredByMe && "fill-accent")} />
                      <span className="tabular-nums font-medium text-xs">{set.starCount}</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Generate Dialog */}
      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent className="bg-card border rounded-lg shadow-none p-0 max-w-md">
          <div className="px-5 py-4 border-b">
            <DialogTitle className="text-base font-semibold text-foreground">Generate Flashcards</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-0.5">
              AI will generate cards from subject documents.
            </DialogDescription>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Topic (optional)</Label>
              <Input
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Dependency Injection"
                className="bg-transparent border text-foreground placeholder:text-muted-foreground h-9 text-sm rounded-md focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Number of cards</Label>
              <Input
                type="number"
                value={cardCount}
                onChange={e => setCardCount(e.target.value)}
                min={1}
                max={50}
                className="bg-transparent border text-foreground h-9 text-sm rounded-md focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
            <DocumentPicker
              subjectId={subjectId}
              value={documentIds}
              onChange={setDocumentIds}
            />
          </div>
          <div className="px-5 py-4 border-t flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setGenOpen(false)}
              className="bg-transparent hover:bg-secondary h-8 px-3 text-sm rounded-md"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generate.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-sm font-medium rounded-md"
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
