import React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog'
import { buttonVariants } from './button'
import { cn } from '@/lib/utils'

interface ConfirmDeleteDialogProps {
  trigger: React.ReactNode
  title?: string
  description?: string
  onConfirm: () => void | Promise<void>
  confirmText?: string
  cancelText?: string
}

export function ConfirmDeleteDialog({
  trigger,
  title = 'Are you sure you want to delete this?',
  description = 'This action cannot be undone. This will permanently delete this item.',
  onConfirm,
  confirmText = 'Delete',
  cancelText = 'Cancel',
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => {
              onConfirm()
            }}
            className={cn(buttonVariants({ variant: 'destructive' }))}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
