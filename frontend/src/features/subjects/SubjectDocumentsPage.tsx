import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { FileText, Upload, Trash2, Loader2, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { useSubjectDocuments, useUploadDocument, useDeleteDocument, useDocumentSummary } from './queries'
import { usePermission } from '@/store/useUserStore'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const statusColor: Record<string, string> = {
  ready: 'bg-secondary text-muted-foreground border-border',
  processing: 'bg-muted text-muted-foreground border-border',
  failed: 'bg-destructive/10 text-destructive border-destructive/20',
}

export default function SubjectDocumentsPage() {
  const { id: subjectId = '' } = useParams<{ id: string }>()
  const canUploadDocs = usePermission('document:upload')
  const canDelete = usePermission('document:delete')
  const canSummarize = usePermission('ai:summarize-document')
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [summaryDoc, setSummaryDoc] = useState<{ id: string; name: string } | null>(null)

  const canUpload = canUploadDocs
  const { data: documents = [], isLoading } = useSubjectDocuments(subjectId)
  const upload = useUploadDocument(subjectId)
  const remove = useDeleteDocument(subjectId)
  const summary = useDocumentSummary(subjectId, summaryDoc?.id ?? null)
  const hasActions = canDelete || canSummarize

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
          <h2 className="text-base font-medium text-foreground">Documents</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{documents.length} files</p>
        </div>
        {canUpload && (
          <>
            <Button
              onClick={() => fileRef.current?.click()}
              disabled={upload.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-sm font-medium rounded-md"
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
            <Skeleton key={i} className="h-14 rounded-lg bg-muted" />
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
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-sm font-medium rounded-md"
            >
              <Upload className="h-4 w-4 mr-1.5" />
              Upload first document
            </Button>
          ) : undefined}
        />
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">File</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Size</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden md:table-cell">Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Uploaded by</th>
                {hasActions && <th className="py-3 px-4 w-24" />}
              </tr>
            </thead>
            <tbody>
              {documents.map(doc => (
                <tr key={doc.id} className="border-b hover:bg-muted/50 transition-colors duration-150">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-foreground truncate max-w-[200px]">{doc.originalName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs hidden sm:table-cell">
                    {formatBytes(doc.fileSizeBytes)}
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <Badge className={cn('text-[10px] rounded capitalize border', statusColor[doc.status] ?? statusColor['processing'])}>
                      {doc.status === 'processing' && <Loader2 className="h-2.5 w-2.5 animate-spin mr-1" />}
                      {doc.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs hidden lg:table-cell">
                    {doc.uploadedBy.fullName}
                  </td>
                  {hasActions && (
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        {canSummarize && doc.status === 'ready' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSummaryDoc({ id: doc.id, name: doc.originalName })}
                            title="AI summary"
                            className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={remove.isPending && confirmId === doc.id}
                            onClick={() => setConfirmId(doc.id)}
                            className="h-7 w-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog open={!!confirmId} onOpenChange={open => { if (!open) setConfirmId(null) }}>
        <AlertDialogContent className="bg-card border rounded-lg shadow-none p-0 max-w-md">
          <div className="px-5 py-4 border-b">
            <AlertDialogTitle className="text-base font-semibold text-foreground">Delete document?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground mt-0.5">
              <span className="text-foreground font-medium">{confirmingDoc?.originalName}</span> will be permanently deleted from the knowledge base. This cannot be undone.
            </AlertDialogDescription>
          </div>
          <AlertDialogFooter className="px-5 py-4 border-t flex justify-end gap-2">
            <AlertDialogCancel
              className="border bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground h-8 px-3 text-sm rounded-md"
              onClick={() => setConfirmId(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-8 px-3 text-sm rounded-md"
              onClick={() => {
                if (confirmId) remove.mutate(confirmId, { onSettled: () => setConfirmId(null) })
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!summaryDoc} onOpenChange={open => { if (!open) setSummaryDoc(null) }}>
        <DialogContent className="bg-card border rounded-lg shadow-none p-0 max-w-lg">
          <div className="px-5 py-4 border-b">
            <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-muted-foreground" /> Document Summary
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-0.5 truncate">{summaryDoc?.name}</DialogDescription>
          </div>
          <div className="p-5 max-h-[60vh] overflow-y-auto">
            {summary.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Generating summary…
              </div>
            ) : summary.isError ? (
              <p className="text-sm text-destructive">{getErrorMessage(summary.error, 'Failed to load summary.')}</p>
            ) : summary.data ? (
              <div className="prose font-serif prose-sm max-w-none text-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary.data.summary}</ReactMarkdown>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
