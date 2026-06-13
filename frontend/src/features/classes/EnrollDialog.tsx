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
        onError: () =>
          toast({ variant: 'destructive', description: 'Invalid lecturer or class password.' }),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-md">
        <DialogHeader>
          <DialogTitle className="text-zinc-50">Join a class</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Pick your lecturer and enter the class password they gave you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs text-zinc-400">Lecturer</Label>
            {isLoading ? (
              <p className="text-sm text-zinc-500">Loading…</p>
            ) : lecturers.length === 0 ? (
              <p className="text-sm text-zinc-500">No classes are open for this subject yet.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {lecturers.map(l => (
                  <button
                    key={l.id}
                    onClick={() => setLecturerId(l.id)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-md border text-sm transition-colors duration-150',
                      lecturerId === l.id
                        ? 'border-zinc-400 bg-zinc-800 text-zinc-50'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700',
                    )}
                  >
                    {l.fullName}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="class-password" className="text-xs text-zinc-400">
              Class password
            </Label>
            <Input
              id="class-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="Enter password"
              className="bg-zinc-950 border-zinc-800 text-zinc-50 h-9 rounded-md"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 h-8 px-3 text-sm rounded-md"
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!lecturerId || !password || enroll.isPending}
            className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200 h-8 px-3 text-sm font-medium rounded-md"
          >
            {enroll.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Join
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
