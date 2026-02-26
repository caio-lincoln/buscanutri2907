'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/use-toast'
import Loading from '@/components/ui/loading'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Components
import { BackNavigation } from '@/components/agendar/components/BackNavigation'
import { ProfessionalSummary } from '@/components/agendar/components/ProfessionalSummary'
import { CalendarSelector } from '@/components/agendar/components/CalendarSelector'
import { PaymentPanel } from '@/components/agendar/components/PaymentPanel'

// Types
import type { AvailableSlot } from '@/hooks/useAvailability'
import type { Nutritionist } from '@/hooks/useNutritionists'

export default function SchedulePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  // Corrigido para usar 'id' conforme o nome da pasta [id]
  const nutritionistId = params.id as string

  const [nutritionist, setNutritionist] = useState<Nutritionist | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (nutritionistId) {
      loadNutritionistData()
    }
  }, [nutritionistId, user, authLoading])

  const loadNutritionistData = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('nutritionist_profiles')
        .select('*, nutritionist_services(*)')
        .eq('id', nutritionistId)
        .single()

      if (error) throw error

      if (process.env.NODE_ENV === 'development') {
        console.log('Nutritionist Data:', data) // Debug log
      }

      // Normalize specialties
      let normalizedSpecialties: string[] = []
      if (Array.isArray(data.specialties)) {
        normalizedSpecialties = data.specialties
      } else if (typeof data.specialties === 'string') {
        normalizedSpecialties = (data.specialties as string)
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
      }

      // Calculate price from services (taking the first one or a default)
      const service = data.nutritionist_services?.[0]
      // Priority: consultation_price from profile -> service price -> 0
      // Ensure we handle both number and string types from DB
      const dbPrice = data.consultation_price
      const servicePrice = service?.price
      
      let price = 0
      if (dbPrice !== null && dbPrice !== undefined) {
        price = Number(dbPrice)
      } else if (servicePrice !== null && servicePrice !== undefined) {
        price = Number(servicePrice)
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Price Calculation Debug:', {
          dbPrice,
          servicePrice,
          finalPrice: price,
          paymentMethods: data.payment_methods
        })
      }

      const duration = service?.duration || 60

      const mappedNutritionist: Nutritionist = {
        id: data.id,
        full_name: data.full_name,
        profile_image_url: data.profile_image_url,
        specialties: normalizedSpecialties,
        location: data.location,
        bio: data.bio,
        crn: data.crn,
        rating: data.rating,
        total_reviews: data.total_reviews,
        consultation_price: price,
        payment_methods: data.payment_methods,
        default_consultation_duration: duration,
        online_consultation_available: true,
        is_verified: true
      }

      setNutritionist(mappedNutritionist)
    } catch (error) {
      console.error('Error loading nutritionist:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do nutricionista',
        variant: 'destructive',
      })
      router.push('/dashboard/paciente')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return <Loading message="Carregando agendamento..." />
  }

  if (!nutritionist) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-[#1E1D40]">
            Nutricionista não encontrado
          </h2>
          <Button onClick={() => router.push('/dashboard/paciente')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 
        GRID LAYOUT DEFINITION
        Mobile: 1 column
        Tablet: 2 columns
        Desktop: 3 columns (260px 1fr 420px)
      */}
      <div className="
        grid 
        grid-cols-1 
        md:grid-cols-[1fr_350px] 
        lg:grid-cols-[260px_1fr_420px] 
        gap-6 
        max-w-[1400px] 
        mx-auto 
        p-6
      ">
        {/* COLUMN 1: Navigation */}
        
        <aside className="hidden lg:block sticky top-6 h-fit">
          <BackNavigation />
        </aside>

        {/* Mobile Back Button */}
        <div className="lg:hidden mb-4">
           <Button 
            variant="ghost" 
            onClick={() => router.push('/dashboard/paciente/agendar')} 
            className="pl-0 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        {/* COLUMN 2: Main Content */}
        <main className="space-y-8 min-w-0">
          <ProfessionalSummary nutritionist={nutritionist} />
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground/90 flex items-center gap-2">
              Selecione a data e horário
            </h3>
            <CalendarSelector 
              nutritionistId={nutritionist.id} 
              onSelectSlot={setSelectedSlot}
              selectedSlot={selectedSlot}
            />
          </div>
        </main>

        {/* COLUMN 3: Payment/Summary */}
        <aside className="lg:sticky lg:top-6 h-fit space-y-6">
          <PaymentPanel 
            nutritionist={nutritionist} 
            selectedSlot={selectedSlot} 
          />
        </aside>
      </div>
    </div>
  )
}
