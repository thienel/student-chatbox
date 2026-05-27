import { useNavigate } from 'react-router-dom'
import { BookOpen, MessageSquare, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/useAuthStore'
import { useSubjects } from '@/features/subjects/queries'
import { useChats } from '@/features/chat/queries'

export default function HomePage() {
  const user = useAuthStore(s => s.user)
  const navigate = useNavigate()

  const { data: subjectsData, isLoading: subjectsLoading } = useSubjects({ limit: 6 })
  const { data: chats = [], isLoading: chatsLoading } = useChats()

  const subjects = subjectsData?.items ?? []
  const recentChats = chats.slice(0, 5)

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-zinc-50">
          Welcome back, {user?.fullName?.split(' ')[0]}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subjects */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">Subjects</h2>
            <Button
              variant="ghost"
              onClick={() => navigate('/subjects')}
              className="h-6 px-2 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-transparent"
            >
              View all
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          {subjectsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg bg-zinc-900" />
              ))}
            </div>
          ) : subjects.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-center">
              <BookOpen className="h-5 w-5 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">No subjects yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {subjects.map(s => (
                <div
                  key={s.id}
                  onClick={() => navigate(`/subjects/${s.id}/documents`)}
                  className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 hover:border-zinc-700 transition-colors duration-150 cursor-pointer"
                >
                  <div className="h-8 w-8 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4 text-zinc-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{s.name}</p>
                    <p className="text-xs text-zinc-500">{s.code}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-zinc-700 shrink-0 ml-auto" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Chats */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">Recent Chats</h2>
            <Button
              variant="ghost"
              onClick={() => navigate('/chats')}
              className="h-6 px-2 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-transparent"
            >
              View all
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          {chatsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg bg-zinc-900" />
              ))}
            </div>
          ) : recentChats.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-center">
              <MessageSquare className="h-5 w-5 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">No chats yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentChats.map(chat => (
                <div
                  key={chat.id}
                  onClick={() => navigate(`/chats/${chat.id}`)}
                  className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 hover:border-zinc-700 transition-colors duration-150 cursor-pointer"
                >
                  <div className="h-8 w-8 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-4 w-4 text-zinc-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{chat.title}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(chat.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-zinc-700 shrink-0 ml-auto" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
