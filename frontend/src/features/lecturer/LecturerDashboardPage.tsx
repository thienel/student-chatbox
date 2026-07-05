import { useNavigate } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import {
  BookOpen, GraduationCap, Users, MessagesSquare, FileText,
  ArrowRight, Clock, AlertCircle, CheckCircle2, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { useUserStore } from '@/store/useUserStore'
import { useSubjects, subjectKeys } from '@/features/subjects/queries'
import { classesApi } from '@/api/endpoints/classes'
import { boardApi } from '@/api/endpoints/board'
import { subjectsApi } from '@/api/endpoints/subjects'
import { classKeys } from '@/features/classes/queries'
import { cn } from '@/lib/utils'

export default function LecturerDashboardPage() {
  const user = useUserStore(s => s.user)
  const navigate = useNavigate()

  // 1. Fetch subjects
  const { data: subjectsData, isLoading: subjectsLoading } = useSubjects({ limit: 50 })
  const subjects = subjectsData?.items ?? []

  // 2. Fetch classes for each subject
  const classQueries = useQueries({
    queries: subjects.map(s => ({
      queryKey: classKeys.list(s.id),
      queryFn: () => classesApi.list(s.id),
      enabled: subjects.length > 0,
    }))
  })
  const classesLoading = classQueries.some(q => q.isLoading)

  // 3. Fetch RAG documents for each subject
  const documentQueries = useQueries({
    queries: subjects.map(s => ({
      queryKey: subjectKeys.documents(s.id),
      queryFn: () => subjectsApi.getDocuments(s.id),
      enabled: subjects.length > 0,
    }))
  })
  const documentsLoading = documentQueries.some(q => q.isLoading)

  // Flatten active classes to fetch their board questions
  const allActiveClasses = classQueries.flatMap((q, index) => {
    const subject = subjects[index]
    const classesList = q.data ?? []
    return classesList.map(c => ({
      subjectId: subject.id,
      classId: c.id,
      className: c.name,
      subjectCode: subject.code,
      subjectName: subject.name,
    }))
  })

  // 4. Fetch open/active Q&A questions for all classes
  const boardQueries = useQueries({
    queries: allActiveClasses.map(c => ({
      queryKey: ['board-questions-unanswered', c.subjectId, c.classId],
      queryFn: () => boardApi.listQuestions(c.subjectId, c.classId, { status: 'active', limit: 10 }),
      enabled: allActiveClasses.length > 0,
    }))
  })
  const boardLoading = boardQueries.some(q => q.isLoading)

  // --- Aggregate Stats ---
  const totalSubjects = subjects.length
  const totalClasses = classQueries.reduce((acc, q) => acc + (q.data?.length ?? 0), 0)
  const totalStudents = classQueries.reduce((acc, q) => {
    const classesList = q.data ?? []
    return acc + classesList.reduce((sum, c) => sum + (c.studentCount ?? 0), 0)
  }, 0)

  const unansweredQuestions = boardQueries.flatMap((q, index) => {
    const classInfo = allActiveClasses[index]
    const questions = q.data?.items ?? []
    return questions.map(question => ({
      ...question,
      classInfo,
    }))
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const totalUnresolvedQna = unansweredQuestions.length

  const recentDocuments = documentQueries.flatMap((q, index) => {
    const subject = subjects[index]
    const docs = q.data ?? []
    return docs.map(d => ({
      ...d,
      subject,
    }))
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)

  const isDataLoading = subjectsLoading || classesLoading || documentsLoading || boardLoading

  return (
    <div className="max-w-7xl mx-auto px-8 py-10">
      {/* Header Banner */}
      <div className="mb-10 bg-card border border-border/50 rounded-3xl p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div>
          <h1 className="text-4xl font-serif text-primary-ink mb-2 relative z-10">
            Welcome, Professor {user?.fullName?.split(' ').pop()}
          </h1>
          <p className="text-sm text-muted-foreground font-mono relative z-10">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {/* Stat Card 1: Subjects */}
        <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">Subjects</p>
            {subjectsLoading ? (
              <Skeleton className="h-9 w-12 bg-muted rounded-lg" />
            ) : (
              <h3 className="text-3xl font-serif font-bold text-foreground">{totalSubjects}</h3>
            )}
          </div>
          <div className="h-12 w-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary">
            <BookOpen className="h-6 w-6" />
          </div>
        </div>

        {/* Stat Card 2: Classes */}
        <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">Classes</p>
            {isDataLoading ? (
              <Skeleton className="h-9 w-12 bg-muted rounded-lg" />
            ) : (
              <h3 className="text-3xl font-serif font-bold text-foreground">{totalClasses}</h3>
            )}
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-center text-amber-500">
            <GraduationCap className="h-6 w-6" />
          </div>
        </div>

        {/* Stat Card 3: Total Students */}
        <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">Students</p>
            {isDataLoading ? (
              <Skeleton className="h-9 w-12 bg-muted rounded-lg" />
            ) : (
              <h3 className="text-3xl font-serif font-bold text-foreground">{totalStudents}</h3>
            )}
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Stat Card 4: Unanswered Q&As */}
        <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">Open Q&A</p>
            {isDataLoading ? (
              <Skeleton className="h-9 w-12 bg-muted rounded-lg" />
            ) : (
              <h3 className={cn("text-3xl font-serif font-bold", totalUnresolvedQna > 0 ? "text-destructive" : "text-foreground")}>
                {totalUnresolvedQna}
              </h3>
            )}
          </div>
          <div className={cn(
            "h-12 w-12 rounded-2xl border flex items-center justify-center transition-colors",
            totalUnresolvedQna > 0
              ? "bg-destructive/5 border-destructive/10 text-destructive animate-pulse"
              : "bg-muted/35 border-border/40 text-muted-foreground"
          )}>
            <MessagesSquare className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Subjects & Classes List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground font-semibold">Your Subjects</h2>
            <Button
              variant="ghost"
              onClick={() => navigate('/lecturer/subjects')}
              className="text-xs font-mono hover:bg-muted"
            >
              All Subjects <ArrowRight className="h-3 w-3 ml-1.5" />
            </Button>
          </div>

          {subjectsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-3xl bg-muted/50 border border-border/30" />
              ))}
            </div>
          ) : subjects.length === 0 ? (
            <div className="border border-border/50 bg-card rounded-3xl p-16 text-center shadow-sm">
              <EmptyState icon={BookOpen} title="No Subjects Assigned" description="Contact an admin to assign you to a subject." />
            </div>
          ) : (
            <div className="space-y-4">
              {subjects.map((subject, index) => {
                const query = classQueries[index]
                const subjectClasses = query?.data ?? []
                return (
                  <div
                    key={subject.id}
                    className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                      <div>
                        <span className="inline-block text-[10px] font-mono font-bold tracking-widest uppercase bg-primary/10 text-primary px-2.5 py-0.5 rounded-full mb-2">
                          {subject.code}
                        </span>
                        <h3 className="text-xl font-serif font-semibold text-foreground group-hover:text-primary transition-colors">
                          {subject.name}
                        </h3>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/lecturer/subjects/${subject.id}/documents`)}
                        className="rounded-full font-mono text-xs hover:bg-primary hover:text-white shrink-0"
                      >
                        Enter Subject
                      </Button>
                    </div>

                    {query.isLoading ? (
                      <Skeleton className="h-10 w-full bg-muted/50 rounded-2xl" />
                    ) : subjectClasses.length === 0 ? (
                      <div className="text-xs text-muted-foreground font-mono bg-muted/20 rounded-2xl p-4 text-center border border-dashed border-border/60">
                        No classes created yet. Click below to start.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {subjectClasses.map(c => (
                          <div
                            key={c.id}
                            onClick={() => navigate(`/lecturer/subjects/${subject.id}/classes`)}
                            className="flex items-center gap-2 bg-muted/30 border border-border/40 hover:border-primary/40 rounded-full px-3 py-1.5 cursor-pointer text-xs font-mono hover:bg-card transition-colors"
                          >
                            <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-foreground font-medium">{c.name}</span>
                            <span className="text-[10px] text-muted-foreground">({c.studentCount ?? 0} students)</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Side: Q&A Board & RAG Status */}
        <div className="space-y-8">
          {/* Unanswered Q&As */}
          <div className="space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground font-semibold">Unresolved Questions</h2>
            {isDataLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-3xl bg-muted/50 border border-border/30" />
                ))}
              </div>
            ) : unansweredQuestions.length === 0 ? (
              <div className="border border-border/50 bg-card rounded-3xl p-8 text-center shadow-sm">
                <EmptyState size="sm" icon={MessagesSquare} title="Inbox Clean!" description="No unanswered questions in your classes." />
              </div>
            ) : (
              <div className="space-y-3 max-h-[30rem] overflow-y-auto pr-1">
                {unansweredQuestions.map(q => (
                  <div
                    key={q.id}
                    onClick={() => navigate(`/lecturer/subjects/${q.classInfo.subjectId}/board`)}
                    className="bg-card border border-border/50 rounded-3xl p-5 shadow-sm hover:border-primary/30 hover:shadow-md cursor-pointer transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="text-[9px] font-mono font-bold tracking-widest uppercase bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full shrink-0">
                        {q.classInfo.subjectCode} • {q.classInfo.className}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 shrink-0">
                        <Clock className="h-3 w-3" />
                        {new Date(q.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{q.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 font-sans leading-relaxed">{q.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RAG Documents */}
          <div className="space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground font-semibold">RAG Documents</h2>
            {documentsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-3xl bg-muted/50 border border-border/30" />
                ))}
              </div>
            ) : recentDocuments.length === 0 ? (
              <div className="border border-border/50 bg-card rounded-3xl p-8 text-center shadow-sm">
                <EmptyState size="sm" icon={FileText} title="No Documents" description="Upload RAG files inside subject panels." />
              </div>
            ) : (
              <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm divide-y divide-border/30">
                {recentDocuments.map(doc => (
                  <div key={doc.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate" title={doc.originalName}>
                        {doc.originalName}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        {doc.subject.code} • {(doc.fileSize / 1024).toFixed(0)} KB
                      </p>
                    </div>
                    <div>
                      {doc.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-mono bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold">
                          <CheckCircle2 className="h-3 w-3" /> Ready
                        </span>
                      ) : doc.status === 'failed' ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-mono bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-bold">
                          <AlertCircle className="h-3 w-3" /> Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold animate-pulse">
                          <Loader2 className="h-3 w-3 animate-spin" /> Processing
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
