import { useState } from 'react'
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface BulkImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (records: { personalEmail: string; studentCode: string }[]) => Promise<void>
}

export function BulkImportDialog({ open, onOpenChange, onImport }: BulkImportDialogProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text')
  const [textInput, setTextInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleTextImport = async () => {
    setError('')
    if (!textInput.trim()) {
      setError('Please enter some data.')
      return
    }

    const lines = textInput.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    const records = []

    for (const line of lines) {
      const parts = line.split(',')
      if (parts.length >= 2) {
        records.push({
          personalEmail: parts[0].trim(),
          studentCode: parts[1].trim()
        })
      } else {
        setError(`Invalid format on line: "${line}". Expected "email, studentCode".`)
        return
      }
    }

    try {
      setIsSubmitting(true)
      await onImport(records)
      setTextInput('')
      onOpenChange(false)
    } catch (err) {
      // Error is handled by mutation onError
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
        
        // Skip header if it exists
        const startIndex = lines[0].toLowerCase().includes('email') ? 1 : 0
        const records = []

        for (let i = startIndex; i < lines.length; i++) {
          const parts = lines[i].split(',')
          if (parts.length >= 2) {
            records.push({
              personalEmail: parts[0].trim(),
              studentCode: parts[1].trim()
            })
          }
        }

        if (records.length === 0) {
          setError('No valid records found in the CSV.')
          return
        }

        setIsSubmitting(true)
        await onImport(records)
        onOpenChange(false)
      } catch (err) {
        setError('Failed to parse the file.')
      } finally {
        setIsSubmitting(false)
        // Reset file input
        e.target.value = ''
      }
    }
    reader.readAsText(file)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-border/50 bg-card rounded-[2rem]">
        <div className="p-8">
          <DialogTitle className="text-3xl font-serif text-primary-ink mb-2">Bulk Import</DialogTitle>
          <DialogDescription className="font-mono text-sm text-muted-foreground mb-8">
            Add multiple students to the allowlist at once.
          </DialogDescription>

          <div className="flex gap-2 mb-6 bg-muted/20 p-1.5 rounded-full w-fit border border-border/40">
            <button
              onClick={() => setActiveTab('text')}
              className={cn(
                "px-6 py-2.5 font-mono text-xs uppercase tracking-widest transition-all duration-300 rounded-full flex items-center gap-2",
                activeTab === 'text' ? "bg-card text-primary shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              Paste Text
            </button>
            <button
              onClick={() => setActiveTab('file')}
              className={cn(
                "px-6 py-2.5 font-mono text-xs uppercase tracking-widest transition-all duration-300 rounded-full flex items-center gap-2",
                activeTab === 'file' ? "bg-card text-primary shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Upload className="w-3.5 h-3.5" />
              CSV Upload
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm font-mono text-destructive">{error}</p>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                <p className="text-xs font-mono text-muted-foreground mb-2">Format: email, studentCode</p>
                <Textarea 
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="nguyenvana@gmail.com, SE123456&#10;tranvanb@yahoo.com, SE654321"
                  className="min-h-[200px] font-mono text-sm resize-none bg-card border-border/50 focus-visible:ring-primary rounded-xl p-4 leading-relaxed"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-full font-mono text-xs tracking-wider uppercase h-11 px-6">Cancel</Button>
                <Button 
                  onClick={handleTextImport} 
                  disabled={isSubmitting || !textInput.trim()}
                  className="rounded-full font-mono text-xs tracking-wider uppercase h-11 px-8 shadow-sm"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Import Records
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'file' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border/50 bg-muted/10 rounded-[2rem] p-12 text-center transition-colors hover:bg-muted/20 hover:border-primary/30 relative">
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleFileUpload}
                  disabled={isSubmitting}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="flex flex-col items-center gap-4 pointer-events-none">
                  <div className="p-4 bg-primary/10 rounded-full text-primary">
                    {isSubmitting ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
                  </div>
                  <div>
                    <p className="font-serif text-xl text-primary-ink mb-1">Click or drag CSV file</p>
                    <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Format: email, studentCode</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  )
}
