'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { DashboardSidebar, getMenuItems } from '@/components/dashboard-sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Star,
  Clock,
  Users,
  Edit,
  ArrowLeft
} from 'lucide-react'
import { RatingDisplay } from '@/components/ui/rating-display'
import { UserProfileModal } from '@/components/user-profile-modal'
import { ConnectStripeCard } from '../../../../components/ConnectStripeCard'
import { useSubscriptionContext } from '../../../../contexts/subscription-context'

const DASH_BASE = '/dashboard/nutricionistas';

export default function NutritionistProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user, nutritionistProfile, loading: authLoading, signOut } = useAuth()
  const [ loading, setLoading ] = useState(true)
  const [ isProfileModalOpen, setIsProfileModalOpen ] = useState(false)

  const { hasActiveSubscription } = useSubscriptionContext()

  const menuItems = useMemo(
    () => getMenuItems('nutricionista', undefined, { hasActiveSubscription }),
    [ hasActiveSubscription ]
  );

  const profileId = params[ 'id' ] as string
  const profile = nutritionistProfile

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    // Verificar se o ID do perfil corresponde ao usuário logado
    if (profile && profileId !== profile.id) {
      router.push(`/dashboard/nutricionistas/${profile.id}`)
      return
    }

    if (profile) {
      setLoading(false)
    }
  }, [ user, authLoading, profile, profileId, router ])

  const goToTab = useCallback((tab: string) => {
    const sp = new URLSearchParams();
    sp.set('activeTab', tab);
    router.push(`${DASH_BASE}?${sp.toString()}`, { scroll: false });
  }, [ router ]);


  const handleBackToDashboard = () => {
    router.push('/dashboard/nutricionistas')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-500 mx-auto"></div>
          <p className="text-[#1E1D40]/70 font-medium">
            Carregando perfil...
          </p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-[#1E1D40]/70 font-medium">
            Perfil não encontrado
          </p>
          <Button onClick={handleBackToDashboard}>
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <DashboardSidebar
      userType="nutricionista"
      userName={profile.full_name || 'Nutricionista'}
      userAvatar={profile.profile_image_url || '/placeholder.svg'}
      menuItems={menuItems}
      activeItem="perfil"
      onItemClick={(itemId) => {
        if (itemId === 'perfil') return // Já estamos na página de perfil
        goToTab(itemId)
      }}
      onSignOut={signOut}
    >
      <div className="space-y-6">
        {/* Header com botão de voltar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToDashboard}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-[#1E1D40]">Meu Perfil</h1>
              <p className="text-gray-600">Gerencie suas informações profissionais</p>
            </div>
          </div>

          <Button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Editar Perfil
          </Button>
        </div>

        {/* Informações do Perfil */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal - Informações Pessoais */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card Principal */}
            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile.profile_image_url || '/placeholder.svg'} />
                    <AvatarFallback className="bg-blue-500 text-white text-xl">
                      {profile.full_name?.charAt(0) || 'N'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-2xl text-[#1E1D40]">
                      {profile.full_name}
                    </CardTitle>
                    <p className="text-gray-600 mt-1">
                      CRN: {profile.crn_number}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <RatingDisplay
                        rating={profile.rating || 0}
                        totalReviews={profile.total_reviews || 0}
                        size="sm"
                      />
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {profile.totalViews || 0} visualizações
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.bio && (
                  <div>
                    <h3 className="font-semibold text-[#1E1D40] mb-2">Sobre</h3>
                    <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                  </div>
                )}

                <Separator />

                {/* Informações de Contato */}
                <div>
                  <h3 className="font-semibold text-[#1E1D40] mb-3">Contato</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {profile.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{profile.phone}</span>
                      </div>
                    )}
                    {user?.email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span>{user.email}</span>
                      </div>
                    )}
                    {profile.location && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>

                {/* Especializações */}
                {/* {profile.specialties && profile.specialties.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold text-[#1E1D40] mb-3">Especializações</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.specialties.map((spec, index) => (
                          <Badge key={index} variant="secondary">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )} */}
              </CardContent>
            </Card>
            {hasActiveSubscription && <ConnectStripeCard nutritionistUserId={nutritionistProfile?.user_id as string} />}
            
          </div>

          {/* Coluna Lateral - Estatísticas */}
          <div className="space-y-6">
            {/* Estatísticas */}
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Avaliação</span>
                  </div>
                  <span className="font-semibold">
                    {profile.rating?.toFixed(1) || '0'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Avaliações</span>
                  </div>
                  <span className="font-semibold">
                    {profile.total_reviews || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Visualizações</span>
                  </div>
                  <span className="font-semibold">
                    {profile.totalViews || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Disponibilidade */}
            <Card>
              <CardHeader>
                <CardTitle>Disponibilidade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Status</span>
                    <Badge variant="default">
                      Disponível
                    </Badge>
                  </div>
                  {profile.consultation_price && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Consulta</span>
                      <span className="font-semibold">
                        R$ {profile.consultation_price.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ações Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open(`/nutricionistas/${profile.id}`, '_blank')}
                >
                  <User className="h-4 w-4 mr-2" />
                  Ver Perfil Público
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setIsProfileModalOpen(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Perfil
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de Edição de Perfil */}
      <UserProfileModal
        open={isProfileModalOpen}
        onOpenChange={setIsProfileModalOpen}
        userType="nutricionista"
        initialData={profile}
        userId={profile.user_id}
      />
    </DashboardSidebar>
  )
}
