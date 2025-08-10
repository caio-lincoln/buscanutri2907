import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  className?: string
  iconClassName?: string
  variant?: 'default' | 'outline' | 'filled'
  index?: number
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
  iconClassName,
  variant = 'default',
  index = 0,
}: FeatureCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'outline':
        return 'border border-gray-200 hover:border-[#4AB0D9]/50 hover:shadow-md'
      case 'filled':
        return 'bg-white shadow-md hover:shadow-lg'
      default:
        return 'hover:bg-white/50 hover:shadow-sm'
    }
  }

  const getIconStyles = () => {
    switch (variant) {
      case 'outline':
        return 'bg-white text-[#4AB0D9]'
      case 'filled':
        return 'bg-[#4AB0D9]/10 text-[#4AB0D9]'
      default:
        return 'bg-[#4AB0D9] text-white'
    }
  }

  return (
    <div
      className={cn(
        'p-6 rounded-xl transition-all duration-300 animate-fade-in-up',
        getVariantStyles(),
        className
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div
        className={cn(
          'w-12 h-12 rounded-lg flex items-center justify-center mb-4',
          getIconStyles(),
          iconClassName
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-semibold text-[#1E1D40] mb-2">{title}</h3>
      <p className="text-[#1E1D40]/70">{description}</p>
    </div>
  )
}
