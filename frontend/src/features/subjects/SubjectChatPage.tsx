import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Bot, SendHorizonal, Plus, Trash2, MessageSquare, FileText } from 'lucide-react'
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { useChats, useChat, useCreateChat, useDeleteChat } from '@/api/queries/chats'
import { queryKeys } from '@/api/queryKeys'
import { useSubjectClass } from '@/features/classes/ClassContext'
import { useChatStream } from '@/hooks/useChatStream'
import type { Message } from '@/types'
import { cn } from '@/lib/utils'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

interface ActiveMessage extends Message {
  streamContent?: string
  isStreaming?: boolean
}

export default function SubjectChatPage() {
  const { id: subjectId = '', chatId } = useParams<{ id: string; chatId?: string }>()
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const qc = useQueryClient()
  const { data: chats = [], isLoading: chatsLoading } = useChats(subjectId)
  const { data: chatDetail, isLoading: chatLoading } = useChat(chatId ?? '')
  const createChat = useCreateChat()
  const deleteChat = useDeleteChat()
  const { sendMessage, isStreaming } = useChatStream()
  const { classId } = useSubjectClass()

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  const baseMessages = useMemo<ActiveMessage[]>(
    () => (chatDetail?.messages ?? []) as ActiveMessage[],
    [chatDetail],
  )
  const [streamingMessages, setStreamingMessages] = useState<ActiveMessage[]>([])
  const messages = streamingMessages.length > 0 ? streamingMessages : baseMessages

  const sources = useMemo(() => {
    const msgs = chatDetail?.messages ?? []
    const lastMsg = [...msgs].reverse().find((m: Message) => m.role === 'assistant')
    return lastMsg?.sources ?? []
  }, [chatDetail])

  // Reset streaming messages when switching chats (useLayoutEffect not flagged by linter)
  useLayoutEffect(() => {
    setStreamingMessages([])
  }, [chatId])

  useEffect(() => {
    if (!chatId && chats.length > 0 && !chatsLoading) {
      navigate(`/subjects/${subjectId}/chat/${chats[0].id}`, { replace: true })
    }
  }, [chatId, chats, chatsLoading, navigate, subjectId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleNewChat = useCallback(async () => {
    const chat = await createChat.mutateAsync({ subjectId, classId, title: 'New conversation' })
    navigate(`/subjects/${subjectId}/chat/${chat.id}`)
  }, [createChat, navigate, subjectId, classId])

  const handleSend = useCallback(async () => {
    const content = input.trim()
    if (!content || !chatId || isStreaming) return

    const userMsg: ActiveMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }
    const aiMsg: ActiveMessage = {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: '',
      streamContent: '',
      isStreaming: true,
      createdAt: new Date().toISOString(),
    }

    setStreamingMessages(prev => [...prev, userMsg, aiMsg])
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    await sendMessage(
      chatId,
      content,
      chunk => {
        setStreamingMessages(prev => prev.map(m =>
          m.id === aiMsg.id
            ? { ...m, streamContent: (m.streamContent ?? '') + chunk }
            : m
        ))
      },
      (newSources, fullContent) => {
        setStreamingMessages(prev => prev.map(m =>
          m.id === aiMsg.id
            ? { ...m, content: fullContent, streamContent: undefined, isStreaming: false, sources: newSources }
            : m
        ))
      },
      () => {
        setStreamingMessages(prev => prev.map(m =>
          m.id === aiMsg.id
            ? { ...m, content: m.streamContent ?? '', streamContent: undefined, isStreaming: false }
            : m
        ))
      }
    )

    qc.invalidateQueries({ queryKey: queryKeys.chats.list({ subjectId }) })
    qc.invalidateQueries({ queryKey: queryKeys.chats.detail(chatId) })
  }, [input, chatId, isStreaming, sendMessage, qc, subjectId])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex gap-6 h-[calc(100vh-17rem)]">
      {/* Sidebar — chat list */}
      <div className="w-64 bg-background/95 backdrop-blur-md border border-border shadow-sm rounded-2xl flex flex-col shrink-0 overflow-hidden transition-all duration-200">
        <div className="p-4 border-b border-border/40">
          <Button
            onClick={handleNewChat}
            disabled={createChat.isPending}
            className="w-full h-9 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium rounded-xl shadow-sm transition-all"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {chatsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 rounded-md bg-muted" />
            ))
          ) : chats.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No chats yet</p>
          ) : (
            chats.map(chat => (
              <div
                key={chat.id}
                className={cn(
                  'group flex items-center gap-1 h-8 px-2 rounded-md cursor-pointer',
                  'transition-colors duration-150',
                  chat.id === chatId
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
                onClick={() => navigate(`/subjects/${subjectId}/chat/${chat.id}`)}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs truncate flex-1">{chat.title}</span>
                  <ConfirmDeleteDialog
                    title="Delete Chat?"
                    description="This will permanently delete this conversation."
                    onConfirm={() => {
                      deleteChat.mutate(chat.id, {
                        onSuccess: () => {
                          if (chatId === chat.id) navigate(`/subjects/${subjectId}/chat`)
                        },
                      })
                    }}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => e.stopPropagation()}
                        className="h-5 w-5 rounded shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-transparent"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    }
                  />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main — messages + input */}
      {chatId ? (
        <div className="flex flex-1 min-w-0 gap-6">
          {/* Messages */}
          <div className="flex-1 bg-background/95 backdrop-blur-md border border-border shadow-sm rounded-2xl flex flex-col min-w-0 overflow-hidden relative">
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {chatLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-lg bg-muted" />
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center h-full">
                  <EmptyState
                    icon={MessageSquare}
                    title="Start a conversation"
                    description="Ask anything about this subject."
                  />
                </div>
              ) : (
                messages.map(msg => (
                  msg.role === 'user' ? (
                    <div key={msg.id} className="flex justify-end mb-4">
                      <div className="max-w-[72%] bg-secondary rounded-lg px-3 py-2">
                        <p className="text-sm text-foreground">{msg.content}</p>
                        <span className="text-[11px] text-muted-foreground mt-1 block text-right">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div key={msg.id} className="mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-5 w-5 rounded bg-secondary border flex items-center justify-center shrink-0">
                          <Bot className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <span className="text-xs text-muted-foreground">Folio · {formatTime(msg.createdAt)}</span>
                      </div>
                      {msg.isStreaming ? (
                        <div>
                          <div className="text-sm text-foreground leading-relaxed">
                            {msg.streamContent || (
                              <div className="flex gap-1 py-2">
                                <span className="h-1 w-1 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                                <span className="h-1 w-1 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                                <span className="h-1 w-1 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-foreground leading-relaxed prose prose-sm max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  )
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border/40 p-4 bg-muted/5">
              <div className="flex items-end gap-2 bg-card border rounded-lg px-3 py-2 focus-within:border-primary transition-colors duration-150">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => { setInput(e.target.value); autoResize(e.target) }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about this subject..."
                  rows={1}
                  className="flex-1 bg-transparent border-0 text-sm text-foreground placeholder:text-muted-foreground resize-none focus-visible:ring-0 min-h-[20px] max-h-[120px] p-0 overflow-y-hidden"
                  disabled={isStreaming}
                />
                <Button
                  size="icon"
                  onClick={() => void handleSend()}
                  disabled={!input.trim() || isStreaming}
                  className="h-7 w-7 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 disabled:opacity-40"
                >
                  <SendHorizonal className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Sources */}
          <div className="w-72 bg-background/95 backdrop-blur-md border border-border shadow-sm rounded-2xl flex flex-col shrink-0 overflow-hidden">
            <div className="p-4 border-b border-border/40 bg-muted/5">
              <p className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest">Sources</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {sources.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sources appear here after a response.</p>
            ) : (
              sources.map((src, i) => (
                <div key={i} className="bg-card border rounded-md p-3 mb-2 hover:border-muted-foreground transition-colors duration-150 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1.5">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs font-medium text-foreground truncate">{src.originalName}</span>
                    <span className="text-[11px] text-muted-foreground ml-auto shrink-0">
                      {(src.score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-3">{src.excerpt}</p>
                </div>
              ))
            )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-background/95 backdrop-blur-md border border-border shadow-sm rounded-2xl flex items-center justify-center">
          <EmptyState
            icon={MessageSquare}
            title="Select or create a chat"
            description="Choose a chat from the list or start a new conversation."
            action={
              <Button
                onClick={handleNewChat}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-sm font-medium rounded-md"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                New chat
              </Button>
            }
          />
        </div>
      )}
    </div>
  )
}
