import { useState } from 'react'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EnrollDialog } from './EnrollDialog'

export function ClassGate({ subjectId }: { subjectId: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="h-12 w-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
        <Lock className="h-5 w-5 text-zinc-500" />
      </div>
      <h2 className="text-base font-medium text-zinc-50">You haven't joined a class</h2>
      <p className="text-sm text-zinc-500 mt-1 max-w-sm">
        Join one of this subject's classes to access its documents, chat, flashcards and exams.
      </p>
      <Button
        onClick={() => setOpen(true)}
        className="mt-5 bg-zinc-50 text-zinc-950 hover:bg-zinc-200 h-8 px-4 text-sm font-medium rounded-md"
      >
        Join a class
      </Button>
      <EnrollDialog subjectId={subjectId} open={open} onOpenChange={setOpen} />
    </div>
  )
}
