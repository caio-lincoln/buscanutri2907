'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star, Calendar, Clock, MessageSquare } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { RatingModal } from '@/components/ui/rating-modal'
import { getCompletedConsultationsForRating, type Consultation } from '@/lib/consultation-service'
import { createRating } from '@/lib/rating-service'
import { toast } from '@/components/ui/use-toast'

interface ConsultationsToRateProps {
  patientId: string
}

export function ConsultationsToRate({ patientId }: ConsultationsToRateProps) {
  const [ consultations, setConsultations ] = useState<Consultation[]>([])
  const [ loading, setLoading ] = useState(true)
  const [ isRatingModalOpen, setIsRatingModalOpen ] = useState(false)
  const [ selectedConsultation, setSelectedConsultation ] = useState<Consultation | null>(null)

  useEffect(() => {
    loadConsultations()
  }, [ patientId ])

  const loadConsultations = async () => {
    try {
      setLoading(true)
      const data = await getCompletedConsultationsForRating(patientId)
      console.log("🚀 ~ loadConsultations ~ data:", data)
      setConsultations(data)
    } catch (error) {
      console.error('Erro ao carregar consultas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenRatingModal = (consultation: Consultation) => {
    setSelectedConsultation(consultation)
    setIsRatingModalOpen(true)
  }

  const handleCloseRatingModal = () => {
    setIsRatingModalOpen(false)
    setSelectedConsultation(null)
  }

  const handleRatingSubmit = async (rating: number, comment: string) => {
    if (!selectedConsultation) return

    try {
      await createRating(
        selectedConsultation.id,
        patientId,
        selectedConsultation.nutritionist_id,
        rating,
        comment
      )

      toast({
        title: 'Avaliação enviada!',
        description: 'Obrigado por avaliar sua consulta.',
      })

      handleCloseRatingModal()
      loadConsultations() // Recarregar para remover da lista
    } catch (error) {
      toast({
        title: 'Erro ao enviar avaliação',
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      })
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR })
    } catch {
      return 'Data inválida'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Consultas para Avaliar
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

  if (consultations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Consultas para Avaliar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Nenhuma consulta para avaliar</p>
            <p className="text-sm text-gray-400">
              Quando você tiver consultas concluídas, elas aparecerão aqui para avaliação.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Consultas para Avaliar ({consultations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {consultations.map((consultation) => (
              <div
                key={consultation.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={consultation.nutritionist_profiles?.profile_image_url}
                      alt={consultation.nutritionist_profiles?.full_name}
                    />
                    <AvatarFallback>
                      {consultation.nutritionist_profiles?.full_name
                        ?.split(' ')
                        .map(n => n[ 0 ])
                        .join('')
                        .toUpperCase() || 'N'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {consultation.nutritionist_profiles?.full_name || 'Nutricionista'}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(consultation.scheduled_at)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {consultation.duration || 30} min
                      </div>
                    </div>
                    {consultation.nutritionist_profiles?.specialties && (
                      <div className="flex gap-1 mt-2">
                        {consultation.nutritionist_profiles.specialties.slice(0, 2).map((specialty, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => handleOpenRatingModal(consultation)}
                  className="flex items-center gap-2"
                >
                  <Star className="h-4 w-4" />
                  Avaliar
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedConsultation && (
        <RatingModal
          open={isRatingModalOpen}
          onOpenChange={setIsRatingModalOpen}
          consultationId={selectedConsultation.id}
          nutritionistName={selectedConsultation.nutritionist_profiles?.full_name || 'Nutricionista'}
          onSubmit={handleRatingSubmit}
        />
      )}
    </>
  )
}
