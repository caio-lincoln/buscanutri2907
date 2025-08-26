'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star, MessageSquare, Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getNutritionistRatings, getNutritionistRatingStats, type Rating, type RatingStats } from '@/lib/rating-service'

interface NutritionistRatingsProps {
  nutritionistId: string
  showStats?: boolean
  limit?: number
}

export function NutritionistRatings({
  nutritionistId,
  showStats = true,
  limit = 5
}: NutritionistRatingsProps) {
  const [ ratings, setRatings ] = useState<Rating[]>([])
  const [ stats, setStats ] = useState<RatingStats | null>(null)
  const [ loading, setLoading ] = useState(true)

  useEffect(() => {
    loadRatings()
  }, [ nutritionistId, limit ])

  const loadRatings = async () => {
    try {
      setLoading(true)
      const [ ratingsData, statsData ] = await Promise.all([
        getNutritionistRatings(nutritionistId, limit),
        showStats ? getNutritionistRatingStats(nutritionistId) : null
      ])

      setRatings(ratingsData)
      setStats(statsData)
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR })
    } catch {
      return 'Data inválida'
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[ 1, 2, 3, 4, 5 ].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
              }`}
          />
        ))}
      </div>
    )
  }

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1:
        return 'Muito insatisfeito'
      case 2:
        return 'Insatisfeito'
      case 3:
        return 'Neutro'
      case 4:
        return 'Satisfeito'
      case 5:
        return 'Muito satisfeito'
      default:
        return ''
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Avaliações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Avaliações
          {stats && (
            <Badge variant="secondary" className="ml-2">
              {stats.totalReviews} avaliações
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showStats && stats && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  {stats.averageRating.toFixed(1)}
                </span>
                <div className="flex items-center gap-1">
                  {[ 1, 2, 3, 4, 5 ].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${star <= Math.round(stats.averageRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                        }`}
                    />
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  {stats.totalReviews} avaliações
                </p>
                <p className="text-xs text-gray-500">
                  Média geral
                </p>
              </div>
            </div>

            {/* Distribuição de avaliações */}
            <div className="space-y-2">
              {[ 5, 4, 3, 2, 1 ].map((star) => {
                const count = stats.ratingDistribution[ star as keyof typeof stats.ratingDistribution ]
                const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0

                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 w-4">{star}</span>
                    <Star className="h-4 w-4 text-yellow-400" />
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {ratings.length === 0 ? (
          <div className="text-center py-8">
            <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Nenhuma avaliação ainda</p>
            <p className="text-sm text-gray-400">
              Este nutricionista ainda não recebeu avaliações.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {ratings.map((rating) => (
              <div
                key={rating.id}
                className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>P</AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {renderStars(rating.rating)}
                      <span className="text-sm text-gray-500">
                        {getRatingText(rating.rating)}
                      </span>
                    </div>

                    {rating.comment && (
                      <p className="text-gray-700 mb-2">{rating.comment}</p>
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {formatDate(rating.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
