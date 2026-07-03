import { useState } from 'react'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EnrollDialog } from './EnrollDialog'

export function ClassGate({ subjectId }: { subjectId: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="h-12 w-12 rounded-full bg-card border flex items-center justify-center mb-4">
        <Lock className="h-5 w-5 text-muted-foreground" />
      </div>
      <h2 className="text-base font-medium text-foreground">You haven't joined a class</h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        Join one of this subject's classes to access its documents, chat, flashcards and exams.
      </p>
      <Button
        onClick={() => setOpen(true)}
        className="mt-5 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 text-sm font-medium rounded-md"
      >
        Join a class
      </Button>
      <EnrollDialog subjectId={subjectId} open={open} onOpenChange={setOpen} />
    </div>
  )
}
