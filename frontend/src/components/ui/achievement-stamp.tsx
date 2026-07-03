import React from 'react'

interface AchievementStampProps {
  value: number | string
  label: string
  className?: string
}

export function AchievementStamp({ value, label, className = '' }: AchievementStampProps) {
  return (
    <div className={`relative inline-flex items-center justify-center w-28 h-28 ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full text-stamp-gold"
        style={{ transform: 'rotate(-5deg)' }}
      >
        <defs>
          <filter id="ink-texture" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.8"
              numOctaves="3"
              result="noise"
            />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 7 -3"
              in="noise"
              result="coloredNoise"
            />
            <feComposite operator="in" in="SourceGraphic" in2="coloredNoise" />
          </filter>
        </defs>
        
        <g filter="url(#ink-texture)">
          {/* Outer dashed border */}
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray="4 4"
          />
          {/* Inner solid border */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </g>
      </svg>
      
      <div 
        className="relative flex flex-col items-center justify-center text-stamp-gold"
        style={{ transform: 'rotate(-5deg)' }}
      >
        <span className="font-data font-bold text-3xl leading-none tracking-tighter">
          {value}
        </span>
        <span className="font-data font-semibold text-[10px] uppercase tracking-widest mt-1">
          {label}
        </span>
      </div>
    </div>
  )
}
