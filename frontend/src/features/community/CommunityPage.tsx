import { useState } from 'react'
import { Star, Copy, Trophy, Layers, Loader2, Medal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import {
  useDiscoverFlashcards, useFlashcardLeaderboard, useToggleStar, useCloneFlashcardSet,
} from '@/features/flashcards/queries'

type Tab = 'discover' | 'leaderboard'

export default function CommunityPage() {
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>('discover')
  const [sort, setSort] = useState<'stars' | 'newest'>('stars')

  const discover = useDiscoverFlashcards({ sort })
  const leaderboard = useFlashcardLeaderboard()
  const toggleStar = useToggleStar()
  const clone = useCloneFlashcardSet()

  const handleStar = (setId: string, starred: boolean) =>
    toggleStar.mutate({ setId, starred })

  const handleClone = async (setId: string) => {
    try {
      await clone.mutateAsync(setId)
      toast({ description: 'Set cloned to your class.' })
    } catch (err) {
      toast({ variant: 'destructive', description: getErrorMessage(err, 'Failed to clone set.') })
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-foreground">Community Flashcards</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Discover and star sets shared by other students.</p>
      </div>

      <div className="flex items-center gap-1 border-b border-border mb-5">
        {(['discover', 'leaderboard'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex items-center gap-1.5 h-9 px-3 text-sm border-b-2 -mb-px capitalize transition-colors',
              tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t === 'discover' ? <Layers className="h-3.5 w-3.5" /> : <Trophy className="h-3.5 w-3.5" />}
            {t}
          </button>
        ))}
      </div>

      {tab === 'discover' ? (
        <>
          <div className="flex justify-end mb-3">
            <select
              value={sort}
              onChange={e => setSort(e.target.value as 'stars' | 'newest')}
              className="h-8 px-2 bg-card border-border text-foreground text-xs rounded-md focus:outline-none"
            >
              <option value="stars">Most starred</option>
              <option value="newest">Newest</option>
            </select>
          </div>
          {discover.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg bg-muted" />)}
            </div>
          ) : !discover.data || discover.data.items.length === 0 ? (
            <EmptyState icon={Layers} title="No public sets yet" description="Be the first to publish a flashcard set." />
          ) : (
            <div className="space-y-2">
              {discover.data.items.map(set => (
                <div key={set.id} className="bg-card border rounded-lg p-4 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center shrink-0">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{set.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {set.creatorName} · {set.subjectName} · {set.cardCount} cards
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStar(set.id, set.isStarredByMe)}
                    className={cn(
                      'h-8 px-2.5 text-xs rounded-md border-border bg-transparent hover:bg-secondary',
                      set.isStarredByMe ? 'text-primary' : 'text-muted-foreground',
                    )}
                  >
                    <Star className={cn('h-3.5 w-3.5 mr-1', set.isStarredByMe && 'fill-primary')} />
                    {set.starCount}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleClone(set.id)}
                    disabled={clone.isPending}
                    title="Clone to my class"
                    className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : leaderboard.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg bg-muted" />)}
        </div>
      ) : !leaderboard.data || leaderboard.data.items.length === 0 ? (
        <EmptyState icon={Trophy} title="No ranking yet" description="Publish sets and earn stars to climb the leaderboard." />
      ) : (
        <div className="space-y-1.5">
          {leaderboard.data.items.map(entry => (
            <div key={entry.userId} className="bg-card border rounded-lg px-4 py-2.5 flex items-center gap-3">
              <span className={cn(
                'w-7 text-sm tabular-nums text-center',
                entry.rank <= 3 ? 'text-lime-600 font-bold' : 'text-muted-foreground font-semibold',
              )}>
                {entry.rank}
              </span>
              <span className="text-sm text-foreground flex-1 truncate">{entry.fullName}</span>
              <span className="text-xs text-muted-foreground">{entry.totalPublicSets} sets</span>
              <Badge className={cn(
                'rounded-md text-xs tabular-nums',
                entry.rank <= 3 ? 'bg-lime-50 text-lime-700 border-lime-200' : 'bg-secondary text-primary border-border'
              )}>
                <Star className={cn('h-3 w-3 mr-1', entry.rank <= 3 ? 'fill-lime-600' : 'fill-primary')} />{entry.totalStars}
              </Badge>
            </div>
          ))}
          {leaderboard.data.myRank && (
            <div className="mt-3 bg-secondary/30 border border-border border-dashed rounded-lg px-4 py-2.5 flex items-center gap-3">
              <Medal className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground flex-1">
                Your rank: <span className="font-semibold">#{leaderboard.data.myRank.rank}</span>
              </span>
              <Badge className="bg-secondary text-primary border-border rounded-md text-xs tabular-nums">
                <Star className="h-3 w-3 mr-1 fill-primary" />{leaderboard.data.myRank.totalStars}
              </Badge>
            </div>
          )}
        </div>
      )}

      {(toggleStar.isPending || clone.isPending) && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
