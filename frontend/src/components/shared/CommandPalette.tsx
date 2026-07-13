import { useEffect, useState } from 'react'
import type { Chat } from '@/types'
import { useNavigate } from 'react-router-dom'
import { BookOpen, MessageSquare, Loader2, Search } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { useCommandPalette } from '@/hooks/useCommandPalette'
import { useDebounce } from '@/hooks/use-debounce'
import { useSubjects } from '@/api/queries/subjects'
import { useChats } from '@/api/queries/chats'
import { useUserStore } from '@/store/useUserStore'

export function CommandPalette() {
  const { isOpen, close, toggle } = useCommandPalette()
  const navigate = useNavigate()
  const user = useUserStore(s => s.user)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  // Fetch matching subjects when user types
  const { data: subjectsData, isFetching: subjectsFetching } = useSubjects(
    debouncedSearch ? { search: debouncedSearch, limit: 5 } : undefined,
  )

  // Fetch all chats once (list is usually small), filter locally
  const { data: allChats, isFetching: chatsFetching } = useChats()

  const matchedChats = debouncedSearch
    ? (allChats ?? []).filter(c =>
        c.title?.toLowerCase().includes(debouncedSearch.toLowerCase()),
      )
    : []

  const subjects = subjectsData?.items ?? []
  const isLoading = subjectsFetching || chatsFetching

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggle()
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [toggle])

  const go = (href: string) => {
    navigate(href)
    close()
    setSearch('')
  }

  const getSubjectHref = (subjectId: string) => {
    if (user?.roleName === 'lecturer') return `/lecturer/subjects/${subjectId}/classes`
    if (user?.roleName === 'admin') return `/admin/subjects`
    return `/subjects/${subjectId}/documents`
  }

  const getChatHref = (chat: Chat) => {
    return `/subjects/${chat.subjectId}/chat/${chat.id}`
  }

  const showEmpty = debouncedSearch && !isLoading && subjects.length === 0 && matchedChats.length === 0
  const showInitialHint = !debouncedSearch

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={v => {
        if (!v) {
          close()
          setSearch('')
        }
      }}
    >
      <CommandInput
        placeholder="Search subjects, chats..."
        value={search}
        onValueChange={setSearch}
        className="border-0 focus:ring-0 text-sm text-foreground placeholder:text-muted-foreground"
      />
      <CommandList className="max-h-96">
        {/* Loading indicator */}
        {isLoading && debouncedSearch && (
          <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Searching...</span>
          </div>
        )}

        {/* Empty state */}
        {showEmpty && (
          <CommandEmpty className="text-sm text-muted-foreground text-center py-6">
            No results found for &ldquo;{debouncedSearch}&rdquo;
          </CommandEmpty>
        )}

        {/* Subjects results */}
        {!isLoading && subjects.length > 0 && (
          <CommandGroup heading="Subjects">
            {subjects.map(subject => (
              <CommandItem
                key={subject.id}
                value={`subject-${subject.id}-${subject.name}-${subject.code}`}
                onSelect={() => go(getSubjectHref(subject.id))}
                className="flex items-center gap-2.5 cursor-pointer"
              >
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-foreground text-sm truncate">{subject.name}</span>
                  <span className="ml-2 text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                    {subject.code}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Chats results */}
        {!isLoading && matchedChats.length > 0 && (
          <>
            {subjects.length > 0 && <CommandSeparator />}
            <CommandGroup heading="Chats">
              {matchedChats.slice(0, 5).map(chat => (
                <CommandItem
                  key={chat.id}
                  value={`chat-${chat.id}-${chat.title}`}
                  onSelect={() => go(getChatHref(chat))}
                  className="flex items-center gap-2.5 cursor-pointer"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-foreground text-sm truncate">{chat.title ?? 'Untitled chat'}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Default navigation hints when no search input */}
        {showInitialHint && (
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => go('/home')} className="cursor-pointer">
              <BookOpen className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <span className="text-foreground">Home</span>
            </CommandItem>
            <CommandItem onSelect={() => go(user?.roleName === 'lecturer' ? '/lecturer/subjects' : '/subjects')} className="cursor-pointer">
              <BookOpen className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <span className="text-foreground">Subjects</span>
            </CommandItem>
            <CommandItem onSelect={() => go('/chats')} className="cursor-pointer">
              <MessageSquare className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <span className="text-foreground">My Chats</span>
            </CommandItem>
          </CommandGroup>
        )}

        {/* Footer hint */}
        {showInitialHint && (
          <div className="border-t border-border/50 px-4 py-2.5 flex items-center gap-2 text-[11px] text-muted-foreground">
            <Search className="h-3 w-3" />
            <span>Type to search subjects and chats…</span>
          </div>
        )}
      </CommandList>
    </CommandDialog>
  )
}
