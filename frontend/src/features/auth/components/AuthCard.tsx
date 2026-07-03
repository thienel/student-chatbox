import { cn } from '@/lib/utils'

interface AuthCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export function AuthCard({ children, title, subtitle, className, ...props }: AuthCardProps) {
  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center lg:justify-end p-4 sm:p-8 lg:p-16 xl:p-24 relative bg-cover bg-center bg-no-repeat selection:bg-primary selection:text-white"
      style={{ backgroundImage: "url('/bg-login.jpg')" }}
    >
      {/* Cinematic overlay: clearer on the left, darker behind the card on the right for readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/30 to-black/80 lg:to-black/60 backdrop-blur-[1px]" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.15] mix-blend-overlay pointer-events-none" />

      {/* Floating Card on the Right */}
      <div
        className={cn(
          'relative z-10 w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-white/40 overflow-hidden',
          'animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out',
          className
        )}
        {...props}
      >
        <div className="p-8 sm:p-10">
          <div className="text-center mb-8 space-y-3">
            <h1 className="font-fraunces text-3xl sm:text-4xl font-bold text-primary tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="font-geist text-gray-500 text-sm sm:text-base leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
