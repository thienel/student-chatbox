import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Loader2, Settings2, CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { AchievementStamp } from '@/components/ui/achievement-stamp'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/errors'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import {
  useStudyQueue, useStartStudySession, useReviewCard, useStudyStats,
  useStudySettings, useUpdateStudySettings,
} from '@/api/queries/study'
import { queryKeys } from '@/api/queryKeys'
import type { CardRating } from '@/types'

const RATINGS: { rating: CardRating; label: string; shortcut: string }[] = [
  { rating: 1, label: 'Again', shortcut: '1' },
  { rating: 2, label: 'Hard', shortcut: '2' },
  { rating: 3, label: 'Good', shortcut: '3' },
  { rating: 4, label: 'Easy', shortcut: '4' },
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
        qc.invalidateQueries({ queryKey: queryKeys.study.stats })
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

  const remainingNew = cards.slice(index).filter(c => c.isNew).length
  const remainingDue = cards.slice(index).filter(c => !c.isNew).length

  return (
    <div className="max-w-3xl mx-auto px-6 py-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <button onClick={back} className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-ink transition-colors">
          <ChevronLeft className="h-4 w-4" /> Exit Session
        </button>
        
        <div className="flex items-center gap-4">
          {!done && cards.length > 0 && (
            <div className="flex items-center gap-4 bg-card border rounded-full px-4 py-1.5 shadow-sm">
              <span className="text-xs font-medium text-muted-foreground">
                Thẻ <span className="font-data text-ink text-sm">{index + 1}</span> / <span className="font-data text-sm">{cards.length}</span> <span className="opacity-70">(đã học <span className="font-data">{reviewed}</span> thẻ)</span>
              </span>
              <div className="w-[1px] h-4 bg-border" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">New: <span className="font-data">{remainingNew}</span></span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-ink border">Due: <span className="font-data">{remainingDue}</span></span>
              </div>
            </div>
          )}
          <button onClick={openSettings} className="h-8 w-8 flex items-center justify-center rounded-full bg-card border text-muted-foreground hover:text-ink hover:bg-secondary transition-colors" title="Study settings">
            <Settings2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {queue.isLoading ? (
          <Skeleton className="h-[400px] w-full rounded-2xl bg-card border" />
        ) : done ? (
          <div className="bg-card card-texture border rounded-2xl p-16 text-center shadow-sm relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
            {stats.data && (
              <AchievementStamp 
                value={stats.data.currentStreak} 
                label="DAY STREAK" 
                className="mb-8 relative z-10 mx-auto"
              />
            )}
            <h2 className="text-4xl font-heading font-medium text-ink relative z-10">Session Complete!</h2>
            <p className="text-base text-muted-foreground mt-4 relative z-10">You have successfully reviewed <span className="font-data font-semibold text-ink text-lg">{reviewed}</span> cards.</p>
            <div className="mt-10 relative z-10">
              <Button onClick={back} className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-10 text-sm font-medium rounded-lg">
                Return to Library
              </Button>
            </div>
          </div>
        ) : cards.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="All caught up"
            description={
              queue.data?.nextDueAt
                ? `Next review due ${new Date(queue.data.nextDueAt).toLocaleString()}.`
                : 'No cards are due right now. Take a break.'
            }
          />
        ) : !card ? null : (
          <div className="flex flex-col h-full gap-8 pb-12">
            {/* Center Stage: Flashcard */}
            <div
              onClick={() => setFlipped(f => !f)}
              className={cn(
                "flex-1 bg-card card-texture border rounded-2xl shadow-sm flex flex-col items-center justify-center p-12 cursor-pointer select-none transition-all duration-300 relative",
                flipped ? "bg-paper border-border" : "hover:border-primary/50 hover-lift"
              )}
              style={{ minHeight: '380px' }}
            >
              <div className="absolute top-6 left-8 right-8 flex justify-between items-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
                <span>{flipped ? 'Answer' : 'Question'}</span>
                {card.isNew && !flipped && <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-sm tracking-normal">New Card</span>}
              </div>
              
              <div className="flex-1 flex items-center justify-center w-full">
                {flipped ? (
                  <p className="text-xl text-ink leading-relaxed text-center whitespace-pre-wrap">{card.back}</p>
                ) : (
                  <h3 className="text-4xl font-heading font-medium text-ink leading-relaxed text-center whitespace-pre-wrap">{card.front}</h3>
                )}
              </div>
              
              {!flipped && <p className="absolute bottom-6 text-xs text-muted-foreground font-medium">Press <kbd className="font-data px-1.5 py-0.5 bg-secondary border rounded text-ink mx-1">Space</kbd> to reveal</p>}
            </div>

            {/* Footer Controls */}
            {flipped ? (
              <div className="grid grid-cols-4 gap-4">
                {RATINGS.map(r => (
                  <button
                    key={r.rating}
                    onClick={() => handleRate(r.rating)}
                    disabled={review.isPending}
                    className="group relative flex flex-col items-center justify-center h-24 bg-card border-2 border-b-4 border-border rounded-xl hover:bg-muted active:border-b-2 active:translate-y-[2px] transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <span className="text-base font-medium text-ink group-hover:text-primary transition-colors">
                      {review.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : r.label}
                    </span>
                    <span className="absolute bottom-3 text-[10px] font-data text-muted-foreground uppercase tracking-widest">
                      Press {r.shortcut}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex justify-center">
                <button 
                  onClick={() => setFlipped(true)} 
                  className="w-full max-w-md flex items-center justify-center h-16 bg-primary text-primary-foreground font-medium text-lg rounded-xl border-b-4 border-primary/50 hover:bg-primary/90 active:border-b-0 active:translate-y-[4px] transition-all"
                >
                  Reveal Answer
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="bg-card card-texture border rounded-xl shadow-lg p-0 max-w-sm overflow-hidden">
          <div className="px-6 py-5 border-b bg-paper">
            <DialogTitle className="text-lg font-heading font-medium text-ink">Study Settings</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">Configure your spaced repetition algorithm.</DialogDescription>
          </div>
          <div className="p-6 space-y-3 bg-card relative z-10">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">New cards per day</Label>
            <Input
              type="number" min={1} max={100}
              value={newCardsPerDay}
              onChange={e => setNewCardsPerDay(e.target.value)}
              className="bg-transparent border-border text-ink h-10 text-base font-data rounded-lg focus-visible:ring-1 focus-visible:ring-primary"
            />
            <p className="text-xs text-muted-foreground">Limits the number of unlearned cards introduced daily.</p>
          </div>
          <div className="px-6 py-4 border-t bg-paper flex justify-end gap-3">
            <Button variant="outline" onClick={() => setSettingsOpen(false)} className="bg-transparent border-border hover:bg-muted text-ink h-9 px-4 rounded-md">Cancel</Button>
            <Button onClick={saveSettings} disabled={updateSettings.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 rounded-md font-medium">
              {updateSettings.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
