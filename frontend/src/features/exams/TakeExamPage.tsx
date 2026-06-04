import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Clock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
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

  const submit = useSubmitAttempt(subjectId, examId)

  useEffect(() => {
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const handleSubmit = useCallback(async () => {
    try {
      await submit.mutateAsync({ attemptId, answers, timeSpentSecs: elapsed })
      navigate(`/exam-attempts/${attemptId}`)
    } catch {
      toast({ variant: 'destructive', description: 'Failed to submit exam.' })
    }
  }, [submit, attemptId, answers, elapsed, navigate, toast])

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-zinc-500">Exam session expired. Please start again.</p>
      </div>
    )
  }

  const { exam, questions } = state
  const total = questions.length
  const answered = Object.keys(answers).length
  const question = questions[currentIndex]

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-sm font-medium text-zinc-50">{exam.title}</h2>
          <p className="text-xs text-zinc-500 mt-0.5">{answered} / {total} answered</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <Clock className="h-3.5 w-3.5" />
          {formatTime(elapsed)}
        </div>
      </div>

      {/* Progress */}
      <div className="h-1 bg-zinc-800 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-zinc-50 rounded-full transition-all duration-300"
          style={{ width: `${(answered / total) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-4">
        <p className="text-xs text-zinc-600 mb-3">Question {currentIndex + 1} of {total}</p>
        <p className="text-sm font-medium text-zinc-50 leading-relaxed mb-5">{question.content}</p>
        <div className="space-y-2">
          {question.options.map(opt => (
            <button
              key={opt.key}
              onClick={() => setAnswers(a => ({ ...a, [question.id]: opt.key }))}
              className={cn(
                'w-full text-left px-4 py-3 rounded-md border text-sm transition-colors duration-150',
                answers[question.id] === opt.key
                  ? 'border-zinc-400 bg-zinc-800 text-zinc-50'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
              )}
            >
              <span className="font-medium mr-2 text-zinc-500">{opt.key}.</span>
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
          className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 h-8 px-3 text-sm rounded-md disabled:opacity-30"
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
                  ? 'bg-zinc-50 text-zinc-950'
                  : answers[q.id]
                  ? 'bg-zinc-700 text-zinc-200'
                  : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
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
            className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 h-8 px-3 text-sm rounded-md"
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submit.isPending}
            className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200 h-8 px-3 text-sm font-medium rounded-md"
          >
            {submit.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Submit
          </Button>
        )}
      </div>
    </div>
  )
}
