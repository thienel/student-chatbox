import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Plus, Trash2, Loader2, ArrowLeft, ClipboardCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useSubjectClass } from '@/features/classes/ClassContext'
import { NeedClassNotice } from '@/features/classes/NeedClassNotice'
import { getErrorMessage } from '@/lib/errors'
import { useCreateOfficialExam } from './queries'
import type { OfficialQuestionInput } from '@/types'

const OPTION_KEYS = ['A', 'B', 'C', 'D'] as const

function blankQuestion(): OfficialQuestionInput {
  return {
    content: '',
    options: OPTION_KEYS.map(key => ({ key, text: '' })),
    correctAnswer: 'A',
    explanation: '',
    topic: '',
  }
}

export default function CreateOfficialExamPage() {
  const { id: subjectId = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { classId, isLecturer, needsClass } = useSubjectClass()
  const create = useCreateOfficialExam(subjectId)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('60')
  const [questions, setQuestions] = useState<OfficialQuestionInput[]>([blankQuestion()])

  const update = (i: number, patch: Partial<OfficialQuestionInput>) =>
    setQuestions(qs => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)))

  const updateOption = (qi: number, key: string, text: string) =>
    setQuestions(qs =>
      qs.map((q, idx) =>
        idx === qi
          ? { ...q, options: q.options.map(o => (o.key === key ? { ...o, text } : o)) }
          : q,
      ),
    )

  const valid =
    title.trim().length > 0 &&
    classId &&
    questions.length > 0 &&
    questions.every(q => q.content.trim() && q.options.every(o => o.text.trim()))

  const handleSubmit = async () => {
    if (!classId) return
    try {
      await create.mutateAsync({
        classId,
        title: title.trim(),
        description: description.trim() || undefined,
        durationMinutes: Number(durationMinutes) || 0,
        questions: questions.map(q => ({
          content: q.content.trim(),
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation?.trim() || undefined,
          topic: q.topic?.trim() || undefined,
        })),
      })
      toast({ description: 'Official exam created.' })
      navigate(`/subjects/${subjectId}/exams`)
    } catch (err) {
      toast({ variant: 'destructive', description: getErrorMessage(err, 'Failed to create exam.') })
    }
  }

  if (isLecturer && needsClass) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-6">
        <NeedClassNotice noun="Official exams" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <Link
        to={`/subjects/${subjectId}/exams`}
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to exams
      </Link>

      <div className="flex items-center gap-2 mb-6">
        <ClipboardCheck className="h-4 w-4 text-zinc-400" />
        <h2 className="text-base font-medium text-zinc-50">Create Official Exam</h2>
      </div>

      <div className="space-y-4 mb-6">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Title</Label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Midterm Exam"
            maxLength={500}
            className="bg-zinc-800 border-zinc-700 text-zinc-50 placeholder:text-zinc-600 h-9 text-sm rounded-md focus-visible:ring-1 focus-visible:ring-zinc-600"
          />
        </div>
        <div className="grid grid-cols-[1fr_140px] gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Description (optional)</Label>
            <Input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Covers chapters 1–4"
              className="bg-zinc-800 border-zinc-700 text-zinc-50 placeholder:text-zinc-600 h-9 text-sm rounded-md focus-visible:ring-1 focus-visible:ring-zinc-600"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Minutes</Label>
            <Input
              type="number"
              min={0}
              value={durationMinutes}
              onChange={e => setDurationMinutes(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-zinc-50 h-9 text-sm rounded-md focus-visible:ring-1 focus-visible:ring-zinc-600"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, qi) => (
          <div key={qi} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Question {qi + 1}</span>
              {questions.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuestions(qs => qs.filter((_, idx) => idx !== qi))}
                  className="h-6 w-6 rounded-md text-zinc-600 hover:text-red-400 hover:bg-zinc-800"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <Textarea
              value={q.content}
              onChange={e => update(qi, { content: e.target.value })}
              placeholder="Question text"
              className="bg-zinc-800 border-zinc-700 text-zinc-50 placeholder:text-zinc-600 text-sm rounded-md min-h-[60px] focus-visible:ring-1 focus-visible:ring-zinc-600"
            />
            <div className="space-y-2">
              {q.options.map(o => (
                <div key={o.key} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => update(qi, { correctAnswer: o.key })}
                    className={
                      'h-7 w-7 rounded-md text-xs font-medium shrink-0 border ' +
                      (q.correctAnswer === o.key
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600')
                    }
                    title={q.correctAnswer === o.key ? 'Correct answer' : 'Mark correct'}
                  >
                    {o.key}
                  </button>
                  <Input
                    value={o.text}
                    onChange={e => updateOption(qi, o.key, e.target.value)}
                    placeholder={`Option ${o.key}`}
                    className="bg-zinc-800 border-zinc-700 text-zinc-50 placeholder:text-zinc-600 h-8 text-sm rounded-md focus-visible:ring-1 focus-visible:ring-zinc-600"
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                value={q.topic ?? ''}
                onChange={e => update(qi, { topic: e.target.value })}
                placeholder="Topic (optional)"
                className="bg-zinc-800 border-zinc-700 text-zinc-50 placeholder:text-zinc-600 h-8 text-sm rounded-md focus-visible:ring-1 focus-visible:ring-zinc-600"
              />
              <Input
                value={q.explanation ?? ''}
                onChange={e => update(qi, { explanation: e.target.value })}
                placeholder="Explanation (optional)"
                className="bg-zinc-800 border-zinc-700 text-zinc-50 placeholder:text-zinc-600 h-8 text-sm rounded-md focus-visible:ring-1 focus-visible:ring-zinc-600"
              />
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        onClick={() => setQuestions(qs => [...qs, blankQuestion()])}
        className="mt-4 border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 h-8 px-3 text-sm rounded-md"
      >
        <Plus className="h-3.5 w-3.5 mr-1.5" /> Add question
      </Button>

      <div className="mt-6 flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => navigate(`/subjects/${subjectId}/exams`)}
          className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 h-8 px-3 text-sm rounded-md"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!valid || create.isPending}
          className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200 h-8 px-3 text-sm font-medium rounded-md"
        >
          {create.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
          Create exam
        </Button>
      </div>
    </div>
  )
}
