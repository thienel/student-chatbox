import { useNavigate } from 'react-router-dom'
import { MessageSquare, Trash2 } from 'lucide-react'
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { useChats, useDeleteChat } from '@/api/queries/chats'

export default function ChatsPage() {
  const navigate = useNavigate()
  const { data: chats = [], isLoading } = useChats()
  const deleteChat = useDeleteChat()

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-medium text-ink tracking-tight">My Chats</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{chats.length} conversations</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg bg-muted" />
          ))}
        </div>
      ) : chats.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No chats yet"
          description="Open a subject and start a new conversation."
        />
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          {chats.map((chat, i) => (
            <div
              key={chat.id}
              className={`flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors duration-150 cursor-pointer group ${
                i < chats.length - 1 ? 'border-b border-border' : ''
              }`}
              onClick={() => navigate(`/chats/${chat.id}`)}
            >
              <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{chat.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(chat.updatedAt).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </p>
              </div>
              <ConfirmDeleteDialog
                title="Delete Chat?"
                description="This will permanently delete this conversation."
                onConfirm={() => deleteChat.mutate(chat.id)}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => e.stopPropagation()}
                    className="h-7 w-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
