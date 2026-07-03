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
          <filter id="ink-texture" x="-10%" y="-10%" width="120%" height="120%">
            {/* Generate low frequency noise for edge displacement (wavy edges) */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.04"
              numOctaves="3"
              result="noise"
            />
            {/* Displace the original graphic based on noise */}
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="2.5"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
            {/* Generate high frequency noise for ink fading/texture */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.5"
              numOctaves="2"
              result="fineNoise"
            />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 4 -1"
              in="fineNoise"
              result="textureMask"
            />
            {/* Composite the displaced shape with the texture mask */}
            <feComposite operator="in" in="displaced" in2="textureMask" />
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
            strokeDasharray="5 3"
          />
          {/* Inner solid border */}
          <circle
            cx="50"
            cy="50"
            r="41"
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
