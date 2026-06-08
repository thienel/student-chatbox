import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { FileText, Upload, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { useSubjectDocuments, useUploadDocument, useDeleteDocument } from './queries'
import { useAuthStore } from '@/store/useAuthStore'
import { cn } from '@/lib/utils'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const statusColor: Record<string, string> = {
  ready: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  processing: 'bg-zinc-900 text-zinc-500 border-zinc-800',
  failed: 'bg-red-950 text-red-400 border-red-900',
}

export default function SubjectDocumentsPage() {
  const { id: subjectId = '' } = useParams<{ id: string }>()
  const user = useAuthStore(s => s.user)
  const canUpload = user?.role === 'admin' || user?.role === 'lecturer'
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const { data: documents = [], isLoading } = useSubjectDocuments(subjectId)
  const upload = useUploadDocument(subjectId)
  const remove = useDeleteDocument(subjectId)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) upload.mutate(file)
    e.target.value = ''
  }

  const confirmingDoc = documents.find(d => d.id === confirmId)

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-medium text-zinc-50">Documents</h2>
          <p className="text-xs text-zinc-500 mt-0.5">{documents.length} files</p>
        </div>
        {canUpload && (
          <>
            <Button
              onClick={() => fileRef.current?.click()}
              disabled={upload.isPending}
              className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200 h-8 px-3 text-sm font-medium rounded-md"
            >
              {upload.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Upload className="h-4 w-4 mr-1.5" />
              )}
              Upload
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,.pptx"
              className="hidden"
              onChange={handleFileChange}
            />
          </>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg bg-zinc-900" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description={canUpload ? 'Upload PDF, DOCX, or PPTX files to get started.' : 'No documents have been uploaded for this subject.'}
          action={canUpload ? (
            <Button
              onClick={() => fileRef.current?.click()}
              className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200 h-8 px-3 text-sm font-medium rounded-md"
            >
              <Upload className="h-4 w-4 mr-1.5" />
              Upload first document
            </Button>
          ) : undefined}
        />
      ) : (
        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide">File</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden sm:table-cell">Size</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden md:table-cell">Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden lg:table-cell">Uploaded by</th>
                {canUpload && <th className="py-3 px-4 w-10" />}
              </tr>
            </thead>
            <tbody>
              {documents.map(doc => (
                <tr key={doc.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors duration-150">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-4 w-4 text-zinc-500 shrink-0" />
                      <span className="text-zinc-300 truncate max-w-[200px]">{doc.originalName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-zinc-500 text-xs hidden sm:table-cell">
                    {formatBytes(doc.fileSizeBytes)}
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <Badge className={cn('text-[10px] rounded capitalize', statusColor[doc.status] ?? statusColor['processing'])}>
                      {doc.status === 'processing' && <Loader2 className="h-2.5 w-2.5 animate-spin mr-1" />}
                      {doc.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-zinc-500 text-xs hidden lg:table-cell">
                    {doc.uploadedBy.fullName}
                  </td>
                  {canUpload && (
                    <td className="py-3 px-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={remove.isPending && confirmId === doc.id}
                        onClick={() => setConfirmId(doc.id)}
                        className="h-7 w-7 rounded-md text-zinc-600 hover:text-red-400 hover:bg-zinc-800"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog open={!!confirmId} onOpenChange={open => { if (!open) setConfirmId(null) }}>
        <AlertDialogContent className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-none p-0 max-w-md">
          <div className="px-5 py-4 border-b border-zinc-800">
            <AlertDialogTitle className="text-base font-semibold text-zinc-50">Delete document?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-zinc-400 mt-0.5">
              <span className="text-zinc-300 font-medium">{confirmingDoc?.originalName}</span> will be permanently deleted from the knowledge base. This cannot be undone.
            </AlertDialogDescription>
          </div>
          <AlertDialogFooter className="px-5 py-4 border-t border-zinc-800 flex justify-end gap-2">
            <AlertDialogCancel
              className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50 h-8 px-3 text-sm rounded-md"
              onClick={() => setConfirmId(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-950 text-red-400 border border-red-900 hover:bg-red-900 hover:text-red-300 h-8 px-3 text-sm rounded-md"
              onClick={() => {
                if (confirmId) remove.mutate(confirmId, { onSettled: () => setConfirmId(null) })
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
