import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  size?: 'sm' | 'lg'
}

export function EmptyState({ icon: Icon, title, description, action, size = 'lg' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className={cn(
        "flex items-center justify-center rounded-full bg-primary/5 text-primary",
        size === 'lg' ? "h-16 w-16 ring-8 ring-primary/5 mb-6" : "h-10 w-10 ring-4 ring-primary/5 mb-4"
      )}>
        <Icon className={size === 'lg' ? "h-8 w-8" : "h-5 w-5"} />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
