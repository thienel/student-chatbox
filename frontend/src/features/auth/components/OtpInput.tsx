import { useRef, KeyboardEvent, ClipboardEvent, useState } from 'react'
import { cn } from '@/lib/utils'

interface OtpInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: boolean
}

export function OtpInput({ length = 6, value, onChange, disabled, error }: OtpInputProps) {
  const [, setActiveInput] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value
    if (!/^[0-9]*$/.test(val)) return

    const newValue = value.split('')
    newValue[index] = val.substring(val.length - 1)
    const combinedValue = newValue.join('')
    onChange(combinedValue)

    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
      setActiveInput(index + 1)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
      setActiveInput(index - 1)
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').slice(0, length)
    if (!/^[0-9]+$/.test(pastedData)) return
    const newValue = pastedData.padEnd(length, ' ').slice(0, length)
    onChange(newValue.trim())
    const nextIndex = Math.min(pastedData.length, length - 1)
    inputRefs.current[nextIndex]?.focus()
    setActiveInput(nextIndex)
  }

  return (
    <div className="flex gap-2.5 justify-center w-full">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          onFocus={() => setActiveInput(index)}
          disabled={disabled}
          className={cn(
            // Base: square academic card style
            'w-11 h-14 text-center text-xl font-serif font-bold rounded-xl outline-none transition-all duration-200',
            'border-2 bg-white/60 backdrop-blur-sm',
            // Normal state
            !error && !disabled && 'border-[hsl(40,18%,81%)] text-[hsl(161,88%,13%)] hover:border-primary/40',
            // Focus state
            !error && 'focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(6,95,70,0.08)]',
            // Filled state
            value[index] && !error && 'border-primary/60 bg-primary/5',
            // Error state
            error && 'border-destructive/60 text-destructive bg-destructive/5 focus:border-destructive focus:shadow-[0_0_0_4px_rgba(239,68,68,0.08)]',
            // Disabled state
            disabled && 'bg-[hsl(40,18%,95%)] text-[hsl(51,3%,60%)] border-[hsl(40,18%,85%)] cursor-not-allowed',
          )}
        />
      ))}
    </div>
  )
}
