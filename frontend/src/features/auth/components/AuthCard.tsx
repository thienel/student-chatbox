import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/logo'
import Lottie from 'lottie-react'

interface AuthCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  title: string
  subtitle?: string
  /** Optional icon to display above the title */
  icon?: React.ReactNode
}

export function AuthCard({ children, title, subtitle, icon, className, ...props }: AuthCardProps) {
  return (
    <div className="min-h-screen w-full flex selection:bg-primary selection:text-white">

      {/* ── Left Pane: Folio Brand Panel ── */}
      <div className="hidden lg:flex w-[45%] xl:w-[42%] flex-col justify-between p-14 xl:p-16 relative overflow-hidden bg-[hsl(161,88%,13%)]">
        {/* Ambient glow — top right */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[hsl(32,94%,44%)]/20 blur-[80px] pointer-events-none" />
        {/* Ambient glow — bottom left */}
        <div className="absolute -bottom-32 -left-16 w-72 h-72 rounded-full bg-[hsl(163,88%,20%)]/30 blur-[100px] pointer-events-none" />
        {/* Dot-matrix texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1.5px, transparent 1.5px)',
            backgroundSize: '18px 18px',
          }}
        />

        {/* Brand logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3.5">
            <img src="/favicon.svg" alt="Folio Square Logo" className="w-10 h-10 shadow-sm" />
            <Logo className="h-10 w-auto text-white" />
          </div>
        </div>

        {/* Lottie Animation Area (Absolute centered to prevent layout stretching) */}
        <div className="absolute inset-0 z-0 flex flex-col justify-center items-center pb-32 pointer-events-none">
          <div className="w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 opacity-90 drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-transform duration-700 hover:scale-105 mt-10">
            {/* 
              We will load the animation directly via URL. 
              lottie-react can take an animationData object or path (but path requires a custom loader hook, so we fetch it or pass animationData).
              Actually, for Vite public files, we can just fetch it inside the component or use dotLottie player.
              To keep it simple, we'll fetch it on mount.
            */}
            <LottieAnimation url="/hero-animation.json" />
          </div>
        </div>

        {/* Tagline */}
        <div className="relative z-10">
          <blockquote className="space-y-6">
            <p className="text-4xl xl:text-5xl font-serif text-white leading-[1.15] tracking-tight">
              "Học thông minh hơn.<br/>
              Ghi nhớ sâu hơn.<br/>
              Tiến xa hơn."
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-[2px] bg-[hsl(32,94%,44%)] rounded-full" />
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/70 font-semibold">
                Folio &middot; AI-Powered Learning
              </p>
            </div>
          </blockquote>
        </div>
      </div>

      {/* ── Right Pane: Form Area ── */}
      <div
        className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-14 relative overflow-hidden bg-[hsl(40,33%,96%)]"
      >
        {/* Ruled-paper lines */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(to bottom, transparent 0px, transparent 31px, hsl(40,18%,81%) 31px, hsl(40,18%,81%) 32px)`,
            backgroundPosition: '0 64px',
            opacity: 0.35,
          }}
        />
        {/* Soft ambient glow behind card */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-[hsl(163,88%,20%)]/5 blur-[120px] pointer-events-none" />

        {/* Floating form card */}
        <div
          className={cn(
            'relative z-10 w-full max-w-md',
            'bg-white/90 backdrop-blur-md',
            'rounded-[2rem] shadow-[0_8px_40px_-8px_rgba(6,95,70,0.12),0_2px_16px_-4px_rgba(6,95,70,0.06)]',
            'border border-white/80',
            'animate-in fade-in slide-in-from-bottom-6 duration-500 ease-out',
            className
          )}
          {...props}
        >
          {/* Card dot-matrix texture */}
          <div
            className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(circle, hsl(161,88%,13%) 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />

          <div className="relative z-10 p-8 sm:p-10">
            {/* Header */}
            <div className="text-center mb-8 space-y-2">
              {icon && (
                <div className="flex justify-center mb-4">
                  {icon}
                </div>
              )}
              <h1 className="font-serif text-3xl sm:text-[2rem] font-bold text-[hsl(161,88%,13%)] tracking-tight leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="font-mono text-[hsl(51,3%,41%)] text-xs sm:text-sm leading-relaxed tracking-wide">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Gold accent divider */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex-1 h-px bg-[hsl(40,18%,81%)]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[hsl(32,94%,44%)]" />
              <div className="flex-1 h-px bg-[hsl(40,18%,81%)]" />
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper component to fetch and render Lottie from public folder
import { useState, useEffect } from 'react'

function LottieAnimation({ url }: { url: string }) {
  const [animationData, setAnimationData] = useState<any>(null)

  useEffect(() => {
    fetch(url)
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error('Failed to load lottie:', err))
  }, [url])

  if (!animationData) {
    return <div className="w-full h-full flex items-center justify-center text-white/30 font-mono text-xs animate-pulse">Loading AI...</div>
  }

  return <Lottie animationData={animationData} loop={true} />
}
