import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { GraduationCap, Plus, Users, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/errors'
import { useClasses, useCreateClass } from './queries'

export default function ClassesPage() {
  const { id: subjectId = '' } = useParams<{ id: string }>()
  const { toast } = useToast()
  const { data: classes = [], isLoading } = useClasses(subjectId)
  const create = useCreateClass(subjectId)

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')

  const submit = () => {
    if (!name.trim() || !password.trim()) return
    create.mutate(
      { name: name.trim(), password },
      {
        onSuccess: () => {
          toast({ description: 'Class created.' })
          setName('')
          setPassword('')
          setOpen(false)
        },
        onError: (err) =>
          toast({ variant: 'destructive', description: getErrorMessage(err, 'Failed to create class.') }),
      },
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-medium text-foreground">Classes</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Students join a class with its password. Content you add lives in the selected class.
          </p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-sm font-medium rounded-md"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New Class
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg bg-muted" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No classes yet"
          description="Create a class and share its password with your students."
        />
      ) : (
        <div className="space-y-2">
          {classes.map(c => (
            <div
              key={c.id}
              className="flex items-center justify-between bg-card border rounded-lg px-4 py-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                  {c.lecturer && (
                    <p className="text-xs text-muted-foreground truncate">{c.lecturer.fullName}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                <Users className="h-3.5 w-3.5" />
                {c.studentCount ?? 0}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border rounded-lg max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">New class</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Pick a name and a password. You can't reuse a password across your own classes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="class-name" className="text-xs text-muted-foreground">Class name</Label>
              <Input
                id="class-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. SE1702 — Morning"
                className="bg-secondary border-border text-foreground h-9 rounded-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-class-password" className="text-xs text-muted-foreground">Password</Label>
              <Input
                id="new-class-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="Shared with students"
                className="bg-secondary border-border text-foreground h-9 rounded-md"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="border bg-transparent text-muted-foreground hover:bg-secondary h-8 px-3 text-sm rounded-md"
            >
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={!name.trim() || !password.trim() || create.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-sm font-medium rounded-md"
            >
              {create.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
