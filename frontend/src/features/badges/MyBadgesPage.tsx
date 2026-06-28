import {
  Award, Footprints, Flame, Trophy, Layers, Share2, Star, Sparkles, Medal, HelpCircle, Pin,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/lib/utils'
import { useMyBadges } from './queries'

const ICONS: Record<string, typeof Award> = {
  footprints: Footprints,
  flame: Flame,
  trophy: Trophy,
  layers: Layers,
  share: Share2,
  star: Star,
  sparkles: Sparkles,
  medal: Medal,
  'help-circle': HelpCircle,
  pin: Pin,
}

function iconFor(key: string) {
  return ICONS[key] ?? Award
}

export default function MyBadgesPage() {
  const { data, isLoading } = useMyBadges()

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <div className="flex items-center gap-2 mb-1">
        <Award className="h-4 w-4 text-zinc-400" />
        <h1 className="text-lg font-semibold text-zinc-50">My Badges</h1>
      </div>
      <p className="text-xs text-zinc-500 mb-6">Earn badges by studying, sharing, and acing exams.</p>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg bg-zinc-900" />)}
        </div>
      ) : !data ? (
        <EmptyState icon={Award} title="No badges" description="Start studying to earn your first badge." />
      ) : (
        <>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
            Earned ({data.earned.length})
          </p>
          {data.earned.length === 0 ? (
            <p className="text-sm text-zinc-600 mb-6">No badges earned yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-8">
              {data.earned.map(b => {
                const Icon = iconFor(b.iconKey)
                return (
                  <div key={b.badgeId} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col items-center text-center">
                    <div className="h-10 w-10 rounded-full bg-amber-950 border border-amber-900 flex items-center justify-center mb-2">
                      <Icon className="h-5 w-5 text-amber-400" />
                    </div>
                    <p className="text-sm font-medium text-zinc-100">{b.name}</p>
                    <p className="text-[11px] text-zinc-600 mt-0.5">
                      {new Date(b.awardedAt).toLocaleDateString()}
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
            Locked ({data.locked.length})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {data.locked.map(b => {
              const Icon = iconFor(b.iconKey)
              return (
                <div key={b.badgeId} className={cn('bg-zinc-900/50 border border-zinc-800/70 rounded-lg p-4 flex flex-col items-center text-center')}>
                  <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center mb-2">
                    <Icon className="h-5 w-5 text-zinc-600" />
                  </div>
                  <p className="text-sm font-medium text-zinc-400">{b.name}</p>
                  <p className="text-[11px] text-zinc-600 mt-0.5">{b.description}</p>
                  {b.progress && (
                    <p className="text-[11px] text-zinc-500 mt-1 tabular-nums">{b.progress}</p>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
