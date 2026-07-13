import { useState, useLayoutEffect, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, RotateCcw, Shuffle, ChevronLeft, Brain, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { usePermission } from '@/store/useUserStore'
import { useSubjectClass } from '@/features/classes/ClassContext'
import type { Flashcard } from '@/types'
import { useFlashcardSet } from '@/api/queries/flashcards'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function FlashcardStudyPage() {
  const { id: subjectId = '', setId = '' } = useParams<{ id: string; setId: string }>()
  const navigate = useNavigate()
  const canStudy = usePermission('flashcard:study')
  const { basePath } = useSubjectClass()
  const { data, isLoading } = useFlashcardSet(subjectId, setId)

  // displayCards is initialized from data when first available and supports shuffle mutation
  const [displayCards, setDisplayCards] = useState<Flashcard[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  // useLayoutEffect syncs state from external data without triggering cascading renders
  useLayoutEffect(() => {
    if (!data?.cards) return
    setDisplayCards(data.cards)
    setIndex(0)
  }, [data?.cards])

  const cards = displayCards
  const total = cards.length
  const card = cards[index]

  const goNext = useCallback(() => {
    if (index >= total - 1 || isAnimating) return
    setFlipped(false)
    setIsAnimating(true)
    setTimeout(() => { setIndex(i => i + 1); setIsAnimating(false) }, 150)
  }, [index, total, isAnimating])

  const goPrev = useCallback(() => {
    if (index <= 0 || isAnimating) return
    setFlipped(false)
    setIsAnimating(true)
    setTimeout(() => { setIndex(i => i - 1); setIsAnimating(false) }, 150)
  }, [index, isAnimating])

  const toggleFlip = useCallback(() => {
    if (isAnimating) return
    setFlipped(f => !f)
  }, [isAnimating])

  const doShuffle = () => {
    setDisplayCards(c => shuffle(c))
    setIndex(0)
    setFlipped(false)
  }

  const doReset = () => {
    setDisplayCards(data?.cards ?? [])
    setIndex(0)
    setFlipped(false)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') { e.preventDefault(); toggleFlip() }
      if (e.code === 'ArrowRight') goNext()
      if (e.code === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleFlip, goNext, goPrev])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Skeleton className="h-64 w-full max-w-xl rounded-lg bg-muted" />
      </div>
    )
  }

  if (!data || total === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-6">
        <button
          onClick={() => navigate(`${basePath}/flashcards`)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 mb-8"
        >
          <ChevronLeft className="h-4 w-4" />
          {data?.set?.title ?? 'Flashcards'}
        </button>
        <EmptyState
          icon={Layers}
          title="No cards yet"
          description="This flashcard set is empty. Add some cards to start studying."
        />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(`${basePath}/flashcards`)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
        >
          <ChevronLeft className="h-4 w-4" />
          {data.set.title}
        </button>
        <div className="flex items-center gap-2">
          {canStudy && (
            <Button
              asChild
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-7 px-2.5 text-xs font-medium rounded-md"
            >
              <Link to={`${basePath}/flashcards/${setId}/study`}>
                <Brain className="h-3.5 w-3.5 mr-1.5" />
                Study (SRS)
              </Link>
            </Button>
          )}
          <button
            onClick={doShuffle}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 px-2 py-1 rounded-md hover:bg-secondary"
          >
            <Shuffle className="h-3.5 w-3.5" />
            Shuffle
          </button>
          <button
            onClick={doReset}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 px-2 py-1 rounded-md hover:bg-secondary"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums shrink-0">{index + 1} / {total}</span>
      </div>

      {/* Card */}
      <div
        className="relative cursor-pointer select-none group"
        style={{ perspective: '1200px' }}
        onClick={toggleFlip}
      >
        <div
          className="grid relative w-full"
          style={{
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '320px',
          }}
        >
          {/* Front */}
          <div
            style={{ gridArea: '1 / 1', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            className="w-full h-full bg-card card-texture border border-border/60 rounded-2xl flex flex-col p-8 hover:border-primary/40 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex-1 flex flex-col items-center justify-center">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-6">Question</p>
              <p className="text-lg md:text-xl font-medium text-foreground text-center leading-relaxed max-w-[85%]">{card?.front}</p>
            </div>
            <div className="mt-8 flex justify-center">
              <p className="text-xs text-muted-foreground/60 tracking-wide">Press Space to flip</p>
            </div>
          </div>
          {/* Back */}
          <div
            style={{
              gridArea: '1 / 1',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
            className="w-full h-full bg-secondary/30 card-texture border border-border/60 rounded-2xl flex flex-col p-8"
          >
            <div className="flex-1 flex flex-col items-center justify-center">
              <p className="text-[11px] font-semibold text-primary/70 uppercase tracking-[0.15em] mb-6">Answer</p>
              <p className="text-lg md:text-xl text-foreground text-center leading-relaxed max-w-[85%]">{card?.back}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <Button
          variant="outline"
          size="icon"
          onClick={goPrev}
          disabled={index <= 0}
          className="h-9 w-9 rounded-md border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={goNext}
          disabled={index >= total - 1}
          className="h-9 w-9 rounded-md border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-xs text-muted-foreground mt-4">← → to navigate</p>
    </div>
  )
}
