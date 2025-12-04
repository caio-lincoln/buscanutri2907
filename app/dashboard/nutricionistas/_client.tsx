'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Card, } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { NotificationsPanel } from '@/components/notifications-panel'
import { DashboardSidebar, getMenuItems } from '@/components/dashboard-sidebar'
import { IrisChat } from '@/components/iris-chat'
import { ReportsTab } from '@/components/dashboard/nutricionistas/reports-tab'
import { CoursesTab } from '@/components/dashboard/nutricionistas/courses-tab'
import { JobsTab } from '@/components/dashboard/nutricionistas/jobs-tab'
import { ForumTab } from '@/components/dashboard/nutricionistas/forum-tab'
import { BlogTab } from '@/components/dashboard/nutricionistas/blog-tab'
import { ApplicationsTab } from '@/components/dashboard/nutricionistas/applications-tab'

import { AppointmentsTab } from '@/components/dashboard/nutricionistas/appointments-tab' // Importar a nova aba de agenda
import SubscriptionCard from '../../../components/SubscriptionCard'
import NutricionistaTeleconsultasTab from '../../../components/dashboard/nutricionistas/nutritionist-teleconsultation-tab'
import OverviewTab from '../../../components/dashboard/nutricionistas/overview-tab'
import NutritionistPresenciaisTab from '../../../components/dashboard/nutricionistas/nutritionist-presenciais-tab'
import { Bot } from 'lucide-react'
import { useSubscriptionContext } from '../../../contexts/subscription-context'
import NutritionistRecentChatsList from './_components/NutriotinistRecentChatsList'
import Loading from '@/components/ui/loading'

const TABS = [
  'overview',
  'agenda',
  'chat',
  'relatorios',
  'cursos',
  'vagas',
  'candidaturas',
  'blog',
  'forum',
  'iris',
  'notificacoes',
  'assinatura',
  'teleconsultas',
  'presenciais',
] as const;

export type Tab = typeof TABS[ number ];
const isTab = (v: unknown): v is Tab =>
  typeof v === 'string' && (TABS as readonly string[]).includes(v as string);

export default function NutritionistDashboard() {
  const { hasActiveSubscription } = useSubscriptionContext()

  const [ loading, setLoading ] = useState(true)
  const [ activeTab, setActiveTab ] = useState('overview')
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const router = useRouter()
  const { user, nutritionistProfile, loading: authLoading, signOut } = useAuth()

  // Hook para estatísticas dinâmicas do dashboard
  // const { stats: dashboardStats } = useDashboardStats({
  //   userType: 'nutricionista',
  //   userId: nutritionistProfile?.user_id || '',
  //   enabled: !!nutritionistProfile?.user_id,
  // })

  const menuItems = useMemo(
    () => getMenuItems('nutricionista', undefined, { hasActiveSubscription }),
    [ hasActiveSubscription ]
  );

  const setTab = useCallback(
    (tab: Tab) => {
      setActiveTab(tab);
      const sp = new URLSearchParams(searchParams);
      sp.set('activeTab', tab);
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    },
    [ router, pathname, searchParams ]
  );

  useEffect(() => {
    const param = searchParams.get('activeTab');
    if (isTab(param) && param !== activeTab) {
      setActiveTab(param);
    }
  }, [ searchParams, activeTab ]);

  useEffect(() => {
    if ((!authLoading && !user) || user?.user_metadata[ 'user_type' ] !== 'nutricionista') {
      router.push('/login')
      return
    }

    if (nutritionistProfile?.user_id) {
      setLoading(false)
    }
  }, [ user, authLoading, nutritionistProfile?.user_id ])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      // Error signing out - handled silently
    }
  }

  if (authLoading || loading) {
    return <Loading message="Carregando seu dashboard..." />
  }

  const handleItemClick = (itemId: string) => {
    if (itemId === 'perfil' && nutritionistProfile?.id) {
      router.push(`/dashboard/nutricionistas/${nutritionistProfile.id}`)
    } else if (isTab(itemId)) {
      setTab(itemId)
    }
  }

  return (
    <DashboardSidebar
      userType="nutricionista"
      userName={nutritionistProfile?.full_name || 'Nutricionista'}
      userAvatar={nutritionistProfile?.profile_image_url || '/placeholder.svg'}
      menuItems={menuItems}
      activeItem={activeTab}
      onItemClick={handleItemClick}
      onSignOut={handleSignOut}
    >
      <div className="space-y-8">
        {/* Overview Dashboard */}
        {activeTab === 'overview' && (
          <OverviewTab setActiveTab={setTab} />
        )}

        {activeTab === 'chat' && (
          <div className="space-y-8">
            <NutritionistRecentChatsList userId={user?.id as string} />
          </div>
        )}

        {/* Agenda (Nova aba dedicada) */}
        {activeTab === 'agenda' && nutritionistProfile?.user_id && (
          <AppointmentsTab userId={nutritionistProfile.user_id} />
        )}

        {/* Relatórios */}
        {activeTab === 'relatorios' && <ReportsTab />}

        {/* Cursos */}
        {activeTab === 'cursos' && <CoursesTab />}

        {/* Vagas */}
        {activeTab === 'vagas' && <JobsTab />}

        {/* Candidaturas */}
        {activeTab === 'candidaturas' && <ApplicationsTab />}

        {/* Blog */}
        {activeTab === 'blog' && <BlogTab />}

        {/* Fórum */}
        {activeTab === 'forum' && <ForumTab />}

        {/* Iris Chat */}
        {activeTab === 'iris' && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                <Bot className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">
                  Chat com IrisBot
                </h1>
                <p className="text-gray-600 text-lg">
                  Sua assistente virtual para nutricionistas
                </p>
              </div>
            </div>

            <Card className="border-0 shadow-2xl backdrop-blur-sm">
              <IrisChat userType="nutricionista" />
            </Card>
          </div>
        )}

        {/* Notificações */}
        {activeTab === 'notificacoes' && (
          <div className="space-y-8">
            <NotificationsPanel userType="nutricionista" />
          </div>
        )}
        {activeTab === 'assinatura' && (
          <SubscriptionCard />
        )}

        {/* Perfil */}
        {/* {activeTab === 'perfil' && (
          <PerfilPage />
        )} */}

        {/* Conteúdo padrão para outras abas que não foram detalhadas acima */}
        {activeTab === 'teleconsultas' && (
          <div className="space-y-8">
            <NutricionistaTeleconsultasTab />
          </div>
        )}

        {activeTab === 'presenciais' && nutritionistProfile?.id && (
          <div className="space-y-8">
            <NutritionistPresenciaisTab nutritionistId={nutritionistProfile.id} />
          </div>
        )}
      </div>

    </DashboardSidebar>
  )
}
