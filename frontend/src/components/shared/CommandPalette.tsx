import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, MessageSquare } from 'lucide-react'
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

export function CommandPalette() {
  const { isOpen, close, toggle } = useCommandPalette()
  const navigate = useNavigate()

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
  }

  return (
    <CommandDialog open={isOpen} onOpenChange={v => !v && close()}>
      <CommandInput
        placeholder="Search subjects, chats..."
        className="border-0 focus:ring-0 text-sm text-zinc-50 placeholder:text-zinc-600"
      />
      <CommandList className="max-h-80">
        <CommandEmpty className="text-sm text-zinc-500 text-center py-6">
          No results found.
        </CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => go('/home')}>
            <BookOpen className="h-3.5 w-3.5 mr-2 text-zinc-500" />
            <span className="text-zinc-300">Home</span>
          </CommandItem>
          <CommandItem onSelect={() => go('/subjects')}>
            <BookOpen className="h-3.5 w-3.5 mr-2 text-zinc-500" />
            <span className="text-zinc-300">Subjects</span>
          </CommandItem>
          <CommandItem onSelect={() => go('/chats')}>
            <MessageSquare className="h-3.5 w-3.5 mr-2 text-zinc-500" />
            <span className="text-zinc-300">My Chats</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
      </CommandList>
    </CommandDialog>
  )
}
