import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon // Made optional and unused to keep simplicity without breaking existing usages
  title: string
  description?: string
  action?: React.ReactNode
  size?: 'sm' | 'lg'
}

export function EmptyState({ title, description, action, size = 'lg' }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", size === 'lg' ? "py-16" : "py-8")}>
      <p className="text-base text-gray-500">{title}</p>
      {description && (
        <p className="text-sm text-gray-400 mt-2 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
