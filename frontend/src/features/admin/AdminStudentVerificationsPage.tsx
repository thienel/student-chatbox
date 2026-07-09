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
  usePendingVerifications, useApproveVerification,
  useRejectVerification, useRequestMoreInfoVerification
} from '@/api/queries/users'
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
    <div className="max-w-7xl mx-auto px-8 py-10">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif text-primary-ink mb-2">Student Verifications</h1>
          <p className="text-sm text-muted-foreground font-mono">
            {verifications.length} pending requests
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl bg-muted/50 border border-border/30" />
          ))}
        </div>
      ) : verifications.length === 0 ? (
        <div className="border border-border/50 bg-card rounded-3xl p-16 text-center flex flex-col items-center shadow-sm">
          <div className="p-4 bg-muted/30 rounded-full mb-4">
            <ShieldCheck className="w-12 h-12 text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">No pending requests</p>
        </div>
      ) : (
        <div className="border border-border/50 bg-card rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  <th className="text-left py-5 px-6 text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Applicant</th>
                  <th className="text-left py-5 px-6 text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Student ID & Campus</th>
                  <th className="text-left py-5 px-6 text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left py-5 px-6 text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="w-24 py-5 px-6 text-right text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {verifications.map(item => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="py-4 px-6">
                      <p className="text-foreground font-medium font-serif text-lg">{item.user?.fullName || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-1">{item.personalEmail}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm font-semibold font-mono text-foreground">{item.studentCode}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-1">{item.campus || 'N/A'}</p>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant="outline" className="text-[10px] rounded-full uppercase font-mono tracking-wider border-accent text-accent px-3 py-1 bg-accent/5">
                        {item.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground text-sm font-mono">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button 
                        size="sm" 
                        className="rounded-full font-mono text-xs tracking-wider px-5 shadow-sm opacity-90 group-hover:opacity-100 transition-opacity"
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
        </div>
      )}

      {/* Manual Verification Review Dialog */}
      <Dialog open={!!reviewItem} onOpenChange={v => !v && setReviewItem(null)}>
        <DialogContent className="bg-card border border-border/60 rounded-[2rem] shadow-xl max-w-2xl p-0 overflow-hidden">
          <div className="px-8 py-6 border-b border-border/40 bg-muted/10">
            <DialogTitle className="text-2xl font-serif text-primary-ink flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-full">
                <ShieldCheck className="h-6 w-6 text-accent" />
              </div>
              Verification Request Review
            </DialogTitle>
          </div>
          
          {reviewItem && (
            <div className="p-8">
              <div className="space-y-8">
                <div className="bg-muted/5 p-6 rounded-2xl border border-border/40">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">Applicant Info</h3>
                  <div className="space-y-3 font-mono text-sm">
                    <p><span className="text-muted-foreground inline-block w-32">Name:</span> <span className="font-semibold text-foreground">{reviewItem.user?.fullName || 'Unknown'}</span></p>
                    <p><span className="text-muted-foreground inline-block w-32">Login Email:</span> {reviewItem.user?.email || 'Unknown'}</p>
                    <p><span className="text-muted-foreground inline-block w-32">Contact:</span> {reviewItem.personalEmail}</p>
                    <p><span className="text-muted-foreground inline-block w-32">Student ID:</span> <span className="font-semibold text-foreground">{reviewItem.studentCode}</span></p>
                    <p><span className="text-muted-foreground inline-block w-32">Campus:</span> {reviewItem.campus || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Review Actions Panel */}
          <div className="p-8 border-t border-border/40 bg-muted/10 space-y-5">
            {!reviewAction ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => setReviewAction('approve')}
                  className="flex-1 rounded-full font-mono tracking-wider h-11 shadow-sm hover:-translate-y-0.5 transition-transform"
                >
                  <UserCheck className="w-4 h-4 mr-2" /> Approve
                </Button>
                <Button 
                  onClick={() => setReviewAction('request_info')}
                  variant="outline"
                  className="flex-1 rounded-full font-mono tracking-wider border-border/60 h-11 hover:-translate-y-0.5 transition-transform"
                >
                  <FileQuestion className="w-4 h-4 mr-2" /> Request Info
                </Button>
                <Button 
                  onClick={() => setReviewAction('reject')}
                  variant="outline"
                  className="flex-1 rounded-full font-mono tracking-wider text-destructive border-destructive/30 hover:bg-destructive/10 h-11 hover:-translate-y-0.5 transition-transform"
                >
                  <UserX className="w-4 h-4 mr-2" /> Reject
                </Button>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div>
                  <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground ml-1">
                    {reviewAction === 'approve' ? 'Confirmation Note (Optional)' : 'Required Reason'}
                  </Label>
                  <Input 
                    value={reviewReason}
                    onChange={e => setReviewReason(e.target.value)}
                    placeholder={reviewAction === 'request_info' ? "E.g., Please upload a clearer photo of your ID." : ""}
                    className="mt-2 rounded-xl font-mono text-sm border-border/60 h-11 px-4 bg-card focus-visible:ring-primary shadow-sm"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <Button variant="ghost" className="rounded-full font-mono text-xs px-5 hover:bg-muted/50" onClick={() => {setReviewAction(null); setReviewReason('');}}>Cancel</Button>
                  <Button 
                    className={cn("rounded-full font-mono tracking-wider px-6 shadow-sm", reviewAction === 'reject' ? 'bg-destructive hover:bg-destructive/90 text-white' : '')}
                    onClick={handleReviewSubmit}
                    disabled={isMutating || (reviewAction !== 'approve' && !reviewReason.trim())}
                  >
                    {isMutating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {isMutating ? 'Processing...' : 'Confirm Action'}
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
