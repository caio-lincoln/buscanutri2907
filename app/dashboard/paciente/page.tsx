'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { ReadonlyURLSearchParams, usePathname, useRouter, useSearchParams } from 'next/navigation'

import { useAuth } from '@/contexts/auth-context'
import { NotificationsPanel } from '@/components/notifications-panel'
import { DashboardSidebar, getMenuItems } from '@/components/dashboard-sidebar'
import { useDashboardStats } from '@/hooks/use-dashboard-stats'
import RecentChatsList from '@/components/recent-chats-list'
import { PatientForumTab } from '@/components/patient-forum-tab'

import TeleconsultasPage from './teleconsultas/page'
import OverviewTab from './_components/OverviewTab'
import BuscarTab from './_components/BuscarTab'
import IrisTab from './_components/IrisTab'
import PerfilTab from './_components/PerfilTab'
import { AnamneseNutricionalModal } from '../../../components/anamnese-nutricional-modal'
import { createSupabaseClient } from '../../../lib/supabase'

const TABS = [
  'overview',
  'teleconsultas',
  'buscar',
  'chat',
  'cursos',
  'forum',
  'iris',
  'notificacoes',
  'perfil',
] as const;

export type Tab = typeof TABS[ number ];
const isTab = (v: unknown): v is Tab =>
  typeof v === 'string' && (TABS as readonly string[]).includes(v as string);

export default function PatientDashboard() {
  const [ activeTab, setActiveTab ] = useState('overview')
  const router = useRouter()
  const { user, loading: authLoading, signOut, patientProfile: profile, refreshUser } = useAuth()
  const [ anamneseData, setAnamneseData ] = useState<any>(null)

  const pathname = usePathname();
  const searchParams = useSearchParams()
  // Hook para estatísticas dinâmicas do dashboard
  const { stats: dashboardStats, loading: statsLoading } = useDashboardStats({
    userType: 'paciente',
    userId: user?.id || '',
    enabled: !!user?.id,
  })
  const [ isAnamneseModalOpen, setIsAnamneseModalOpen ] = useState(false)

  const menuItems = getMenuItems('paciente', dashboardStats)
  const supabase = useMemo(() => createSupabaseClient(), [])

  useEffect(() => {
    if ((!authLoading && !user) || user?.user_metadata[ 'user_type' ] !== 'paciente') {
      router.push('/login')
      return
    }
  }, [ user, authLoading ])

  useEffect(() => {
    const param = searchParams?.get('activeTab');
    if (isTab(param) && param !== activeTab) {
      setActiveTab(param);
    }
  }, [ searchParams, activeTab ]);

  useEffect(() => {
    if (profile?.user_id) {
      loadAnamneseData(profile.user_id)
    }
  }, [ profile?.user_id ])

  const loadAnamneseData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('anamnese_nutricional')
        .select('*')
        .eq('patient_id', userId)
        .single()

      if (data && !error) {
        setAnamneseData(data)
      }
    } catch (error) {
      // Silent handling for missing anamnese data
    }
  }

  const setTab = useCallback(
    (tab: Tab) => {
      setActiveTab(tab);
      const sp = new URLSearchParams(searchParams as ReadonlyURLSearchParams);
      sp.set('activeTab', tab);
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    },
    [ router, pathname, searchParams ]
  );

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.log("🚀 ~ handleSignOut ~ error:", error)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50/50 via-white to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-200 border-t-red-500 mx-auto"></div>
          <p className="text-[#1E1D40]/70 font-medium">
            Carregando seu dashboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <DashboardSidebar
      userType="paciente"
      userName={profile?.full_name || 'Paciente'}
      userAvatar={profile?.profile_image_url || '/placeholder.svg'}
      menuItems={menuItems}
      activeItem={activeTab}
      onItemClick={(item) => {
        setTab(item as Tab)
      }}
      onSignOut={handleSignOut}
    >
      <div className="space-y-8">
        {/* Overview Dashboard */}
        {activeTab === 'overview' && (
          <OverviewTab setActiveTab={setTab} setIsAnamneseModalOpen={setIsAnamneseModalOpen} />
        )}

        {/* Buscar Nutricionista */}
        {activeTab === 'buscar' && (
          <BuscarTab />
        )}

        {/* Iris Chat */}
        {activeTab === 'iris' && (
          <IrisTab />
        )}

        {/* Chat */}
        {activeTab === 'chat' && (
          <div className="space-y-8">
            {profile?.user_id && <RecentChatsList userId={profile.user_id} />}
            {!profile?.user_id && (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  Por favor, faça login para ver seus chats.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Dúvidas (Fórum de Pacientes) */}
        {activeTab === 'duvidas' && <PatientForumTab />}

        {/* Notificações */}
        {activeTab === 'notificacoes' && (
          <div className="space-y-8">
            <NotificationsPanel userType="paciente" />
          </div>
        )}

        {/* Perfil */}
        {activeTab === 'perfil' && (
          <PerfilTab anamneseData={anamneseData} />
        )}

        {/* Conteúdo padrão para outras abas */}
        {![
          'overview',
          'buscar',
          'iris',
          'notificacoes',
          'perfil',
          'chat',
          'duvidas',
        ].includes(activeTab) && (
            <div className="space-y-8">
              <TeleconsultasPage />
            </div>
          )}
      </div>

      {profile && (
        <AnamneseNutricionalModal
          open={isAnamneseModalOpen}
          onOpenChange={setIsAnamneseModalOpen}
          patientId={profile.user_id}
          onComplete={async data => {
            setIsAnamneseModalOpen(false)
            // Atualizar dados da anamnese imediatamente
            setAnamneseData(data)
            // Recarregar perfil para garantir sincronização
            refreshUser()
          }}
        />
      )}
    </DashboardSidebar>
  )
}
