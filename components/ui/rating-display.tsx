import React from 'react'
import { Star } from 'lucide-react'

interface RatingDisplayProps {
  rating: number
  totalReviews?: number
  size?: 'sm' | 'md' | 'lg'
  showNumber?: boolean
  showReviewCount?: boolean
  className?: string
}

export function RatingDisplay({
  rating,
  totalReviews = 0,
  size = 'md',
  showNumber = true,
  showReviewCount = true,
  className = '',
}: RatingDisplayProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  const renderStars = () => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5

    // Estrelas preenchidas
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star
          key={`full-${i}`}
          className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`}
        />
      )
    }

    // Meia estrela
    if (hasHalfStar) {
      stars.push(
        <div key="half" className={`relative ${sizeClasses[size]}`}>
          <Star className={`${sizeClasses[size]} text-gray-300 absolute`} />
          <div className="overflow-hidden w-1/2">
            <Star
              className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`}
            />
          </div>
        </div>
      )
    }

    // Estrelas vazias
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star
          key={`empty-${i}`}
          className={`${sizeClasses[size]} text-gray-300`}
        />
      )
    }

    return stars
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">{renderStars()}</div>

      {showNumber && (
        <span className={`font-medium text-gray-700 ${textSizeClasses[size]}`}>
          {rating.toFixed(1)}
        </span>
      )}

      {showReviewCount && totalReviews > 0 && (
        <span className={`text-gray-500 ${textSizeClasses[size]}`}>
          ({totalReviews} {totalReviews === 1 ? 'avaliação' : 'avaliações'})
        </span>
      )}
    </div>
  )
}

interface RatingCardProps {
  rating: number
  totalReviews?: number
  title?: string
  subtitle?: string
  className?: string
}

export function RatingCard({
  rating,
  totalReviews = 0,
  title = 'Avaliação Média',
  subtitle,
  className = '',
}: RatingCardProps) {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}
    >
      <div className="text-center">
        <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>

        <div className="flex flex-col items-center gap-2">
          <div className="text-3xl font-bold text-gray-900">
            {rating.toFixed(1)}
          </div>

          <RatingDisplay
            rating={rating}
            totalReviews={totalReviews}
            size="lg"
            showNumber={false}
            showReviewCount={false}
          />

          {totalReviews > 0 && (
            <p className="text-sm text-gray-500">
              {totalReviews} {totalReviews === 1 ? 'avaliação' : 'avaliações'}
            </p>
          )}

          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}
