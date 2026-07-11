import { useState, useEffect, useRef } from 'react'
import Lottie, { LottieRefCurrentProps } from 'lottie-react'
import { Logo } from '@/components/ui/logo'

interface GlobalLoaderProps {
  onComplete?: () => void
  showWelcome?: boolean
}

export function GlobalLoader({ onComplete, showWelcome = true }: GlobalLoaderProps) {
  const [animationData, setAnimationData] = useState<any>(null)
  const lottieRef = useRef<LottieRefCurrentProps>(null)

  useEffect(() => {
    if (!showWelcome) return

    fetch('/welcome-animation.json')
      .then((res) => {
        if (!res.ok) throw new Error('Not found')
        return res.json()
      })
      .then((data) => setAnimationData(data))
      .catch((err) => {
        console.error('Failed to load welcome animation:', err)
        if (onComplete) onComplete()
      })

    // Safety fallback: if animation takes too long or fails
    const timer = setTimeout(() => {
      if (onComplete) onComplete()
    }, 4000)

    return () => clearTimeout(timer)
  }, [onComplete, showWelcome])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[hsl(40,33%,96%)] transition-opacity duration-500">
      <div className="relative">
        {showWelcome && animationData ? (
          <div className="w-64 h-64 sm:w-80 sm:h-80 drop-shadow-xl opacity-90">
            <Lottie 
              animationData={animationData} 
              loop={false} 
              lottieRef={lottieRef}
              onDOMLoaded={() => lottieRef.current?.setSpeed(2.66)}
              onComplete={() => {
                if (onComplete) onComplete()
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 animate-pulse">
            <Logo className="w-16 h-16 opacity-50 grayscale" />
          </div>
        )}
      </div>
    </div>
  )
}
