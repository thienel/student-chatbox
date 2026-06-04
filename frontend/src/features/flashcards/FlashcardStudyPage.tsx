import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, RotateCcw, Shuffle, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Flashcard } from '@/types'
import { useFlashcardSet } from './queries'

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
  const { data, isLoading } = useFlashcardSet(subjectId, setId)

  const [cards, setCards] = useState<Flashcard[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (data?.cards) setCards(data.cards)
  }, [data])

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
    setCards(c => shuffle(c))
    setIndex(0)
    setFlipped(false)
  }

  const doReset = () => {
    if (data?.cards) setCards(data.cards)
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
        <Skeleton className="h-64 w-full max-w-xl rounded-lg bg-zinc-900" />
      </div>
    )
  }

  if (!data || total === 0) return null

  return (
    <div className="max-w-2xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(`/subjects/${subjectId}/flashcards`)}
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-50 transition-colors duration-150"
        >
          <ChevronLeft className="h-4 w-4" />
          {data.set.title}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={doShuffle}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors duration-150 px-2 py-1 rounded-md hover:bg-zinc-800"
          >
            <Shuffle className="h-3.5 w-3.5" />
            Shuffle
          </button>
          <button
            onClick={doReset}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors duration-150 px-2 py-1 rounded-md hover:bg-zinc-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-zinc-50 rounded-full transition-all duration-300"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
        <span className="text-xs text-zinc-500 tabular-nums shrink-0">{index + 1} / {total}</span>
      </div>

      {/* Card */}
      <div
        className="relative cursor-pointer select-none"
        style={{ perspective: '1200px' }}
        onClick={toggleFlip}
      >
        <div
          style={{
            transition: 'transform 0.45s cubic-bezier(0.4,0,0.2,1)',
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            position: 'relative',
            minHeight: '280px',
          }}
        >
          {/* Front */}
          <div
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            className="absolute inset-0 bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col items-center justify-center p-8 hover:border-zinc-700 transition-colors duration-150"
          >
            <p className="text-xs font-medium text-zinc-600 uppercase tracking-wide mb-4">Question</p>
            <p className="text-base font-medium text-zinc-50 text-center leading-relaxed">{card?.front}</p>
            <p className="text-xs text-zinc-600 mt-6">Press Space to flip</p>
          </div>
          {/* Back */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
            className="absolute inset-0 bg-zinc-800 border border-zinc-700 rounded-lg flex flex-col items-center justify-center p-8"
          >
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-4">Answer</p>
            <p className="text-base text-zinc-200 text-center leading-relaxed">{card?.back}</p>
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
          className="h-9 w-9 rounded-md border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50 disabled:opacity-30"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={goNext}
          disabled={index >= total - 1}
          className="h-9 w-9 rounded-md border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50 disabled:opacity-30"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-xs text-zinc-700 mt-4">← → to navigate</p>
    </div>
  )
}
