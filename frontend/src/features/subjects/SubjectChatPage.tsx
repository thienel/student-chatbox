import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Bot, SendHorizonal, Plus, Trash2, MessageSquare, FileText } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { useChats, useChat, useCreateChat, useDeleteChat, chatKeys } from '@/features/chat/queries'
import { useSubjectClass } from '@/features/classes/ClassContext'
import { useChatStream } from '@/hooks/useChatStream'
import type { Message, MessageSource } from '@/types'
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
  const [messages, setMessages] = useState<ActiveMessage[]>([])
  const [sources, setSources] = useState<MessageSource[]>([])
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

  useEffect(() => {
    if (chatDetail) {
      setMessages(chatDetail.messages)
      const msgs = chatDetail.messages
      const lastMsg = msgs.slice().reverse().find((m: Message) => m.role === 'assistant')
      setSources(lastMsg?.sources ?? [])
    } else {
      setMessages([])
      setSources([])
    }
  }, [chatDetail])

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

    setMessages(prev => [...prev, userMsg, aiMsg])
    setSources([])
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    await sendMessage(
      chatId,
      content,
      chunk => {
        setMessages(prev => prev.map(m =>
          m.id === aiMsg.id
            ? { ...m, streamContent: (m.streamContent ?? '') + chunk }
            : m
        ))
      },
      (newSources, fullContent) => {
        setMessages(prev => prev.map(m =>
          m.id === aiMsg.id
            ? { ...m, content: fullContent, streamContent: undefined, isStreaming: false, sources: newSources }
            : m
        ))
        setSources(newSources)
      },
      () => {
        setMessages(prev => prev.map(m =>
          m.id === aiMsg.id
            ? { ...m, content: m.streamContent ?? '', streamContent: undefined, isStreaming: false }
            : m
        ))
      }
    )

    qc.invalidateQueries({ queryKey: chatKeys.list(subjectId) })
  }, [input, chatId, isStreaming, sendMessage, qc, subjectId])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  return (
    <div className="flex h-[calc(100dvh-10.5rem)]">
      {/* Sidebar — chat list */}
      <div className="w-56 border-r border-zinc-800 flex flex-col shrink-0">
        <div className="p-3 border-b border-zinc-800">
          <Button
            onClick={handleNewChat}
            disabled={createChat.isPending}
            className="w-full h-8 bg-zinc-50 text-zinc-950 hover:bg-zinc-200 text-xs font-medium rounded-md"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {chatsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 rounded-md bg-zinc-900" />
            ))
          ) : chats.length === 0 ? (
            <p className="text-xs text-zinc-600 text-center py-4">No chats yet</p>
          ) : (
            chats.map(chat => (
              <div
                key={chat.id}
                className={cn(
                  'group flex items-center gap-1 h-8 px-2 rounded-md cursor-pointer',
                  'transition-colors duration-150',
                  chat.id === chatId
                    ? 'bg-zinc-800 text-zinc-50'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                )}
                onClick={() => navigate(`/subjects/${subjectId}/chat/${chat.id}`)}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs truncate flex-1">{chat.title}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={e => {
                    e.stopPropagation()
                    deleteChat.mutate(chat.id, {
                      onSuccess: () => {
                        if (chatId === chat.id) navigate(`/subjects/${subjectId}/chat`)
                      },
                    })
                  }}
                  className="h-5 w-5 rounded shrink-0 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 hover:bg-transparent"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main — messages + input */}
      {chatId ? (
        <div className="flex flex-1 min-w-0">
          {/* Messages */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {chatLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-lg bg-zinc-900" />
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
                      <div className="max-w-[72%] bg-zinc-800 rounded-lg px-3 py-2">
                        <p className="text-sm text-zinc-50">{msg.content}</p>
                        <span className="text-[11px] text-zinc-500 mt-1 block text-right">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div key={msg.id} className="mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-5 w-5 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                          <Bot className="h-3 w-3 text-zinc-400" />
                        </div>
                        <span className="text-xs text-zinc-500">EduChat · {formatTime(msg.createdAt)}</span>
                      </div>
                      {msg.isStreaming ? (
                        <div>
                          <div className="text-sm text-zinc-300 leading-relaxed">
                            {msg.streamContent || (
                              <div className="flex gap-1 py-2">
                                <span className="h-1 w-1 rounded-full bg-zinc-500 animate-bounce [animation-delay:0ms]" />
                                <span className="h-1 w-1 rounded-full bg-zinc-500 animate-bounce [animation-delay:150ms]" />
                                <span className="h-1 w-1 rounded-full bg-zinc-500 animate-bounce [animation-delay:300ms]" />
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-zinc-300 leading-relaxed prose prose-invert prose-sm max-w-none">
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
            <div className="border-t border-zinc-800 p-3">
              <div className="flex items-end gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 focus-within:border-zinc-700 transition-colors duration-150">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => { setInput(e.target.value); autoResize(e.target) }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about this subject..."
                  rows={1}
                  className="flex-1 bg-transparent border-0 text-sm text-zinc-50 placeholder:text-zinc-600 resize-none focus-visible:ring-0 min-h-[20px] max-h-[120px] p-0 overflow-y-hidden"
                  disabled={isStreaming}
                />
                <Button
                  size="icon"
                  onClick={() => void handleSend()}
                  disabled={!input.trim() || isStreaming}
                  className="h-7 w-7 rounded-md bg-zinc-50 text-zinc-950 hover:bg-zinc-200 shrink-0 disabled:opacity-40"
                >
                  <SendHorizonal className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Sources */}
          <div className="w-72 border-l border-zinc-800 overflow-y-auto p-3 shrink-0">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">Sources</p>
            {sources.length === 0 ? (
              <p className="text-xs text-zinc-600">Sources appear here after a response.</p>
            ) : (
              sources.map((src, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-md p-3 mb-2 hover:border-zinc-700 transition-colors duration-150 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1.5">
                    <FileText className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                    <span className="text-xs font-medium text-zinc-300 truncate">{src.originalName}</span>
                    <span className="text-[11px] text-zinc-600 ml-auto shrink-0">
                      {(src.score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-[12px] text-zinc-500 leading-relaxed line-clamp-3">{src.excerpt}</p>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={MessageSquare}
            title="Select or create a chat"
            description="Choose a chat from the list or start a new conversation."
            action={
              <Button
                onClick={handleNewChat}
                className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200 h-8 px-3 text-sm font-medium rounded-md"
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
