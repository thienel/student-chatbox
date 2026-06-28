import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ClipboardList, Sparkles, ChevronRight, Loader2, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/useAuthStore'
import { useSubjectClass } from '@/features/classes/ClassContext'
import { DocumentPicker } from '@/components/shared/DocumentPicker'
import { NeedClassNotice } from '@/features/classes/NeedClassNotice'
import { getErrorMessage } from '@/lib/errors'
import { useExams, useGenerateExam, useMyAttempts } from './queries'
import type { ExamDifficulty } from '@/types'

const difficultyLabel: Record<ExamDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

export default function SubjectExamsPage() {
  const { id: subjectId = '' } = useParams<{ id: string }>()
  const user = useAuthStore(s => s.user)
  const canGenerate = user?.permissions?.includes('ai:generate-exam')
  const { toast } = useToast()

  const [genOpen, setGenOpen] = useState(false)
  const [topic, setTopic] = useState('')
  const [questionCount, setQuestionCount] = useState('10')
  const [difficulty, setDifficulty] = useState<ExamDifficulty>('medium')
  const [documentIds, setDocumentIds] = useState<string[]>([])

  const { classId, isLecturer, needsClass } = useSubjectClass()
  const { data: exams = [], isLoading } = useExams(subjectId, classId)
  const generate = useGenerateExam(subjectId, classId)
  const { data: attempts = [] } = useMyAttempts()

  const examIds = new Set(exams.map(e => e.id))
  const examMap = new Map(exams.map(e => [e.id, e]))
  const subjectAttempts = attempts
    .filter(a => examIds.has(a.examId) && a.status === 'completed')
    .slice(0, 5)

  const handleGenerate = async () => {
    try {
      await generate.mutateAsync({
        topic: topic.trim() || undefined,
        questionCount: Number(questionCount),
        difficulty,
        documentIds: documentIds.length ? documentIds : undefined,
      })
      toast({ description: 'Exam generated.' })
      setGenOpen(false)
      setTopic('')
      setQuestionCount('10')
      setDifficulty('medium')
      setDocumentIds([])
    } catch (err) {
      toast({ variant: 'destructive', description: getErrorMessage(err, 'Failed to generate exam.') })
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-medium text-zinc-50">Exams</h2>
          <p className="text-xs text-zinc-500 mt-0.5">{exams.length} exams</p>
        </div>
        {canGenerate && (
          <Button
            onClick={() => setGenOpen(true)}
            className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200 h-8 px-3 text-sm font-medium rounded-md"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Generate
          </Button>
        )}
      </div>

      {isLecturer && needsClass ? (
        <NeedClassNotice noun="Exams" />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg bg-zinc-900" />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No exams"
          description={canGenerate ? 'Generate an exam from subject documents.' : 'No exams available yet.'}
          action={canGenerate ? (
            <Button
              onClick={() => setGenOpen(true)}
              className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200 h-8 px-3 text-sm font-medium rounded-md"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Generate first exam
            </Button>
          ) : undefined}
        />
      ) : (
        <div className="space-y-2">
          {exams.map(exam => (
            <Link
              key={exam.id}
              to={`/subjects/${subjectId}/exams/${exam.id}`}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center gap-3 group hover:border-zinc-700 transition-colors duration-150"
            >
              <div className="h-8 w-8 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
                <ClipboardList className="h-4 w-4 text-zinc-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-50 truncate">{exam.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {exam.questionCount} questions · {new Date(exam.createdAt).toLocaleDateString()}
                </p>
              </div>
              {exam.difficulty && (
                <Badge className="shrink-0 text-xs font-medium bg-zinc-800 text-zinc-400 border-zinc-700 rounded-md">
                  {difficultyLabel[exam.difficulty]}
                </Badge>
              )}
              <ChevronRight className="h-4 w-4 text-zinc-600 shrink-0 group-hover:text-zinc-400 transition-colors duration-150" />
            </Link>
          ))}
        </div>
      )}

      {subjectAttempts.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-3">
            <History className="h-3.5 w-3.5 text-zinc-500" />
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">My Recent Attempts</p>
          </div>
          <div className="space-y-2">
            {subjectAttempts.map(attempt => (
              <Link
                key={attempt.id}
                to={`/subjects/${subjectId}/exams/${attempt.examId}/result/${attempt.id}`}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-3.5 flex items-center gap-3 group hover:border-zinc-700 transition-colors duration-150"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-300 truncate">
                    {examMap.get(attempt.examId)?.title ?? 'Exam'}
                  </p>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    {new Date(attempt.completedAt ?? attempt.startedAt).toLocaleDateString()}
                    {attempt.timeSpentSecs ? ` · ${Math.round(attempt.timeSpentSecs / 60)} min` : ''}
                  </p>
                </div>
                {attempt.score != null && (
                  <Badge className="shrink-0 text-xs font-medium bg-zinc-800 text-zinc-300 border-zinc-700 rounded-md tabular-nums">
                    {Number(attempt.score).toFixed(1)} / 10
                  </Badge>
                )}
                <ChevronRight className="h-4 w-4 text-zinc-600 shrink-0 group-hover:text-zinc-400 transition-colors duration-150" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-none p-0 max-w-md">
          <div className="px-5 py-4 border-b border-zinc-800">
            <DialogTitle className="text-base font-semibold text-zinc-50">Generate Exam</DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 mt-0.5">
              AI will create questions from subject documents.
            </DialogDescription>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Topic (optional)</Label>
              <Input
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Design Patterns"
                className="bg-zinc-800 border-zinc-700 text-zinc-50 placeholder:text-zinc-600 h-9 text-sm rounded-md focus-visible:ring-1 focus-visible:ring-zinc-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Questions</Label>
                <Input
                  type="number"
                  value={questionCount}
                  onChange={e => setQuestionCount(e.target.value)}
                  min={1}
                  max={50}
                  className="bg-zinc-800 border-zinc-700 text-zinc-50 h-9 text-sm rounded-md focus-visible:ring-1 focus-visible:ring-zinc-600"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Difficulty</Label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as ExamDifficulty)}
                  className="w-full h-9 px-3 bg-zinc-800 border border-zinc-700 text-zinc-50 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-600"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
            <DocumentPicker
              subjectId={subjectId}
              value={documentIds}
              onChange={setDocumentIds}
            />
          </div>
          <div className="px-5 py-4 border-t border-zinc-800 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setGenOpen(false)}
              className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 h-8 px-3 text-sm rounded-md"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generate.isPending}
              className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200 h-8 px-3 text-sm font-medium rounded-md"
            >
              {generate.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Generate
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
