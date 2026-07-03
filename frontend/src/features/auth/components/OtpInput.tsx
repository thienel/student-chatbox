import { useState, useRef, KeyboardEvent, ClipboardEvent } from 'react'
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
    if (!/^[0-9]*$/.test(val)) return // Only digits

    const newValue = value.split('')
    newValue[index] = val.substring(val.length - 1) // Take last character if multiple
    const combinedValue = newValue.join('')
    onChange(combinedValue)

    // Move to next input
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
      setActiveInput(index + 1)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      // Move to previous input on backspace if current is empty
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
    
    // Focus last filled input
    const nextIndex = Math.min(pastedData.length, length - 1)
    inputRefs.current[nextIndex]?.focus()
    setActiveInput(nextIndex)
  }

  return (
    <div className="flex gap-2 justify-between">
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
            'w-12 h-14 text-center text-xl font-semibold border-2 rounded-lg outline-none transition-colors font-geist',
            error ? 'border-red-500 text-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-600' : 'border-gray-200 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary',
            disabled && 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}
        />
      ))}
    </div>
  )
}
