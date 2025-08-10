'use client'

import type React from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color?: keyof typeof colorConfig
  trend?: {
    value: number
    isPositive: boolean
  }
  description?: string
  className?: string
}

const colorConfig = {
  blue: {
    bg: 'from-blue-500 to-blue-600',
    text: 'text-blue-600',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  green: {
    bg: 'from-green-500 to-green-600',
    text: 'text-green-600',
    badge: 'bg-green-50 text-green-700 border-green-200',
  },
  red: {
    bg: 'from-red-500 to-red-600',
    text: 'text-red-600',
    badge: 'bg-red-50 text-red-700 border-red-200',
  },
  purple: {
    bg: 'from-purple-500 to-purple-600',
    text: 'text-purple-600',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  orange: {
    bg: 'from-orange-500 to-orange-600',
    text: 'text-orange-600',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  yellow: {
    bg: 'from-yellow-500 to-yellow-600',
    text: 'text-yellow-600',
    badge: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  },
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  trend,
  description,
  className,
}: StatsCardProps) {
  // Garante fallback seguro caso a cor não exista no objeto.
  const config = colorConfig[color] ?? colorConfig.blue

  return (
    <Card
      className={cn(
        'border-0 shadow-lg backdrop-blur-sm hover-lift transition-all duration-300',
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div
            className={cn(
              'w-12 h-12 bg-gradient-to-br rounded-xl flex items-center justify-center shadow-lg',
              config.bg
            )}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
          {trend && (
            <Badge
              variant="outline"
              className={cn('text-xs font-semibold', config.badge)}
            >
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </Badge>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-600 break-words">
            {title}
          </p>
          <p className="text-2xl lg:text-3xl font-bold text-[#1E1D40] break-all">
            {value}
          </p>
          {description && (
            <p className="text-xs text-gray-500 break-words">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
