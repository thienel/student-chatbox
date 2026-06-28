import { Check, FileText } from 'lucide-react'
import { useSubjectDocuments } from '@/features/subjects/queries'
import { cn } from '@/lib/utils'

/**
 * Multi-select over the subject's ready documents. An empty selection means
 * "use the whole knowledge base" (the backend treats documentIds=[] as no filter).
 */
export function DocumentPicker({
  subjectId,
  value,
  onChange,
}: {
  subjectId: string
  value: string[]
  onChange: (ids: string[]) => void
}) {
  const { data: documents = [] } = useSubjectDocuments(subjectId)
  const ready = documents.filter(d => d.status === 'ready')

  if (ready.length === 0) return null

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id])

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          Source documents
        </span>
        <span className="text-[11px] text-zinc-600">
          {value.length === 0 ? 'All documents' : `${value.length} selected`}
        </span>
      </div>
      <div className="space-y-1 max-h-40 overflow-y-auto rounded-md border border-zinc-800 p-1.5">
        {ready.map(doc => {
          const selected = value.includes(doc.id)
          return (
            <button
              key={doc.id}
              type="button"
              onClick={() => toggle(doc.id)}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-colors duration-150',
                selected ? 'bg-zinc-800 text-zinc-50' : 'text-zinc-400 hover:bg-zinc-800/50',
              )}
            >
              <span
                className={cn(
                  'h-4 w-4 rounded border flex items-center justify-center shrink-0',
                  selected ? 'bg-zinc-50 border-zinc-50' : 'border-zinc-700',
                )}
              >
                {selected && <Check className="h-3 w-3 text-zinc-950" />}
              </span>
              <FileText className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
              <span className="truncate">{doc.originalName}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
