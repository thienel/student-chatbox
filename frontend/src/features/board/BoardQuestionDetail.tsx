import { useState } from 'react'
import { ArrowLeft, ArrowBigUp, Pin, Trash2, Loader2, Send, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore, usePermission } from '@/store/useAuthStore'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import type { BoardQuestion } from '@/types'
import {
  useBoardAnswers, useCreateAnswer, useDeleteAnswer, usePinAnswer, useUpvoteAnswer,
  useUpvoteQuestion, useCloseQuestion, useDeleteQuestion,
} from './queries'

interface Props {
  subjectId: string
  classId: string
  question: BoardQuestion
  onBack: () => void
}

const statusBadge: Record<string, string> = {
  open: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  answered: 'bg-emerald-950 text-emerald-400 border-emerald-900',
  closed: 'bg-zinc-900 text-zinc-600 border-zinc-800',
}

export function BoardQuestionDetail({ subjectId, classId, question, onBack }: Props) {
  const { toast } = useToast()
  const user = useAuthStore(s => s.user)
  const isModerator = usePermission('class:manage')

  const answers = useBoardAnswers(subjectId, classId, question.id)
  const createAnswer = useCreateAnswer(subjectId, classId, question.id)
  const deleteAnswer = useDeleteAnswer(subjectId, classId, question.id)
  const pinAnswer = usePinAnswer(subjectId, classId, question.id)
  const upvoteAnswer = useUpvoteAnswer(subjectId, classId, question.id)
  const upvoteQuestion = useUpvoteQuestion(subjectId, classId)
  const closeQuestion = useCloseQuestion(subjectId, classId)
  const deleteQuestion = useDeleteQuestion(subjectId, classId)

  const [body, setBody] = useState('')

  const authorLabel = (authorId: string) => (authorId === user?.id ? 'You' : 'Member')
  const alreadyAnswered = (answers.data ?? []).some(a => a.authorId === user?.id)
  const canAnswer = question.status !== 'closed' && question.authorId !== user?.id && !alreadyAnswered

  const handlePost = async () => {
    if (!body.trim()) return
    try {
      await createAnswer.mutateAsync(body.trim())
      setBody('')
    } catch (err) {
      toast({ variant: 'destructive', description: getErrorMessage(err, 'Failed to post answer.') })
    }
  }

  const run = async (fn: () => Promise<unknown>, fail: string) => {
    try { await fn() } catch (err) { toast({ variant: 'destructive', description: getErrorMessage(err, fail) }) }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to board
      </button>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <div className="flex items-start gap-3">
          <button
            onClick={() => run(() => upvoteQuestion.mutateAsync(question.id), 'Failed to vote.')}
            className={cn('flex flex-col items-center text-xs shrink-0', question.isUpvotedByMe ? 'text-sky-400' : 'text-zinc-500 hover:text-zinc-300')}
          >
            <ArrowBigUp className={cn('h-5 w-5', question.isUpvotedByMe && 'fill-sky-400')} />
            <span className="tabular-nums">{question.upvoteCount}</span>
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-medium text-zinc-50">{question.title}</h2>
              <Badge className={cn('text-[10px] rounded capitalize', statusBadge[question.status])}>{question.status}</Badge>
            </div>
            <p className="text-sm text-zinc-300 mt-2 whitespace-pre-wrap">{question.body}</p>
            <p className="text-xs text-zinc-600 mt-2">{authorLabel(question.authorId)} · {new Date(question.createdAt).toLocaleDateString()}</p>
          </div>
          {isModerator && (
            <div className="flex items-center gap-1 shrink-0">
              {question.status !== 'closed' && (
                <Button variant="ghost" size="sm" onClick={() => run(() => closeQuestion.mutateAsync(question.id), 'Failed to close.')} className="h-7 px-2 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-md">
                  Close
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => run(async () => { await deleteQuestion.mutateAsync(question.id); onBack() }, 'Failed to delete.')} className="h-7 w-7 text-zinc-600 hover:text-red-400 hover:bg-zinc-800 rounded-md">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mt-6 mb-3">
        {question.answerCount} Answers
      </h3>

      {answers.isLoading ? (
        <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg bg-zinc-900" />)}</div>
      ) : (
        <div className="space-y-2">
          {(answers.data ?? []).map(a => (
            <div key={a.id} className={cn('bg-zinc-900 border rounded-lg p-4 flex items-start gap-3', a.isPinned ? 'border-emerald-900' : 'border-zinc-800')}>
              <button
                onClick={() => run(() => upvoteAnswer.mutateAsync(a.id), 'Failed to vote.')}
                className={cn('flex flex-col items-center text-xs shrink-0', a.isUpvotedByMe ? 'text-sky-400' : 'text-zinc-500 hover:text-zinc-300')}
              >
                <ArrowBigUp className={cn('h-5 w-5', a.isUpvotedByMe && 'fill-sky-400')} />
                <span className="tabular-nums">{a.upvoteCount}</span>
              </button>
              <div className="min-w-0 flex-1">
                {a.isPinned && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 mb-1">
                    <CheckCircle2 className="h-3 w-3" /> Pinned by lecturer
                  </span>
                )}
                <p className="text-sm text-zinc-200 whitespace-pre-wrap">{a.body}</p>
                <p className="text-xs text-zinc-600 mt-1.5">{authorLabel(a.authorId)} · {new Date(a.createdAt).toLocaleDateString()}</p>
              </div>
              {isModerator && (
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => run(() => pinAnswer.mutateAsync(a.id), 'Failed to pin.')} title={a.isPinned ? 'Unpin' : 'Pin'} className={cn('h-7 w-7 rounded-md hover:bg-zinc-800', a.isPinned ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300')}>
                    <Pin className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => run(() => deleteAnswer.mutateAsync(a.id), 'Failed to delete.')} className="h-7 w-7 text-zinc-600 hover:text-red-400 hover:bg-zinc-800 rounded-md">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {canAnswer && (
        <div className="mt-4 space-y-2">
          <Textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Write an answer…"
            maxLength={5000}
            className="bg-zinc-900 border-zinc-800 text-zinc-50 placeholder:text-zinc-600 text-sm rounded-md min-h-[80px] focus-visible:ring-1 focus-visible:ring-zinc-600"
          />
          <div className="flex justify-end">
            <Button onClick={handlePost} disabled={createAnswer.isPending || !body.trim()} className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200 h-8 px-3 text-sm rounded-md">
              {createAnswer.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
              Post answer
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
