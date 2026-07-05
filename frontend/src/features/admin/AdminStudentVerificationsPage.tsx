import { useState } from 'react'
import { ShieldCheck, UserCheck, UserX, FileQuestion, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

import {
  usePendingVerifications,
  useApproveVerification,
  useRejectVerification,
  useRequestMoreInfoVerification,
} from './queries'
import type { StudentVerificationRequest } from '@/types'

export default function AdminStudentVerificationsPage() {
  const { data: verifications = [], isLoading } = usePendingVerifications()
  
  const approveMutation = useApproveVerification()
  const rejectMutation = useRejectVerification()
  const requestInfoMutation = useRequestMoreInfoVerification()

  const [reviewItem, setReviewItem] = useState<StudentVerificationRequest | null>(null)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'request_info' | null>(null)
  const [reviewReason, setReviewReason] = useState('')

  const handleReviewSubmit = async () => {
    if (!reviewItem || !reviewAction) return
    
    if (reviewAction === 'approve') {
      await approveMutation.mutateAsync(reviewItem.id)
    } else if (reviewAction === 'reject') {
      await rejectMutation.mutateAsync({ id: reviewItem.id, reason: reviewReason })
    } else if (reviewAction === 'request_info') {
      await requestInfoMutation.mutateAsync({ id: reviewItem.id, reason: reviewReason })
    }

    setReviewItem(null)
    setReviewAction(null)
    setReviewReason('')
  }

  const isMutating = approveMutation.isPending || rejectMutation.isPending || requestInfoMutation.isPending

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <header className="mb-8 pb-6 border-b border-border flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-primary-ink mb-2">Student Verifications</h1>
          <p className="text-sm text-muted-foreground font-mono">
            {verifications.length} pending requests
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-none bg-muted/50 border border-border" />
          ))}
        </div>
      ) : verifications.length === 0 ? (
        <div className="border border-border bg-card p-12 text-center flex flex-col items-center">
          <ShieldCheck className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">No pending requests</p>
        </div>
      ) : (
        <div className="border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-4 px-5 text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">Applicant</th>
                <th className="text-left py-4 px-5 text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">Student ID & Campus</th>
                <th className="text-left py-4 px-5 text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left py-4 px-5 text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="w-24 py-4 px-5 text-right text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {verifications.map(item => (
                <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                  <td className="py-4 px-5">
                    <p className="text-foreground font-medium font-serif text-base">{item.user?.fullName || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{item.personalEmail}</p>
                  </td>
                  <td className="py-4 px-5">
                    <p className="text-sm font-mono">{item.studentCode}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{item.campus || 'N/A'}</p>
                  </td>
                  <td className="py-4 px-5">
                    <Badge variant="outline" className="text-[10px] rounded-none uppercase font-mono tracking-wider border-accent text-accent">
                      {item.status.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="py-4 px-5 text-muted-foreground text-xs font-mono">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-5 text-right">
                    <Button 
                      size="sm" 
                      className="rounded-none font-mono text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => setReviewItem(item)}
                    >
                      Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Verification Review Dialog */}
      <Dialog open={!!reviewItem} onOpenChange={v => !v && setReviewItem(null)}>
        <DialogContent className="bg-card border-border rounded-none shadow-xl max-w-2xl p-0">
          <div className="px-6 py-5 border-b border-border bg-muted/10">
            <DialogTitle className="text-xl font-serif text-primary-ink flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-accent" />
              Verification Request Review
            </DialogTitle>
          </div>
          
          {reviewItem && (
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Applicant Info</h3>
                  <div className="space-y-2 font-mono text-sm">
                    <p><span className="text-muted-foreground inline-block w-24">Name:</span> {reviewItem.user?.fullName || 'Unknown'}</p>
                    <p><span className="text-muted-foreground inline-block w-24">Login Email:</span> {reviewItem.user?.email || 'Unknown'}</p>
                    <p><span className="text-muted-foreground inline-block w-24">Contact:</span> {reviewItem.personalEmail}</p>
                    <p><span className="text-muted-foreground inline-block w-24">Student ID:</span> {reviewItem.studentCode}</p>
                    <p><span className="text-muted-foreground inline-block w-24">Campus:</span> {reviewItem.campus || 'N/A'}</p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Review Actions Panel */}
          <div className="p-6 border-t border-border bg-muted/5 space-y-4">
            {!reviewAction ? (
              <div className="flex gap-3">
                <Button 
                  onClick={() => setReviewAction('approve')}
                  className="flex-1 rounded-none font-mono tracking-wider bg-primary hover:bg-primary/90"
                >
                  <UserCheck className="w-4 h-4 mr-2" /> Approve
                </Button>
                <Button 
                  onClick={() => setReviewAction('request_info')}
                  variant="outline"
                  className="flex-1 rounded-none font-mono tracking-wider border-border"
                >
                  <FileQuestion className="w-4 h-4 mr-2" /> Request Info
                </Button>
                <Button 
                  onClick={() => setReviewAction('reject')}
                  variant="outline"
                  className="flex-1 rounded-none font-mono tracking-wider text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <UserX className="w-4 h-4 mr-2" /> Reject
                </Button>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div>
                  <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    {reviewAction === 'approve' ? 'Confirmation Note (Optional)' : 'Required Reason'}
                  </Label>
                  <Input 
                    value={reviewReason}
                    onChange={e => setReviewReason(e.target.value)}
                    placeholder={reviewAction === 'request_info' ? "E.g., Please upload a clearer photo of your ID." : ""}
                    className="mt-2 rounded-none font-mono text-sm border-border"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" className="rounded-none font-mono text-xs" onClick={() => {setReviewAction(null); setReviewReason('');}}>Cancel</Button>
                  <Button 
                    className={cn("rounded-none font-mono tracking-wider", reviewAction === 'reject' ? 'bg-destructive hover:bg-destructive/90 text-white' : '')}
                    onClick={handleReviewSubmit}
                    disabled={isMutating || (reviewAction !== 'approve' && !reviewReason.trim())}
                  >
                    {isMutating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Action'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
