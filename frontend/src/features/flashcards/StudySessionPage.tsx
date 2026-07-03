import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Loader2, Flame, CheckCircle2, Settings2, CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/errors'
import { useQueryClient } from '@tanstack/react-query'
import {
  useStudyQueue, useStartStudySession, useReviewCard, useStudyStats,
  useStudySettings, useUpdateStudySettings, studyKeys,
} from './study-queries'
import type { CardRating } from '@/types'

const RATINGS: { rating: CardRating; label: string; cls: string }[] = [
  { rating: 1, label: 'Again', cls: 'bg-transparent text-foreground border-border hover:bg-red-50 hover:text-red-700 hover:border-red-200' },
  { rating: 2, label: 'Hard', cls: 'bg-transparent text-foreground border-border hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200' },
  { rating: 3, label: 'Good', cls: 'bg-transparent text-foreground border-border hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200' },
  { rating: 4, label: 'Easy', cls: 'bg-transparent text-foreground border-border hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200' },
]

export default function StudySessionPage() {
  const { id: subjectId = '', setId = '' } = useParams<{ id: string; setId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const qc = useQueryClient()

  const queue = useStudyQueue(setId)
  const startSession = useStartStudySession()
  const review = useReviewCard()
  const stats = useStudyStats()
  const settings = useStudySettings()
  const updateSettings = useUpdateStudySettings()

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(false)
  const [reviewed, setReviewed] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [newCardsPerDay, setNewCardsPerDay] = useState('')
  const startedRef = useRef(false)

  // Start (or resume) a session once the queue has cards.
  useEffect(() => {
    if (startedRef.current || !queue.data) return
    if (queue.data.cards.length === 0) return
    startedRef.current = true
    startSession.mutate(setId, {
      onSuccess: s => setSessionId(s.sessionId),
      onError: err => toast({ variant: 'destructive', description: getErrorMessage(err, 'Failed to start session.') }),
    })
  }, [queue.data, setId, startSession, toast])

  const cards = queue.data?.cards ?? []
  const card = cards[index]

  const handleRate = useCallback(async (rating: CardRating) => {
    if (!sessionId || !card || review.isPending) return
    try {
      const res = await review.mutateAsync({ sessionId, flashcardId: card.flashcardId, rating })
      setReviewed(n => n + 1)
      if (res.sessionComplete || index >= cards.length - 1) {
        setDone(true)
        qc.invalidateQueries({ queryKey: studyKeys.stats() })
      } else {
        setIndex(i => i + 1)
        setFlipped(false)
      }
    } catch (err) {
      toast({ variant: 'destructive', description: getErrorMessage(err, 'Failed to record review.') })
    }
  }, [sessionId, card, review, index, cards.length, qc, toast])

  // Keyboard: space flips; 1-4 rate when flipped.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (done) return
      if (e.code === 'Space') { e.preventDefault(); setFlipped(f => !f); return }
      if (flipped && ['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(e.code)) {
        handleRate(Number(e.code.slice(-1)) as CardRating)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [flipped, done, handleRate])

  const openSettings = () => {
    setNewCardsPerDay(String(settings.data?.newCardsPerDay ?? 20))
    setSettingsOpen(true)
  }

  const saveSettings = async () => {
    try {
      await updateSettings.mutateAsync(Number(newCardsPerDay))
      toast({ description: 'Study settings saved.' })
      setSettingsOpen(false)
    } catch (err) {
      toast({ variant: 'destructive', description: getErrorMessage(err, 'Failed to save settings.') })
    }
  }

  const back = () => navigate(`/subjects/${subjectId}/flashcards/${setId}`)

  return (
    <div className="max-w-2xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <button onClick={back} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back to set
        </button>
        <div className="flex items-center gap-3">
          {stats.data && (
            <span className="flex items-center gap-1.5 text-xs text-[hsl(var(--lime-text))] font-medium">
              <Flame className="h-3.5 w-3.5" /> {stats.data.currentStreak} day streak
            </span>
          )}
          <button onClick={openSettings} className="text-muted-foreground hover:text-foreground" title="Study settings">
            <Settings2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {queue.isLoading ? (
        <Skeleton className="h-72 w-full rounded-lg bg-muted" />
      ) : done ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <CheckCircle2 className="h-12 w-12 text-[hsl(var(--lime-text))] mb-4" />
          <h2 className="text-lg font-semibold text-foreground">Session complete</h2>
          <p className="text-sm text-muted-foreground mt-1">You reviewed {reviewed} cards.</p>
          {stats.data && (
            <p className="text-sm text-[hsl(var(--lime-text))] font-medium mt-2 flex items-center gap-1.5">
              <Flame className="h-4 w-4" /> {stats.data.currentStreak} day streak
            </p>
          )}
          <Button onClick={back} className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 text-sm rounded-md">
            Done
          </Button>
        </div>
      ) : cards.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="All caught up"
          description={
            queue.data?.nextDueAt
              ? `Next review due ${new Date(queue.data.nextDueAt).toLocaleString()}.`
              : 'No cards are due right now. Come back later.'
          }
        />
      ) : !card ? null : (
        <>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${(index / cards.length) * 100}%` }} />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums shrink-0">{index + 1} / {cards.length}</span>
          </div>

          <div
            onClick={() => setFlipped(f => !f)}
            className={cn(
              "card-texture border rounded-lg flex flex-col items-center justify-center p-8 min-h-[280px] cursor-pointer select-none hover:border-muted-foreground/30",
              flipped ? "bg-secondary" : "bg-card"
            )}
          >
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
              {flipped ? 'Answer' : 'Question'}
              {card.isNew && !flipped && <span className="ml-2 text-sky-500">· new</span>}
            </p>
            <p className="text-base text-foreground text-center leading-relaxed">{flipped ? card.back : card.front}</p>
            {!flipped && <p className="text-xs text-muted-foreground mt-6">Press Space to reveal</p>}
          </div>

          {flipped ? (
            <div className="grid grid-cols-4 gap-2 mt-6">
              {RATINGS.map(r => (
                <Button
                  key={r.rating}
                  onClick={() => handleRate(r.rating)}
                  disabled={review.isPending}
                  className={`h-10 text-sm font-medium rounded-md border ${r.cls}`}
                >
                  {review.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : r.label}
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex justify-center mt-6">
              <Button onClick={() => setFlipped(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-6 text-sm rounded-md">
                Reveal answer
              </Button>
            </div>
          )}
          <p className="text-center text-xs text-muted-foreground mt-4">Space to flip · 1–4 to rate</p>
        </>
      )}

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="bg-card border rounded-lg shadow-none p-0 max-w-sm">
          <div className="px-5 py-4 border-b">
            <DialogTitle className="text-base font-semibold text-foreground">Study settings</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-0.5">New cards introduced per day.</DialogDescription>
          </div>
          <div className="p-5 space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">New cards / day</Label>
            <Input
              type="number" min={1} max={100}
              value={newCardsPerDay}
              onChange={e => setNewCardsPerDay(e.target.value)}
              className="bg-transparent border text-foreground h-9 text-sm rounded-md focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
          <div className="px-5 py-4 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSettingsOpen(false)} className="bg-transparent hover:bg-secondary h-8 px-3 text-sm rounded-md">Cancel</Button>
            <Button onClick={saveSettings} disabled={updateSettings.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-sm rounded-md">
              {updateSettings.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
