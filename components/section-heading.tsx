import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  title: string
  subtitle: string
  center?: boolean
  className?: string
  subtitleClassName?: string
  highlightWords?: string[]
}

export function SectionHeading({
  title,
  subtitle,
  center = false,
  className,
  subtitleClassName,
  highlightWords = [],
}: SectionHeadingProps) {
  // Function to highlight specific words in the title
  const highlightTitle = () => {
    if (highlightWords.length === 0) return title

    let parts = [title]
    let keyIndex = 0

    highlightWords.forEach(word => {
      parts = parts.flatMap(part => {
        if (typeof part === 'string') {
          const splitParts = part.split(new RegExp(`(${word})`, 'gi'))
          return splitParts.map(p =>
            p.toLowerCase() === word.toLowerCase() ? (
              <span key={`${p}-${keyIndex++}`} className="text-gradient">
                {p}
              </span>
            ) : (
              p
            )
          )
        }
        return part
      })
    })

    return parts
  }

  return (
    <div className={cn('space-y-4 mb-12', center && 'text-center', className)}>
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1E1D40] leading-tight">
        {highlightTitle()}
      </h2>
      <p
        className={cn(
          'text-lg text-[#1E1D40]/70 max-w-3xl',
          center && 'mx-auto',
          subtitleClassName
        )}
      >
        {subtitle}
      </p>
    </div>
  )
}
