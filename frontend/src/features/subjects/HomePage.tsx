import { useNavigate } from 'react-router-dom'
import { BookOpen, MessageSquare, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { useUserStore } from '@/store/useUserStore'
import { useSubjects } from '@/features/subjects/queries'
import { useChats } from '@/features/chat/queries'
import { AchievementStamp } from '@/components/ui/achievement-stamp'

export default function HomePage() {
  const user = useUserStore(s => s.user)
  const navigate = useNavigate()


  const { data: subjectsData, isLoading: subjectsLoading } = useSubjects({ limit: 6 })
  const { data: chats = [], isLoading: chatsLoading } = useChats()

  const subjects = subjectsData?.items ?? []
  const recentChats = chats.slice(0, 5)

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="mb-8 bg-card card-texture border rounded-xl p-6 shadow-sm relative overflow-hidden flex items-center justify-between">
        <div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <h1 className="text-4xl font-heading font-medium text-ink tracking-tight relative z-10">
            Welcome back, {user?.fullName?.split(' ')[0]}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 relative z-10">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="hidden sm:block relative z-10">
          {/* TODO: Integrate with real study stats endpoint (e.g. GET /study-stats)
              to fetch user's actual current streak instead of hardcoding '3'. */}
          <AchievementStamp value={3} label="DAY STREAK" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subjects */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Subjects</h2>
            <Button
              variant="ghost"
              onClick={() => navigate('/subjects')}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-transparent"
            >
              View all
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          {subjectsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg bg-muted" />
              ))}
            </div>
          ) : subjects.length === 0 ? (
            <div className="bg-card border rounded-lg p-2">
              <EmptyState size="sm" icon={BookOpen} title="No subjects yet" />
            </div>
          ) : (
            <div className="space-y-2">
              {subjects.map(s => (
                <div
                  key={s.id}
                  onClick={() => navigate(`/subjects/${s.id}/documents`)}
                  className="flex items-center gap-3 bg-card border rounded-lg px-4 py-3 hover:border-primary/50 hover-lift cursor-pointer"
                >
                  <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.code}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 ml-auto" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Chats */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Recent Chats</h2>
            <Button
              variant="ghost"
              onClick={() => navigate('/chats')}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-transparent"
            >
              View all
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          {chatsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg bg-muted" />
              ))}
            </div>
          ) : recentChats.length === 0 ? (
            <div className="bg-card border rounded-lg p-2">
              <EmptyState size="sm" icon={MessageSquare} title="No chats yet" />
            </div>
          ) : (
            <div className="space-y-2">
              {recentChats.map(chat => (
                <div
                  key={chat.id}
                  onClick={() => navigate(`/chats/${chat.id}`)}
                  className="flex items-center gap-3 bg-card border rounded-lg px-4 py-3 hover:border-primary/50 hover-lift cursor-pointer"
                >
                  <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center shrink-0">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{chat.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(chat.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 ml-auto" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
