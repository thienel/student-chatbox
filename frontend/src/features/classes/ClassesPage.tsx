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
        onError: (err: unknown) => {
          const status = (err as { response?: { status?: number } })?.response?.status
          toast({
            variant: 'destructive',
            description:
              status === 409
                ? 'You already have a class with this password.'
                : 'Failed to create class.',
          })
        },
      },
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-medium text-zinc-50">Classes</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Students join a class with its password. Content you add lives in the selected class.
          </p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200 h-8 px-3 text-sm font-medium rounded-md"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New Class
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg bg-zinc-900" />
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
              className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <GraduationCap className="h-4 w-4 text-zinc-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-50 truncate">{c.name}</p>
                  {c.lecturer && (
                    <p className="text-xs text-zinc-600 truncate">{c.lecturer.fullName}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 shrink-0">
                <Users className="h-3.5 w-3.5" />
                {c.studentCount ?? 0}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-md">
          <DialogHeader>
            <DialogTitle className="text-zinc-50">New class</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Pick a name and a password. You can't reuse a password across your own classes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="class-name" className="text-xs text-zinc-400">Class name</Label>
              <Input
                id="class-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. SE1702 — Morning"
                className="bg-zinc-950 border-zinc-800 text-zinc-50 h-9 rounded-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-class-password" className="text-xs text-zinc-400">Password</Label>
              <Input
                id="new-class-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="Shared with students"
                className="bg-zinc-950 border-zinc-800 text-zinc-50 h-9 rounded-md"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 h-8 px-3 text-sm rounded-md"
            >
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={!name.trim() || !password.trim() || create.isPending}
              className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200 h-8 px-3 text-sm font-medium rounded-md"
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
