import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { FileText, Upload, Trash2, Loader2, Sparkles, FileArchive, FileIcon, CheckCircle2, AlertCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion } from 'framer-motion'
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
import { useSubjectDocuments, useUploadDocument, useDeleteDocument, useDocumentSummary } from './queries'
import { usePermission } from '@/store/useUserStore'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const statusConfig: Record<string, { color: string, icon: any, label: string }> = {
  ready: { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle2, label: 'Ready' },
  processing: { color: 'bg-primary/10 text-primary border-primary/20', icon: Loader2, label: 'Processing' },
  failed: { color: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertCircle, label: 'Failed' },
}

export default function SubjectDocumentsPage() {
  const { id: subjectId = '' } = useParams<{ id: string }>()
  const canUploadDocs = usePermission('document:create')
  const canDelete = usePermission('document:delete')
  const canSummarize = usePermission('ai:summarize-document')
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [summaryDoc, setSummaryDoc] = useState<{ id: string; name: string } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const canUpload = canUploadDocs
  const { data: documents = [], isLoading } = useSubjectDocuments(subjectId)
  const upload = useUploadDocument(subjectId)
  const remove = useDeleteDocument(subjectId)
  const summary = useDocumentSummary(subjectId, summaryDoc?.id ?? null)
  const hasActions = canDelete || canSummarize

  const handleFile = (file?: File) => {
    if (file) {
      upload.mutate(file)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0])
    e.target.value = ''
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!canUpload) return
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (!canUpload) return
    const file = e.dataTransfer.files?.[0]
    if (file && (file.name.endsWith('.pdf') || file.name.endsWith('.docx') || file.name.endsWith('.pptx'))) {
      handleFile(file)
    }
  }

  const confirmingDoc = documents.find(d => d.id === confirmId)

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-serif text-primary-ink tracking-tight mb-2">Knowledge Base</h2>
          <p className="text-sm font-mono text-muted-foreground">
            {documents.length} curated documents available for this subject.
          </p>
        </div>
      </div>

      {canUpload && (
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={cn(
            "mb-10 relative overflow-hidden bg-card border-2 border-dashed rounded-[2rem] p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300",
            isDragging 
              ? "border-primary bg-primary/5 scale-[1.02] shadow-xl" 
              : "border-border/60 hover:border-primary/40 hover:bg-muted/10"
          )}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          
          <div className={cn(
            "h-16 w-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300",
            isDragging ? "bg-primary text-white shadow-lg scale-110" : "bg-primary/10 text-primary"
          )}>
            {upload.isPending ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <Upload className="h-7 w-7" />
            )}
          </div>
          
          <h3 className="text-lg font-serif font-semibold text-foreground mb-1">
            {upload.isPending ? "Uploading document..." : isDragging ? "Drop document here" : "Click or drag to upload"}
          </h3>
          <p className="text-xs font-mono text-muted-foreground">
            Supported formats: PDF, DOCX, PPTX (Max 50MB)
          </p>
          
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.pptx"
            className="hidden"
            onChange={handleFileChange}
          />
        </motion.div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl bg-muted/50 border border-border/30" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="border border-border/50 bg-card rounded-3xl p-16 text-center shadow-sm">
          <div className="h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4 text-muted-foreground">
            <FileArchive className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-serif text-foreground mb-2">No documents yet</h3>
          <p className="text-sm font-sans text-muted-foreground">
            {canUpload ? 'Upload files above to build the knowledge base.' : 'No documents have been shared.'}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-[2rem] overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/20">
                <th className="text-left py-4 px-6 text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">Document Name</th>
                <th className="text-left py-4 px-6 text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest hidden sm:table-cell">Size</th>
                <th className="text-left py-4 px-6 text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest hidden md:table-cell">Status</th>
                <th className="text-left py-4 px-6 text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest hidden lg:table-cell">Uploaded by</th>
                {hasActions && <th className="py-4 px-6 w-28" />}
              </tr>
            </thead>
            <tbody>
              {documents.map(doc => {
                const StatusIcon = statusConfig[doc.status]?.icon || FileIcon
                return (
                  <tr key={doc.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors duration-200 group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <span className="text-foreground font-medium truncate max-w-[250px] font-serif">{doc.originalName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground text-xs font-mono hidden sm:table-cell">
                      {formatBytes(doc.fileSizeBytes)}
                    </td>
                    <td className="py-4 px-6 hidden md:table-cell">
                      <Badge className={cn('text-[9px] font-mono tracking-wider rounded-full px-2.5 py-0.5 border', statusConfig[doc.status]?.color ?? statusConfig['processing'].color)}>
                        <StatusIcon className={cn("h-3 w-3 mr-1.5", doc.status === 'processing' && "animate-spin")} />
                        {statusConfig[doc.status]?.label ?? doc.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground text-[11px] font-mono hidden lg:table-cell">
                      {doc.uploadedBy?.fullName ? `Prof. ${doc.uploadedBy.fullName.split(' ').pop()}` : 'Lecturer'}
                    </td>
                    {hasActions && (
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {canSummarize && doc.status === 'ready' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSummaryDoc({ id: doc.id, name: doc.originalName })}
                              title="AI summary"
                              className="h-8 w-8 rounded-full text-primary hover:text-primary-foreground hover:bg-primary transition-colors bg-primary/5"
                            >
                              <Sparkles className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={remove.isPending && confirmId === doc.id}
                              onClick={() => setConfirmId(doc.id)}
                              className="h-8 w-8 rounded-full text-destructive hover:text-white hover:bg-destructive transition-colors bg-destructive/5"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog open={!!confirmId} onOpenChange={open => { if (!open) setConfirmId(null) }}>
        <AlertDialogContent className="bg-card border-border/60 rounded-[2rem] shadow-2xl p-0 max-w-md overflow-hidden">
          <div className="px-8 py-6 border-b border-border/40 bg-destructive/5">
            <AlertDialogTitle className="text-xl font-serif text-destructive">Delete Document</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground font-sans mt-2">
              <span className="text-foreground font-medium">{confirmingDoc?.originalName}</span> will be permanently removed from the knowledge base. This action cannot be undone.
            </AlertDialogDescription>
          </div>
          <AlertDialogFooter className="px-8 py-5 flex justify-end gap-3 bg-card">
            <AlertDialogCancel
              className="rounded-full font-mono text-xs px-6 hover:bg-muted/50 border-0"
              onClick={() => setConfirmId(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full font-mono text-xs tracking-wider px-8 bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm"
              onClick={() => {
                if (confirmId) remove.mutate(confirmId, { onSettled: () => setConfirmId(null) })
              }}
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!summaryDoc} onOpenChange={open => { if (!open) setSummaryDoc(null) }}>
        <DialogContent className="bg-card border-border/60 rounded-[2rem] shadow-2xl p-0 max-w-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-border/40 bg-muted/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            <DialogTitle className="text-2xl font-serif text-primary-ink flex items-center gap-3 relative z-10">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              AI Summary
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-mono mt-3 truncate relative z-10">
              {summaryDoc?.name}
            </DialogDescription>
          </div>
          <div className="p-8 max-h-[60vh] overflow-y-auto bg-card">
            {summary.isLoading ? (
              <div className="flex flex-col items-center justify-center gap-4 py-10 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary/40" /> 
                <p className="font-mono text-xs">Analyzing document...</p>
              </div>
            ) : summary.isError ? (
              <div className="bg-destructive/5 rounded-2xl p-6 text-center">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
                <p className="text-sm text-destructive">{getErrorMessage(summary.error, 'Failed to generate summary.')}</p>
              </div>
            ) : summary.data ? (
              <div className="prose font-sans prose-sm max-w-none text-foreground prose-headings:font-serif prose-headings:text-primary-ink prose-a:text-primary">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary.data.summary}</ReactMarkdown>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
