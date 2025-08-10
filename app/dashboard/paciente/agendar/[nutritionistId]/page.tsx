'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { signOut } from '@/lib/auth'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { getMenuItems } from '@/components/dashboard-sidebar'
import { useDashboardStats } from '@/hooks/use-dashboard-stats'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, MapPin, Star, AlertCircle, Shield } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/use-toast'

interface NutritionistService {
  id: string
  name: string
  description: string
  price: number
  duration: number
  online_available: boolean
  in_person_available: boolean
}

interface NutritionistProfile {
  id: string
  user_id: string
  full_name: string
  bio: string
  location: string
  profile_image_url: string | null
  crn: string
  rating: number
  total_reviews: number
  specialties: string[] | string
  nutritionist_services: NutritionistService[]
}

export default function ScheduleConsultationPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const params = useParams()
  const nutritionistId = params.nutritionistId as string

  const [nutritionist, setNutritionist] = useState<NutritionistProfile | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { stats, loading: statsLoading } = useDashboardStats({
    userType: 'paciente',
    userId: user?.id || '',
    enabled: !!user?.id,
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (
      nutritionistId &&
      nutritionistId !== 'null' &&
      nutritionistId !== 'undefined'
    ) {
      loadNutritionistData()
    } else {
      // Invalid nutritionist ID - handled silently
      toast({
        title: 'Erro',
        description: 'ID do nutricionista inválido',
        variant: 'destructive',
      })
      router.push('/dashboard/paciente')
    }
  }, [nutritionistId, user, authLoading])

  const loadNutritionistData = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('nutritionist_profiles')
        .select(
          `
          id,
          user_id,
          full_name,
          bio,
          location,
          profile_image_url,
          crn,
          rating,
          total_reviews,
          specialties,
          nutritionist_services (*)
        `
        )
        .eq('id', nutritionistId)
        .single()

      if (error) {
        // Error loading nutritionist - handled silently
        throw error
      }

      // Normalizar specialties para sempre ser um array
      let normalizedSpecialties: string[] = []
      if (Array.isArray(data.specialties)) {
        normalizedSpecialties = data.specialties
      } else if (typeof data.specialties === 'string') {
        normalizedSpecialties = data.specialties
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
      }

      setNutritionist({
        ...data,
        specialties: normalizedSpecialties,
      })
    } catch (error) {
      // Error loading nutritionist data - handled silently
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

  const getSpecialtiesText = () => {
    if (!nutritionist?.specialties) return 'Nutrição Geral'

    const specialtiesArray = Array.isArray(nutritionist.specialties)
      ? nutritionist.specialties
      : []

    return specialtiesArray.length > 0
      ? specialtiesArray.join(', ')
      : 'Nutrição Geral'
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50/50 via-white to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-200 border-t-red-500 mx-auto"></div>
          <p className="text-[#1E1D40]/70 font-medium">
            Carregando informações...
          </p>
        </div>
      </div>
    )
  }

  if (!nutritionist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50/50 via-white to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-[#1E1D40]">
            Nutricionista não encontrado
          </h2>
          <p className="text-gray-600">
            Não foi possível carregar as informações do profissional.
          </p>
          <Button
            onClick={() => router.push('/dashboard/paciente')}
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const menuItems = user ? getMenuItems('patient', stats) : []

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      // Error signing out - handled silently
      toast({
        title: 'Erro',
        description: 'Erro ao fazer logout',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50/50 via-white to-white flex">
      <DashboardSidebar
        user={user}
        userType="patient"
        menuItems={menuItems}
        onSignOut={handleSignOut}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 lg:ml-64">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard/paciente')}
              className="hover:bg-red-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-[#1E1D40]">
                Perfil do Nutricionista
              </h1>
              <p className="text-gray-600">Informações do profissional</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Informações do Nutricionista */}
            <div className="lg:col-span-3">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <Avatar className="h-24 w-24 mx-auto ring-4 ring-red-100 shadow-lg">
                      <AvatarImage
                        src={nutritionist?.profile_image_url || undefined}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-600 text-white text-2xl font-bold">
                        {nutritionist.full_name?.charAt(0) || 'N'}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <h2 className="text-xl font-bold text-[#1E1D40] mb-1">
                        {nutritionist.full_name}
                      </h2>
                      <p className="text-sm text-gray-600 mb-2">
                        CRN: {nutritionist.crn}
                      </p>

                      <div className="flex items-center justify-center gap-2 mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-semibold">
                            {nutritionist.rating?.toFixed(1) || '5.0'}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">
                          ({nutritionist.total_reviews || 0} avaliações)
                        </span>
                      </div>

                      <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 mb-3">
                        <Shield className="h-3 w-3 mr-1" />
                        Verificado
                      </Badge>
                    </div>

                    {nutritionist.location && (
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{nutritionist.location}</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        Especialidades:
                      </p>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {(typeof getSpecialtiesText() === 'string'
                          ? getSpecialtiesText().split(', ')
                          : [getSpecialtiesText()]
                        ).map((specialty, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                          >
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {nutritionist.bio && (
                      <div className="pt-4 border-t">
                        <p className="text-sm text-gray-600 text-left">
                          {nutritionist.bio}
                        </p>
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                          Funcionalidade Temporariamente Indisponível
                        </h3>
                        <p className="text-yellow-700">
                          O agendamento de consultas está temporariamente
                          indisponível. Entre em contato diretamente com o
                          nutricionista para agendar sua consulta.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
