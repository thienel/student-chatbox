import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SimplePaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function SimplePagination({ page, totalPages, onPageChange }: SimplePaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between mt-6 border-t pt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="text-xs h-8 gap-1"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Previous
      </Button>
      <span className="text-xs text-muted-foreground tabular-nums">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="text-xs h-8 gap-1"
      >
        Next
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
