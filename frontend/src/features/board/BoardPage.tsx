import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { MessagesSquare, Plus, ArrowBigUp, MessageSquare, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { useToast } from '@/hooks/use-toast'
import { useSubjectClass } from '@/features/classes/ClassContext'
import { NeedClassNotice } from '@/features/classes/NeedClassNotice'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import type { BoardQuestion, BoardQuestionStatus } from '@/types'
import { useBoardQuestions, useCreateQuestion } from './queries'
import { BoardQuestionDetail } from './BoardQuestionDetail'

const statusBadge: Record<string, string> = {
  open: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  answered: 'bg-emerald-950 text-emerald-400 border-emerald-900',
  closed: 'bg-zinc-900 text-zinc-600 border-zinc-800',
}

export default function BoardPage() {
  const { id: subjectId = '' } = useParams<{ id: string }>()
  const { toast } = useToast()
  const { classId, isLecturer, needsClass } = useSubjectClass()

  const [status, setStatus] = useState<BoardQuestionStatus | 'all'>('all')
  const [selected, setSelected] = useState<BoardQuestion | null>(null)
  const [askOpen, setAskOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const questions = useBoardQuestions(subjectId, classId, {
    status: status === 'all' ? undefined : status,
    sort: 'upvotes',
  })
  const create = useCreateQuestion(subjectId, classId ?? '')

  if (isLecturer && needsClass) {
    return <div className="max-w-3xl mx-auto px-6 py-6"><NeedClassNotice noun="Question board" /></div>
  }
  if (!classId) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-6">
        <EmptyState icon={MessagesSquare} title="No class" description="Join a class to access its question board." />
      </div>
    )
  }

  if (selected) {
    return (
      <BoardQuestionDetail
        subjectId={subjectId}
        classId={classId}
        question={selected}
        onBack={() => { setSelected(null); questions.refetch() }}
      />
    )
  }

  const handleAsk = async () => {
    if (!title.trim() || !body.trim()) return
    try {
      await create.mutateAsync({ title: title.trim(), body: body.trim() })
      toast({ description: 'Question posted.' })
      setAskOpen(false); setTitle(''); setBody('')
    } catch (err) {
      toast({ variant: 'destructive', description: getErrorMessage(err, 'Failed to post question.') })
    }
  }

  const items = questions.data?.items ?? []

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-medium text-zinc-50">Question Board</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Ask and answer questions with your class.</p>
        </div>
        <Button onClick={() => setAskOpen(true)} className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200 h-8 px-3 text-sm font-medium rounded-md">
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Ask
        </Button>
      </div>

      <div className="flex items-center gap-1 mb-4">
        {(['all', 'open', 'answered', 'closed'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={cn(
              'h-7 px-2.5 text-xs rounded-md capitalize transition-colors',
              status === s ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300',
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {questions.isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg bg-zinc-900" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={MessagesSquare} title="No questions yet" description="Be the first to ask a question." />
      ) : (
        <div className="space-y-2">
          {items.map(q => (
            <button
              key={q.id}
              onClick={() => setSelected(q)}
              className="w-full text-left bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center gap-3 hover:border-zinc-700 transition-colors"
            >
              <div className="flex flex-col items-center text-xs text-zinc-500 shrink-0 w-8">
                <ArrowBigUp className={cn('h-4 w-4', q.isUpvotedByMe && 'fill-sky-400 text-sky-400')} />
                <span className="tabular-nums">{q.upvoteCount}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-50 truncate">{q.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5 truncate">{q.body}</p>
              </div>
              <span className="flex items-center gap-1 text-xs text-zinc-500 shrink-0">
                <MessageSquare className="h-3.5 w-3.5" />{q.answerCount}
              </span>
              <Badge className={cn('shrink-0 text-[10px] rounded capitalize', statusBadge[q.status])}>{q.status}</Badge>
            </button>
          ))}
        </div>
      )}

      <Dialog open={askOpen} onOpenChange={setAskOpen}>
        <DialogContent className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-none p-0 max-w-md">
          <div className="px-5 py-4 border-b border-zinc-800">
            <DialogTitle className="text-base font-semibold text-zinc-50">Ask a question</DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 mt-0.5">Your classmates and lecturer can answer.</DialogDescription>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} maxLength={200} placeholder="Short summary" className="bg-zinc-800 border-zinc-700 text-zinc-50 placeholder:text-zinc-600 h-9 text-sm rounded-md focus-visible:ring-1 focus-visible:ring-zinc-600" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Details</Label>
              <Textarea value={body} onChange={e => setBody(e.target.value)} maxLength={5000} placeholder="Explain your question…" className="bg-zinc-800 border-zinc-700 text-zinc-50 placeholder:text-zinc-600 text-sm rounded-md min-h-[100px] focus-visible:ring-1 focus-visible:ring-zinc-600" />
            </div>
          </div>
          <div className="px-5 py-4 border-t border-zinc-800 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAskOpen(false)} className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 h-8 px-3 text-sm rounded-md">Cancel</Button>
            <Button onClick={handleAsk} disabled={create.isPending || !title.trim() || !body.trim()} className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200 h-8 px-3 text-sm rounded-md">
              {create.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}Post
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
