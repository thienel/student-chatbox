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
import { useAvailableClasses, useEnroll } from '@/api/queries/classes'
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
  const { data: classes = [], isLoading } = useAvailableClasses(subjectId, open)
  const enroll = useEnroll(subjectId)
  const [classId, setClassId] = useState('')
  const [password, setPassword] = useState('')

  const submit = () => {
    if (!classId || !password) return
    enroll.mutate(
      { classId, password },
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
            description: getErrorMessage(err, 'Invalid class password.'),
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
            Select your class and enter the password provided by your lecturer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Available Classes</Label>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : classes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No classes are open for this subject yet.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {classes.map((c: any) => (
                  <button
                    key={c.id}
                    onClick={() => setClassId(c.id)}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-md border text-sm transition-colors duration-150 flex flex-col gap-1',
                      classId === c.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-secondary text-muted-foreground hover:border-muted-foreground hover:text-foreground',
                    )}
                  >
                    <span className="font-medium">{c.name}</span>
                    <span className="text-xs opacity-80">Lecturer: {c.lecturerName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {classId && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
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
          )}
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
            disabled={!classId || !password || enroll.isPending}
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
