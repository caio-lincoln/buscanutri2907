'use client'
import {
  Search,
  Star,
  Calendar,
  Heart,
  Activity,
  Users,
  ArrowRight,
  Bot,
  Target,
  BookOpen,
  FileText,
} from 'lucide-react'
import { useAuth } from '../../../../contexts/auth-context';
import { Consultation, FavoriteNutritionist, PatientStats } from '../../../../lib/consultation-service';
import { useEffect, useMemo, useState } from 'react';
import { RatingDisplay } from '../../../../components/ui/rating-display';
import { StatsCard } from '../../../../components/stats-card';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { ConsultationsToRate } from '../../../../components/dashboard/consultations-to-rate';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../components/ui/avatar';
import { createSupabaseClient } from '../../../../lib/supabase';
import { PermissionWrapper, usePermissions } from '../../../../components/ui/permission-wrapper';

async function fetchPatientStats(p_patient_id: string, supabase: any): Promise<PatientStats> {
  const { data, error } = await supabase
  .rpc('get_patient_stats', { p_patient_id, p_tz: 'America/Sao_Paulo' });

  if (error) throw error;

  const row = Array.isArray(data) ? data[ 0 ] : data;

  return {
    totalConsultations: row?.total_consultations ?? 0,
    scheduledConsultations: row?.scheduled_consultations ?? 0,
    completedConsultations: row?.completed_consultations ?? 0,
    favoriteNutritionists: row?.favorite_nutritionists ?? 0,
    averageRating: Number(row?.average_rating ?? 0),
  };
}

export default function OverviewTab({ setActiveTab, setIsAnamneseModalOpen }: { setActiveTab: (tab: any) => void, setIsAnamneseModalOpen: (ans: boolean) => void; }) {
  const { patientProfile: profile } = useAuth()
  const { hasPermission } = usePermissions()
  const [ consultations, setConsultations ] = useState<Consultation[]>([])
  const [ favoriteNutritionists, setFavoriteNutritionists ] = useState<
    FavoriteNutritionist[]
  >([])
  const supabase = useMemo(() => createSupabaseClient(), [])
  const router = useRouter()

  const [ stats, setStats ] = useState<PatientStats>({
    totalConsultations: 0,
    scheduledConsultations: 0,
    completedConsultations: 0,
    favoriteNutritionists: 0,
    averageRating: 0,
  })

  useEffect(() => {
    (async () => {
      if (!profile?.id) return;
      try {
        const s = await fetchPatientStats(profile.id, supabase);
        setStats(s);
      } catch { }
    })();
  }, [ profile?.id ]);

  const recentActivities = []

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden bg-gradient-to-r from-red-500 via-red-600 to-red-700 rounded-3xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[url('/placeholder.svg?height=400&width=800')] opacity-10"></div>
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold">
                  Olá,{' '}
                  {profile?.full_name
                    ? profile.full_name.split(' ')[ 0 ] || 'Paciente'
                    : 'Paciente'}
                  !
                </h1>
                <p className="text-red-100 text-lg mt-1">
                  Como está sua jornada de saúde hoje?
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                <p className="text-sm text-red-100">Próxima consulta</p>
                <p className="font-semibold">
                  Nenhuma agendada
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                <p className="text-sm text-red-100">
                  Consultas realizadas
                </p>
                <p className="font-semibold">
                  {stats.completedConsultations}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                <p className="text-sm text-red-100">Sua avaliação</p>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {profile?.rating?.toFixed(1) || 0}
                  </span>
                  <RatingDisplay
                    rating={profile?.rating || 0}
                    totalReviews={profile?.total_reviews || 0}
                    size="sm"
                    showNumber={false}
                    showReviewCount={false}
                    className="text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Target className="h-16 w-16 text-white/80" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Consultas Agendadas"
          value={stats.scheduledConsultations}
          icon={Calendar}
          color="blue"
          // trend={{ value: 0, isPositive: true }}
          description="Este mês"
        />
        <StatsCard
          title="Total de Consultas"
          value={stats.totalConsultations}
          icon={Activity}
          color="green"
          // trend={{ value: 0, isPositive: true }}
          description="Histórico completo"
        />
        <StatsCard
          title="Avaliação Média"
          value={profile?.rating?.toFixed(1) || '0'}
          icon={Star}
          color="yellow"
          // trend={{ value: 0, isPositive: true }}
          description={`Baseado em ${profile?.total_reviews || 0} avaliações`}
        />
        <StatsCard
          title="Nutricionistas Favoritos"
          value={stats.favoriteNutritionists}
          icon={Users}
          color="purple"
          description="Profissionais salvos"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#1E1D40]">
            Ações Rápidas
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700"
          >
            Ver todas <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <PermissionWrapper permission="access_anamnese">
            <Card
              className="group hover-lift cursor-pointer transition-all duration-300 border-0 shadow-lg hover:shadow-xl bg-gradient-to-br from-green-50 to-green-100/50 backdrop-blur-sm"
              onClick={() => setIsAnamneseModalOpen(true)}
            >
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-semibold text-[#1E1D40] mb-2 text-lg">
                  Anamnese Nutricional
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Complete seu histórico de saúde
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  Iniciar <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </PermissionWrapper>

          <PermissionWrapper permission="book_consultations">
            <Card
              className="group hover-lift cursor-pointer transition-all duration-300 border-0 shadow-lg hover:shadow-xl bg-gradient-to-br from-blue-50 to-blue-100/50 backdrop-blur-sm"
              onClick={() => setActiveTab('buscar')}
            >
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Search className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-semibold text-[#1E1D40] mb-2 text-lg">
                  Buscar Nutricionista
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Encontre profissionais próximos a você
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  Buscar agora <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </PermissionWrapper>

          <PermissionWrapper permission="use_iris_bot">
            <Card className="group hover-lift cursor-pointer transition-all duration-300 border-0 shadow-lg hover:shadow-xl bg-gradient-to-br from-purple-50 to-purple-100/50 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Bot className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-semibold text-[#1E1D40] mb-2 text-lg">
                  Chat com IrisBot
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Tire suas dúvidas com IA
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  onClick={() => setActiveTab('iris')}
                >
                  Conversar <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </PermissionWrapper>

          <PermissionWrapper permission="view_public_content">
            <Card
              className="group hover-lift cursor-pointer transition-all duration-300 border-0 shadow-lg hover:shadow-xl bg-gradient-to-br from-orange-50 to-orange-100/50 backdrop-blur-sm"
              onClick={() => router.push('/blog')}
            >
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-semibold text-[#1E1D40] mb-2 text-lg">
                  Dúvidas Públicas
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Perguntas da comunidade
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                >
                  Explorar <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </PermissionWrapper>
        </div>
      </div>

      {/* Recent Activity & Favorites */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-lg backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <span>Atividade Recente</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors duration-200 group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1E1D40] text-sm">
                      {item.title}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {item.description}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">
                    {item.time}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma atividade recente</p>
              </div>
            )}

            <Button
              variant="ghost"
              className="w-full mt-4 text-gray-600 hover:text-gray-800"
            >
              Ver todas as atividades{' '}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <Star className="h-4 w-4 text-white" />
              </div>
              <span>Nutricionistas Favoritos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {favoriteNutritionists.length > 0 ? (
              favoriteNutritionists.slice(0, 3).map((nutritionist, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors duration-200 group"
                >
                  <Avatar className="h-12 w-12 ring-2 ring-gray-200 shadow-md group-hover:scale-105 transition-transform duration-300">
                    <AvatarImage
                      src={
                        nutritionist.nutritionist_profiles
                          ?.profile_image_url ||
                        `/placeholder.svg?height=48&width=48&query=${nutritionist.nutritionist_profiles?.full_name || 'nutritionist profile'}`
                      }
                    />
                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white font-semibold">
                      {nutritionist.nutritionist_profiles?.full_name
                        ? nutritionist.nutritionist_profiles.full_name
                          .split(' ')
                          .map(n => n[ 0 ])
                          .join('') || 'N'
                        : 'N'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1E1D40]">
                      {nutritionist.nutritionist_profiles?.full_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {nutritionist.nutritionist_profiles?.specialties?.join(
                        ', '
                      )}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">
                        {nutritionist.nutritionist_profiles?.rating}
                      </span>
                      <span className="text-sm text-gray-500">
                        (
                        {
                          nutritionist.nutritionist_profiles
                            ?.total_reviews
                        }{' '}
                        avaliações)
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="hover:bg-green-50 hover:text-green-700 hover:border-green-200 bg-transparent"
                  >
                    Consultar
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum favorito ainda</p>
              </div>
            )}

            <Button
              variant="ghost"
              className="w-full mt-4 text-gray-600 hover:text-gray-800"
            >
              Ver todos os favoritos{' '}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Consultas para Avaliar */}
      {profile && (
        <ConsultationsToRate patientId={profile.id} />
      )}
    </div>
  );

}