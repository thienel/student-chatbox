import { useNavigate } from 'react-router-dom'
import { BookOpen, MessageSquare, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { useAuthStore } from '@/store/useAuthStore'
import { useSubjects } from '@/features/subjects/queries'
import { useChats } from '@/features/chat/queries'
import { AchievementStamp } from '@/components/ui/achievement-stamp'

export default function HomePage() {
  const user = useAuthStore(s => s.user)
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
            <div className="flex flex-col">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="py-4 border-b border-border/50">
                  <Skeleton className="h-10 w-full rounded-sm bg-muted/50" />
                </div>
              ))}
            </div>
          ) : subjects.length === 0 ? (
            <div className="py-8 border-b border-border/50">
              <EmptyState size="sm" icon={BookOpen} title="No subjects yet" />
            </div>
          ) : (
            <div className="flex flex-col">
              {subjects.map(s => (
                <div
                  key={s.id}
                  onClick={() => navigate(`/subjects/${s.id}/documents`)}
                  className="group flex items-center gap-4 py-4 border-b border-border/50 hover:border-border cursor-pointer transition-colors"
                >
                  <div className="h-8 w-8 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{s.name}</p>
                    <p className="text-xs text-muted-foreground font-data uppercase tracking-wider mt-0.5">{s.code}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-primary shrink-0 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
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
            <div className="flex flex-col">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="py-4 border-b border-border/50">
                  <Skeleton className="h-10 w-full rounded-sm bg-muted/50" />
                </div>
              ))}
            </div>
          ) : recentChats.length === 0 ? (
            <div className="py-8 border-b border-border/50">
              <EmptyState size="sm" icon={MessageSquare} title="No chats yet" />
            </div>
          ) : (
            <div className="flex flex-col">
              {recentChats.map(chat => (
                <div
                  key={chat.id}
                  onClick={() => navigate(`/chats/${chat.id}`)}
                  className="group flex items-center gap-4 py-4 border-b border-border/50 hover:border-border cursor-pointer transition-colors"
                >
                  <div className="h-8 w-8 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{chat.title}</p>
                    <p className="text-xs text-muted-foreground font-data uppercase tracking-wider mt-0.5">
                      {new Date(chat.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-primary shrink-0 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
