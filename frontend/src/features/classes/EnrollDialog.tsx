import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/errors'
import { useSubjectLecturers, useEnroll } from './queries'
import { cn } from '@/lib/utils'

export function EnrollDialog({
  subjectId,
  open,
  onOpenChange,
  onEnrolled,
}: {
  subjectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onEnrolled?: () => void
}) {
  const { toast } = useToast()
  const { data: lecturers = [], isLoading } = useSubjectLecturers(subjectId, open)
  const enroll = useEnroll(subjectId)
  const [lecturerId, setLecturerId] = useState('')
  const [password, setPassword] = useState('')

  const submit = () => {
    if (!lecturerId || !password) return
    enroll.mutate(
      { lecturerId, password },
      {
        onSuccess: () => {
          toast({ description: 'Enrolled successfully.' })
          setPassword('')
          onOpenChange(false)
          onEnrolled?.()
        },
        onError: (err) =>
          toast({
            variant: 'destructive',
            description: getErrorMessage(err, 'Invalid lecturer or class password.'),
          }),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border rounded-lg max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Join a class</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Pick your lecturer and enter the class password they gave you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Lecturer</Label>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : lecturers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No classes are open for this subject yet.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {lecturers.map(l => (
                  <button
                    key={l.id}
                    onClick={() => setLecturerId(l.id)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-md border text-sm transition-colors duration-150',
                      lecturerId === l.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-secondary text-muted-foreground hover:border-muted-foreground',
                    )}
                  >
                    {l.fullName}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="class-password" className="text-xs text-muted-foreground">
              Class password
            </Label>
            <Input
              id="class-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="Enter password"
              className="bg-secondary border-border text-foreground h-9 rounded-md"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border bg-transparent text-muted-foreground hover:bg-secondary h-8 px-3 text-sm rounded-md"
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!lecturerId || !password || enroll.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-sm font-medium rounded-md"
          >
            {enroll.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Join
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
