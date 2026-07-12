import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ClipboardList, Sparkles, ChevronRight, Loader2, History, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { useToast } from '@/hooks/use-toast'
import { useUserStore } from '@/store/useUserStore'
import { useSubjectClass } from '@/features/classes/ClassContext'
import { DocumentPicker } from '@/components/shared/DocumentPicker'
import { NeedClassNotice } from '@/features/classes/NeedClassNotice'
import { getErrorMessage } from '@/lib/errors'
import { useExams, useGenerateExam, useMyAttempts } from '@/api/queries/exams'
import type { ExamDifficulty } from '@/types'

const difficultyLabel: Record<ExamDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

export default function SubjectExamsPage() {
  const { id: subjectId = '' } = useParams<{ id: string }>()
  const user = useUserStore(s => s.user)
  const { classId, isLecturer, needsClass, basePath } = useSubjectClass()
  const canGenerate = user?.permissions?.includes('ai:generate-exam') && !isLecturer
  const canCreateOfficial = user?.permissions?.includes('exam:create-official')
  const { toast } = useToast()

  const [genOpen, setGenOpen] = useState(false)
  const [topic, setTopic] = useState('')
  const [questionCount, setQuestionCount] = useState('10')
  const [difficulty, setDifficulty] = useState<ExamDifficulty>('medium')
  const [documentIds, setDocumentIds] = useState<string[]>([])

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
          <h2 className="text-base font-medium text-foreground">Exams</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{exams.length} exams</p>
        </div>
        <div className="flex items-center gap-2">
          {canCreateOfficial && (
            <Button
              asChild
              variant="outline"
              className="border bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground h-8 px-3 text-sm rounded-md"
            >
              <Link to={`${basePath}/exams/new`}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Create exam
              </Link>
            </Button>
          )}
          {canGenerate && (
            <Button
              onClick={() => setGenOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-sm font-medium rounded-md"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Generate
            </Button>
          )}
        </div>
      </div>

      {isLecturer && needsClass ? (
        <NeedClassNotice noun="Exams" />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg bg-muted" />
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
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-sm font-medium rounded-md"
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
              to={`${basePath}/exams/${exam.id}`}
              className="bg-card border rounded-lg p-4 flex items-center gap-3 group hover:border-primary/50 transition-colors duration-150"
            >
              <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center shrink-0">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{exam.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {exam.questionCount} questions · {new Date(exam.createdAt).toLocaleDateString()}
                </p>
              </div>
              {exam.type === 'official' ? (
                <Badge className="shrink-0 text-xs font-medium bg-emerald-50 text-emerald-700 border-emerald-200 rounded-md">
                  Official
                </Badge>
              ) : (
                <Badge className="shrink-0 text-xs font-medium bg-secondary text-muted-foreground border-border rounded-md">
                  AI
                </Badge>
              )}
              {exam.difficulty && (
                <Badge className="shrink-0 text-xs font-medium bg-secondary text-muted-foreground border-border rounded-md">
                  {difficultyLabel[exam.difficulty]}
                </Badge>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors duration-150" />
            </Link>
          ))}
        </div>
      )}

      {subjectAttempts.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-3">
            <History className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">My Recent Attempts</p>
          </div>
          <div className="space-y-2">
            {subjectAttempts.map(attempt => (
              <Link
                key={attempt.id}
                to={`${basePath}/exams/${attempt.examId}/result/${attempt.id}`}
                className="bg-card border rounded-lg p-3.5 flex items-center gap-3 group hover:border-primary/50 transition-colors duration-150"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground truncate">
                    {examMap.get(attempt.examId)?.title ?? 'Exam'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(attempt.completedAt ?? attempt.startedAt).toLocaleDateString()}
                    {attempt.timeSpentSecs ? ` · ${Math.round(attempt.timeSpentSecs / 60)} min` : ''}
                  </p>
                </div>
                {attempt.score != null && (
                  <Badge className="shrink-0 text-xs font-medium bg-secondary text-foreground border-border rounded-md tabular-nums">
                    {Number(attempt.score).toFixed(1)} / 10
                  </Badge>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors duration-150" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent className="bg-card border rounded-lg shadow-none p-0 max-w-md">
          <div className="px-5 py-4 border-b">
            <DialogTitle className="text-base font-semibold text-foreground">Generate Exam</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-0.5">
              AI will create questions from subject documents.
            </DialogDescription>
          </div>
          <div className="p-5 space-y-4 min-w-0">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Topic (optional)</Label>
              <Input
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Design Patterns"
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground h-9 text-sm rounded-md focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Questions</Label>
                <Input
                  type="number"
                  value={questionCount}
                  onChange={e => setQuestionCount(e.target.value)}
                  min={1}
                  max={50}
                  className="bg-secondary border-border text-foreground h-9 text-sm rounded-md focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Difficulty</Label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as ExamDifficulty)}
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
              value={documentIds}
              onChange={setDocumentIds}
            />
          </div>
          <div className="px-5 py-4 border-t flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setGenOpen(false)}
              className="border bg-transparent text-muted-foreground hover:bg-secondary h-8 px-3 text-sm rounded-md"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generate.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-sm font-medium rounded-md"
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
