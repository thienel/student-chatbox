import { useState } from 'react'
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

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
    const errors = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const parts = line.split(',')
      if (parts.length >= 2) {
        const email = parts[0].trim()
        const code = parts[1].trim()
        
        // Basic validation
        if (!email || !code) {
          errors.push(`Dòng ${i + 1}: Thiếu email hoặc mã sinh viên.`)
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push(`Dòng ${i + 1}: Email "${email}" không đúng định dạng.`)
        } else {
          records.push({
            personalEmail: email,
            studentCode: code
          })
        }
      } else {
        errors.push(`Dòng ${i + 1}: Sai cấu trúc. Yêu cầu "email, studentCode".`)
      }
    }

    if (errors.length > 0) {
      setError(`All or nothing failed. Vui lòng sửa ${errors.length} lỗi sau:\n` + errors.slice(0, 5).join('\n') + (errors.length > 5 ? '\n...' : ''))
      return
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    const file = e.target.files?.[0]
    if (!file) return

    setIsSubmitting(true)

    try {
      let rows: string[][] = []

      // Check for Excel file extension or signature
      const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')

      if (isExcel) {
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' }) as string[][]
      } else {
        // Handle CSV with fallback encoding for ANSI (Vietnamese Excel CSVs)
        const readText = (): Promise<string> => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (evt) => {
              const text = evt.target?.result as string;
              // If we see replacement chars or the file starts with PK (zipped excel but wrongly named)
              if (text.includes('') && !text.startsWith('PK')) { 
                const fallbackReader = new FileReader();
                fallbackReader.onload = (evt2) => resolve(evt2.target?.result as string);
                fallbackReader.readAsText(file, 'windows-1258'); 
              } else {
                resolve(text);
              }
            };
            reader.onerror = reject;
            reader.readAsText(file, 'utf-8');
          });
        }

        const fileContent = await readText();
        
        // If it starts with PK, it's actually an excel file renamed to .csv
        if (fileContent.startsWith('PK')) {
          const arrayBuffer = await file.arrayBuffer()
          const workbook = XLSX.read(arrayBuffer, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' }) as string[][]
        } else {
          const parseResult = Papa.parse(fileContent, {
            header: false,
            skipEmptyLines: 'greedy',
          })
          rows = parseResult.data as string[][]
        }
      }

      if (rows.length === 0) {
        setError('File is empty.')
        setIsSubmitting(false)
        e.target.value = ''
        return
      }

      // Auto-detect columns
      let emailIdx = 0
      let codeIdx = 1
      let startIndex = 0
      
      const firstRow = rows[0].map(c => String(c)?.toLowerCase() || '')
      if (firstRow.some(c => c.includes('email') || c.includes('thư điện tử') || c.includes('code') || c.includes('mssv') || c.includes('sinh viên'))) {
        startIndex = 1
        const foundEmailIdx = firstRow.findIndex(c => c.includes('email') || c.includes('thư điện tử'))
        const foundCodeIdx = firstRow.findIndex(c => c.includes('code') || c.includes('mssv') || c.includes('sinh viên') || c.includes('student'))
        
        if (foundEmailIdx !== -1) emailIdx = foundEmailIdx
        if (foundCodeIdx !== -1) codeIdx = foundCodeIdx
      }

      const records: { personalEmail: string; studentCode: string }[] = []
      const parseErrors: string[] = []

      for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i]
        const email = String(row[emailIdx] || '').trim()
        const code = String(row[codeIdx] || '').trim()

        if (!email && !code) continue // skip entirely empty rows

        if (!email || !code) {
          parseErrors.push(`Dòng ${i + 1}: Thiếu dữ liệu email hoặc student code.`)
          continue
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          parseErrors.push(`Dòng ${i + 1}: Email "${email}" không đúng định dạng.`)
          continue
        }

        records.push({ personalEmail: email, studentCode: code })
      }

      if (parseErrors.length > 0) {
        setError(`All or nothing failed. Có ${parseErrors.length} lỗi:\n` + parseErrors.slice(0, 5).join('\n') + (parseErrors.length > 5 ? '\n...' : ''))
        setIsSubmitting(false)
        e.target.value = ''
        return
      }

      if (records.length === 0) {
        setError('Không tìm thấy dữ liệu hợp lệ trong file.')
        setIsSubmitting(false)
        e.target.value = ''
        return
      }

      try {
        await onImport(records)
        onOpenChange(false)
      } catch (err) {
          // API errors are handled by react query
      } finally {
        setIsSubmitting(false)
        e.target.value = ''
      }
    } catch (err: any) {
      setError('Lỗi đọc file: ' + err.message)
      setIsSubmitting(false)
      e.target.value = ''
    }
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
              File Upload
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-start gap-3 whitespace-pre-wrap">
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
                  placeholder="nguyenvana@gmail.com, SE123456\ntranvanb@yahoo.com, SE654321"
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
                  accept=".csv,.xlsx,.xls" 
                  onChange={handleFileUpload}
                  disabled={isSubmitting}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="flex flex-col items-center gap-4 pointer-events-none">
                  <div className="p-4 bg-primary/10 rounded-full text-primary">
                    {isSubmitting ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
                  </div>
                  <div>
                    <p className="font-serif text-xl text-primary-ink mb-1">Click or drag Excel/CSV file</p>
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
