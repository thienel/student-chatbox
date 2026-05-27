import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-10 w-10 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
        <Icon className="h-5 w-5 text-zinc-500" />
      </div>
      <p className="text-sm font-medium text-zinc-300">{title}</p>
      {description && (
        <p className="text-xs text-zinc-500 mt-1 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
