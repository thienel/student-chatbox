

interface AchievementStampProps {
  value: number | string
  label: string
  className?: string
}

export function AchievementStamp({ value, label, className = '' }: AchievementStampProps) {
  return (
    <div className={`flex flex-col items-end ${className}`}>
      <span className="font-heading font-medium text-[34px] text-ink leading-none mb-1">
        {value}
      </span>
      <span className="font-data font-semibold text-[11px] uppercase tracking-widest text-stamp-gold border-b-2 border-stamp-gold pb-0.5">
        {label}
      </span>
    </div>
  )
}
