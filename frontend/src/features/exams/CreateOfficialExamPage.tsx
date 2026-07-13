import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Plus, Trash2, Loader2, ArrowLeft, ClipboardCheck, Sparkles, AlertCircle } from 'lucide-react'
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useSubjectClass } from '@/features/classes/ClassContext'
import { NeedClassNotice } from '@/features/classes/NeedClassNotice'
import { DocumentPicker } from '@/components/shared/DocumentPicker'
import { getErrorMessage } from '@/lib/errors'
import { useCreateOfficialExam, useGenerateExamPreview } from '@/api/queries/exams'
import type { OfficialQuestionInput, ExamDifficulty } from '@/types'

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
  const { classId, isLecturer, needsClass, basePath } = useSubjectClass()
  const create = useCreateOfficialExam(subjectId)
  const generatePreview = useGenerateExamPreview(subjectId)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('60')
  const [questions, setQuestions] = useState<OfficialQuestionInput[]>([blankQuestion()])

  // AI generation dialog state
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [aiTopic, setAiTopic] = useState('')
  const [aiQuestionCount, setAiQuestionCount] = useState('10')
  const [aiDifficulty, setAiDifficulty] = useState<ExamDifficulty>('medium')
  const [aiDocumentIds, setAiDocumentIds] = useState<string[]>([])
  const [aiReplaceMode, setAiReplaceMode] = useState<'replace' | 'append'>('append')

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
      navigate(`${basePath}/exams`)
    } catch (err) {
      toast({ variant: 'destructive', description: getErrorMessage(err, 'Failed to create exam.') })
    }
  }

  const handleAiGenerate = async () => {
    try {
      const result = await generatePreview.mutateAsync({
        classId: classId ?? undefined,
        topic: aiTopic.trim() || undefined,
        questionCount: Number(aiQuestionCount),
        difficulty: aiDifficulty,
        documentIds: aiDocumentIds.length ? aiDocumentIds : undefined,
      })

      // Convert AI format (snake_case correct_answer) → form format
      const converted: OfficialQuestionInput[] = result.questions.map(q => ({
        content: q.content,
        options: q.options,
        correctAnswer: q.correct_answer,
        explanation: q.explanation ?? '',
        topic: q.topic ?? '',
      }))

      if (aiReplaceMode === 'replace') {
        setQuestions(converted)
      } else {
        // Remove trailing blank question if it's the only one and it's empty
        setQuestions(prev => {
          const isOnlyBlank =
            prev.length === 1 &&
            !prev[0].content.trim() &&
            prev[0].options.every(o => !o.text.trim())
          return isOnlyBlank ? converted : [...prev, ...converted]
        })
      }

      // Auto-fill title with AI topic if title is empty
      if (!title.trim() && aiTopic.trim()) {
        setTitle(`Đề thi: ${aiTopic.trim()}`)
      }

      toast({ description: `${converted.length} questions generated. Please review before saving.` })
      setAiDialogOpen(false)
    } catch (err) {
      toast({ variant: 'destructive', description: getErrorMessage(err, 'Failed to generate questions.') })
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
        to={`${basePath}/exams`}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to exams
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-medium text-foreground">Create Official Exam</h2>
        </div>
        {/* AI Generate button — only for users with generate-exam permission */}
        <Button
          variant="outline"
          onClick={() => setAiDialogOpen(true)}
          className="border bg-transparent text-violet-600 border-violet-200 hover:bg-violet-50 hover:text-violet-700 h-8 px-3 text-sm rounded-md flex items-center gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Generate with AI
        </Button>
      </div>

      <div className="space-y-4 mb-6">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Title</Label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Midterm Exam"
            maxLength={500}
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-9 text-sm rounded-md focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
        <div className="grid grid-cols-[1fr_140px] gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description (optional)</Label>
            <Input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Covers chapters 1–4"
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-9 text-sm rounded-md focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Minutes</Label>
            <Input
              type="number"
              min={0}
              value={durationMinutes}
              onChange={e => setDurationMinutes(e.target.value)}
              className="bg-secondary border-border text-foreground h-9 text-sm rounded-md focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* AI-generated questions hint */}
      {questions.some(q => q.explanation) && (
        <div className="flex items-start gap-2 bg-violet-50 border border-violet-200 rounded-lg px-4 py-3 mb-4">
          <AlertCircle className="h-4 w-4 text-violet-600 shrink-0 mt-0.5" />
          <p className="text-xs text-violet-700">
            AI-generated questions are pre-filled below. Please review each question and mark the correct answer before saving.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {questions.map((q, qi) => (
          <div key={qi} className="bg-card border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Question {qi + 1}</span>
              {questions.length > 1 && (
                <ConfirmDeleteDialog
                  title="Remove Question?"
                  description="Are you sure you want to remove this question from the draft?"
                  onConfirm={() => setQuestions(qs => qs.filter((_, idx) => idx !== qi))}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
              )}
            </div>
            <Textarea
              value={q.content}
              onChange={e => update(qi, { content: e.target.value })}
              placeholder="Question text"
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground text-sm rounded-md min-h-[60px] focus-visible:ring-1 focus-visible:ring-primary"
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
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-secondary text-muted-foreground border-border hover:border-muted-foreground')
                    }
                    title={q.correctAnswer === o.key ? 'Correct answer' : 'Mark correct'}
                  >
                    {o.key}
                  </button>
                  <Input
                    value={o.text}
                    onChange={e => updateOption(qi, o.key, e.target.value)}
                    placeholder={`Option ${o.key}`}
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-8 text-sm rounded-md focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                value={q.topic ?? ''}
                onChange={e => update(qi, { topic: e.target.value })}
                placeholder="Topic (optional)"
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-8 text-sm rounded-md focus-visible:ring-1 focus-visible:ring-primary"
              />
              <Input
                value={q.explanation ?? ''}
                onChange={e => update(qi, { explanation: e.target.value })}
                placeholder="Explanation (optional)"
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-8 text-sm rounded-md focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        onClick={() => setQuestions(qs => [...qs, blankQuestion()])}
        className="mt-4 border bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground h-8 px-3 text-sm rounded-md"
      >
        <Plus className="h-3.5 w-3.5 mr-1.5" /> Add question
      </Button>

      <div className="mt-6 flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => navigate(`${basePath}/exams`)}
          className="border bg-transparent text-muted-foreground hover:bg-secondary h-8 px-3 text-sm rounded-md"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!valid || create.isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-sm font-medium rounded-md"
        >
          {create.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
          Create exam
        </Button>
      </div>

      {/* AI Generate Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="bg-card border rounded-lg shadow-none p-0 max-w-md">
          <div className="px-5 py-4 border-b">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-violet-600" />
              <DialogTitle className="text-base font-semibold text-foreground">Generate Questions with AI</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              AI will draft questions from subject documents. You can review and edit them before saving.
            </DialogDescription>
          </div>
          <div className="p-5 space-y-4 min-w-0">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Topic (optional)</Label>
              <Input
                value={aiTopic}
                onChange={e => setAiTopic(e.target.value)}
                placeholder="e.g. Design Patterns, Chapter 3"
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-9 text-sm rounded-md focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Questions</Label>
                <Input
                  type="number"
                  value={aiQuestionCount}
                  onChange={e => setAiQuestionCount(e.target.value)}
                  min={1}
                  max={30}
                  className="bg-secondary border-border text-foreground h-9 text-sm rounded-md focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Difficulty</Label>
                <select
                  value={aiDifficulty}
                  onChange={e => setAiDifficulty(e.target.value as ExamDifficulty)}
                  className="w-full h-9 px-3 bg-secondary border border-border text-foreground text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
            <DocumentPicker
              subjectId={subjectId}
              value={aiDocumentIds}
              onChange={setAiDocumentIds}
            />
            {/* Replace or append choice — shown only when existing questions are present */}
            {questions.length > 0 && !(questions.length === 1 && !questions[0].content.trim()) && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Add to existing questions
                </Label>
                <div className="flex gap-2">
                  {(['append', 'replace'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setAiReplaceMode(mode)}
                      className={
                        'flex-1 h-8 rounded-md text-xs font-medium border transition-colors ' +
                        (aiReplaceMode === mode
                          ? 'bg-violet-50 text-violet-700 border-violet-300'
                          : 'bg-secondary text-muted-foreground border-border hover:border-muted-foreground')
                      }
                    >
                      {mode === 'append' ? 'Append' : 'Replace all'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="px-5 py-4 border-t flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setAiDialogOpen(false)}
              className="border bg-transparent text-muted-foreground hover:bg-secondary h-8 px-3 text-sm rounded-md"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAiGenerate}
              disabled={generatePreview.isPending}
              className="bg-violet-600 text-white hover:bg-violet-700 h-8 px-3 text-sm font-medium rounded-md"
            >
              {generatePreview.isPending
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Generating...</>
                : <><Sparkles className="h-3.5 w-3.5 mr-1.5" />Generate</>
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
