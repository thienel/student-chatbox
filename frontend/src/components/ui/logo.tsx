

export function Logo({ className = '' }: { className?: string }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 116 64" 
      xmlns="http://www.w3.org/2000/svg" 
      style={{ overflow: 'visible' }}
    >
      <text 
        x="0" 
        y="44" 
        fontFamily="Fraunces, serif" 
        fontWeight="600" 
        fontSize="48" 
        fill="currentColor"
      >
        Folio
      </text>
      <line 
        x1="0" 
        y1="52" 
        x2="114" 
        y2="52" 
        stroke="#96691E" 
        strokeWidth="3" 
      />
    </svg>
  )
}
