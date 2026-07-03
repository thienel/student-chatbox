import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Clock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/errors'
import { useSubmitAttempt } from './queries'
import type { Question, ExamAttempt, Exam } from '@/types'

interface LocationState {
  attempt: ExamAttempt
  exam: Exam
  questions: Question[]
}

export default function TakeExamPage() {
  const { id: subjectId = '', examId = '', attemptId = '' } = useParams<{
    id: string
    examId: string
    attemptId: string
  }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const state = location.state as LocationState | null

  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(Date.now())
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout>>()
  // ref so the keyboard handler always reads fresh state without re-registering
  const currentIndexRef = useRef(0)
  currentIndexRef.current = currentIndex

  const questions = state?.questions ?? []
  const total = questions.length

  const submit = useSubmitAttempt(subjectId, examId)

  useEffect(() => {
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => () => clearTimeout(advanceTimerRef.current), [])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const handleSubmit = useCallback(async () => {
    try {
      await submit.mutateAsync({ attemptId, answers, timeSpentSecs: elapsed })
      navigate(`/subjects/${subjectId}/exams/${examId}/result/${attemptId}`)
    } catch (err) {
      toast({ variant: 'destructive', description: getErrorMessage(err, 'Failed to submit exam.') })
    }
  }, [submit, attemptId, answers, elapsed, navigate, subjectId, examId, toast])

  const handleAnswer = useCallback((questionId: string, optionKey: string, fromIndex: number) => {
    setAnswers(a => ({ ...a, [questionId]: optionKey }))
    if (fromIndex < total - 1) {
      clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = setTimeout(() => {
        setCurrentIndex(i => i === fromIndex ? i + 1 : i)
      }, 380)
    }
  }, [total])

  // Registered once — reads currentIndex via ref to avoid stale closures
  useEffect(() => {
    const qs = state?.questions ?? []
    const tot = qs.length

    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.repeat) return

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setCurrentIndex(i => Math.max(0, i - 1))
        return
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        setCurrentIndex(i => Math.min(tot - 1, i + 1))
        return
      }

      // 1-4 selects an answer. e.code is layout-independent; fall back to e.key.
      const m = /^(?:Digit|Numpad)([1-4])$/.exec(e.code)
      const n = m ? Number(m[1]) : e.key >= '1' && e.key <= '4' ? Number(e.key) : 0
      if (n < 1) return
      const idx = currentIndexRef.current
      const q = qs[idx]
      const opt = q?.options[n - 1]
      if (q && opt) {
        e.preventDefault()
        handleAnswer(q.id, opt.key, idx)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [state, handleAnswer])

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-muted-foreground">Exam session expired. Please start again.</p>
      </div>
    )
  }

  const { exam } = state
  const answered = Object.keys(answers).length
  const question = questions[currentIndex]

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-sm font-medium text-foreground">{exam.title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{answered} / {total} answered</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {formatTime(elapsed)}
        </div>
      </div>

      {/* Progress */}
      <div className="h-1 bg-secondary rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${(answered / total) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-card border rounded-lg p-6 mb-4">
        <p className="text-xs text-muted-foreground mb-3">Question {currentIndex + 1} of {total}</p>
        <p className="text-sm font-medium text-foreground leading-relaxed mb-5">{question.content}</p>
        <div className="space-y-2">
          {question.options.map((opt, i) => (
            <button
              key={opt.key}
              onClick={() => handleAnswer(question.id, opt.key, currentIndex)}
              className={cn(
                'w-full text-left px-4 py-3 rounded-md border text-sm transition-colors duration-150',
                answers[question.id] === opt.key
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-secondary text-muted-foreground hover:border-muted-foreground hover:text-foreground'
              )}
            >
              <span className="font-medium mr-2 text-muted-foreground">{i + 1}.</span>
              {opt.text}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="border bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground h-8 px-3 text-sm rounded-md disabled:opacity-30"
        >
          Previous
        </Button>

        <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-sm">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                'h-6 w-6 rounded text-xs font-medium transition-colors duration-150',
                i === currentIndex
                  ? 'bg-primary text-primary-foreground'
                  : answers[q.id]
                  ? 'bg-primary/20 text-primary'
                  : 'bg-secondary text-muted-foreground hover:bg-muted'
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {currentIndex < total - 1 ? (
          <Button
            variant="outline"
            onClick={() => setCurrentIndex(i => Math.min(total - 1, i + 1))}
            className="border bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground h-8 px-3 text-sm rounded-md"
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submit.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-sm font-medium rounded-md"
          >
            {submit.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Submit
          </Button>
        )}
      </div>

      <p className="text-center text-[11px] text-muted-foreground/50 mt-4">
        ← → navigate · 1–4 select answer
      </p>
    </div>
  )
}
