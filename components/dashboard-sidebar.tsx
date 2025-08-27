'use client'

import type * as React from 'react'
import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Calendar,
  Users,
  MessageSquare,
  Briefcase,
  Settings,
  Search,
  Video,
  HelpCircle,
  Bell,
  User,
  BookOpen,
  BarChart3,
  Building,
  Shield,
  Cog,
  DollarSign,
  TrendingUp,
  FileText,
  LogOut,
  ChevronDown,
  Home,
  Bot,
  CreditCard,
} from 'lucide-react'
import Image from 'next/image'
import { useMediaQuery } from '../hooks/use-media-query'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/auth-context'

export interface DashboardMenuItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  badge?: {
    count: number
    variant?: 'default' | 'destructive' | 'outline' | 'secondary'
  }
  isActive?: boolean
}

export interface DashboardSidebarProps {
  userType: 'paciente' | 'nutricionista' | 'empresa' | 'admin'
  userName?: string
  userAvatar?: string
  menuItems?: DashboardMenuItem[]
  activeItem?: string
  onItemClick?: (itemId: string) => void
  onSignOut?: () => void
  children?: React.ReactNode
}

const userTypeConfig = {
  paciente: {
    primaryColor: '#D90D32',
    secondaryColor: '#FF6B8A',
    bgGradient: 'from-red-50/50 via-white to-white',
    sidebarBg: 'bg-white/95 backdrop-blur-sm',
    borderColor: 'border-red-100',
    textColor: 'text-red-600',
    iconBg: 'bg-gradient-to-br from-red-500 to-red-600',
    hoverBg: 'hover:bg-red-50/80',
    activeBg: 'bg-gradient-to-r from-red-50 to-red-100/60',
    activeText: 'text-red-700',
    activeBorder: 'border-red-200',
  },
  nutricionista: {
    primaryColor: '#4AB0D9',
    secondaryColor: '#7BC8E8',
    bgGradient: 'from-blue-50/50 via-white to-white',
    sidebarBg: 'bg-white/95 backdrop-blur-sm',
    borderColor: 'border-blue-100',
    textColor: 'text-blue-600',
    iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
    hoverBg: 'hover:bg-blue-50/80',
    activeBg: 'bg-gradient-to-r from-blue-50 to-blue-100/60',
    activeText: 'text-blue-700',
    activeBorder: 'border-blue-200',
  },
  empresa: {
    primaryColor: '#1E1D40',
    secondaryColor: '#4A4A6A',
    bgGradient: 'from-slate-50/50 via-white to-white',
    sidebarBg: 'bg-white/95 backdrop-blur-sm',
    borderColor: 'border-slate-100',
    textColor: 'text-slate-700',
    iconBg: 'bg-gradient-to-br from-slate-600 to-slate-700',
    hoverBg: 'hover:bg-slate-50/80',
    activeBg: 'bg-gradient-to-r from-slate-50 to-slate-100/60',
    activeText: 'text-slate-800',
    activeBorder: 'border-slate-200',
  },
  admin: {
    primaryColor: '#059669',
    secondaryColor: '#10B981',
    bgGradient: 'from-emerald-50/50 via-white to-white',
    sidebarBg: 'bg-white/95 backdrop-blur-sm',
    borderColor: 'border-emerald-100',
    textColor: 'text-emerald-600',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    hoverBg: 'hover:bg-emerald-50/80',
    activeBg: 'bg-gradient-to-r from-emerald-50 to-emerald-100/60',
    activeText: 'text-emerald-700',
    activeBorder: 'border-emerald-200',
  },
}

export function DashboardSidebar({
  userType,
  userName = '',
  userAvatar,
  menuItems = [],
  activeItem = '',
  onItemClick = () => { },
  onSignOut = () => { },
  children,
}: DashboardSidebarProps) {
  const config = userTypeConfig[ userType ] || userTypeConfig.paciente

  return (
    <SidebarProvider>
      <SidebarShell userType={userType}
        userName={userName}
        userAvatar={userAvatar}
        menuItems={menuItems}
        activeItem={activeItem}
        onItemClick={onItemClick}
        onSignOut={onSignOut} />

      {/* Conteúdo principal */}
      <SidebarInset className={cn('flex-1', config.bgGradient)}>
        {/* Header móvel com trigger */}
        <div className="md:hidden flex items-center justify-between p-4 border-b bg-white/90 backdrop-blur-sm sticky top-0 z-40">
          <SidebarTrigger className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg transition-colors" />
          <div className="flex items-center gap-2">
            <Image
              src="/Rosa.png"
              alt="Busca Nutri"
              width={120}
              height={24}
              className="h-6 w-auto"
            />
          </div>
          <div className="w-8 h-8" /> {/* Spacer para centralizar o logo */}
        </div>

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
          <div className="animate-fade-in-up max-w-7xl mx-auto">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function SidebarShell({
  userType,
  userName,
  userAvatar,
  menuItems,
  activeItem,
  onItemClick,
  onSignOut,
}: DashboardSidebarProps) {
  const config = userTypeConfig[ userType ] || userTypeConfig.paciente
  const { setOpen, setOpenMobile, openMobile } = useSidebar()
  const isMobile = useMediaQuery('(max-width: 800px)')

  const router = useRouter()
  const { nutritionistProfile, patientProfile, companyProfile } = useAuth()

  const myProfileUrl = useMemo(() => {
    switch (userType) {
      case 'nutricionista':
        return `/dashboard/nutricionistas/${nutritionistProfile?.id}`
      case 'paciente':
        return `/dashboard/nutricionistas/${patientProfile?.id}`
      case 'empresa':
        return `/dashboard/nutricionistas/${companyProfile?.id}`
    }

    return ''
  }, [])

  return (
    <Sidebar className={cn('border-r-0 shadow-xl bg-white')}>
      {/* Header com Logo */}
      <SidebarHeader className="border-b border-gray-100/50 bg-white/90 backdrop-blur-sm p-6">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10">
            <Image
              src="/Rosa.png"
              alt="Busca Nutri"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h2 className="font-bold text-lg text-[#1E1D40]">Busca Nutri</h2>
            <p className="text-xs text-gray-500 capitalize">{userType}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-6 custom-scrollbar bg-white">
        <SidebarMenu className="space-y-2">
          {menuItems.length > 0 &&
            menuItems.map((item, index) => {
              const Icon = item.icon
              const isActive = activeItem === item.id
              return (
                <SidebarMenuItem
                  key={item.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <SidebarMenuButton
                    onClick={() => {
                      onItemClick(item.id)
                      if (isMobile) {
                        setOpenMobile(false)
                        setOpen(false)
                      }
                    }}
                    className={cn(
                      'w-full justify-start gap-3 px-4 py-3 rounded-xl transition-all duration-300 group',
                      'hover:shadow-md hover-lift transform hover:scale-[1.02]',
                      config.hoverBg,
                      isActive && [
                        config.activeBg,
                        config.activeBorder,
                        config.activeText,
                        'border shadow-lg font-semibold transform scale-[1.02]',
                      ]
                    )}
                  >
                    <div
                      className={cn(
                        'p-2 rounded-lg transition-all duration-300 shadow-sm',
                        isActive
                          ? config.iconBg
                          : 'bg-gray-100 group-hover:bg-gray-200 group-hover:shadow-md'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4 transition-all duration-300',
                          isActive
                            ? 'text-white'
                            : 'text-gray-600 group-hover:text-gray-700'
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        'flex-1 font-medium text-sm',
                        isActive && 'text-current'
                      )}
                    >
                      {item.label}
                    </span>
                    {item.badge && (
                      <Badge
                        variant={item.badge.variant || 'default'}
                        className={cn(
                          'h-5 px-2 text-xs font-semibold transition-all duration-300 shadow-sm',
                          isActive
                            ? 'bg-white/25 text-current border-current/30 shadow-md'
                            : 'bg-gray-200 text-gray-700 group-hover:bg-gray-300 group-hover:shadow-md'
                        )}
                      >
                        {item.badge.count}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )

            })}
        </SidebarMenu>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-gray-100/50 p-4 bg-white/90 backdrop-blur-sm">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between px-3 py-3 h-auto hover:bg-gray-100 rounded-xl transition-all duration-300 hover-lift shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-gray-200 shadow-md">
                  <AvatarImage src={userAvatar || '/placeholder.svg'} />
                  <AvatarFallback className={config.iconBg}>
                    <span className="text-white font-semibold text-sm">
                      {userName.charAt(0)}
                    </span>
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-semibold text-[#1E1D40] truncate max-w-[120px]">
                    {userName}
                  </span>
                  <span
                    className={cn(
                      'text-xs font-medium capitalize',
                      config.textColor
                    )}
                  >
                    {userType}
                  </span>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 shadow-2xl border-0 bg-white/95 backdrop-blur-md rounded-xl"
          >
            <DropdownMenuItem onClick={() => {
              router.push(myProfileUrl as string)
            }} className="hover:bg-gray-50 rounded-lg m-2 p-3 transition-colors duration-200">
              <User className="h-4 w-4 mr-3 text-gray-600" />
              <span className="font-medium text-sm">Meu Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-2" />
            <DropdownMenuItem
              onClick={onSignOut}
              className="text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg m-2 p-3 transition-colors duration-200"
            >
              <LogOut className="h-4 w-4 mr-3" />
              <span className="font-medium text-sm">Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

type DashboardMenuItem = {
  id: string
  label: string
  href?: string
  icon: any
  badge?: { count: number; variant: 'default' | 'outline' | 'destructive' }
  requiresSubscription?: boolean  // << NOVO
}

// Itens que exigem assinatura por tipo de usuário
const SUBS_GATE_BY_ROLE: Record<string, Set<string>> = {
  nutricionista: new Set([
    'teleconsultas',
    'chat',
    'blog',
    'forum',
    'vagas',
    'candidaturas',
    'cursos',
    'relatorios',
    'iris',
    // 'notificacoes' e 'perfil' ficam liberados
  ]),
  // se quiser aplicar para outras roles depois
}

// Aplica o “gate” de assinatura
function applySubscriptionGate(
  items: DashboardMenuItem[],
  userType: string,
  hasActiveSubscription?: boolean
) {
  // Se não é nutricionista ou assinatura está ok, não mexe
  if (userType !== 'nutricionista' || hasActiveSubscription) return items

  const gated = SUBS_GATE_BY_ROLE[ userType ] ?? new Set<string>()
  // esconda apenas os itens marcados; "assinatura" continua visível
  return items.map(i =>
    gated.has(i.id) ? { ...i, requiresSubscription: true } : i
  ).filter(i => !i.requiresSubscription)
}

// ------------------------------
// SUA FUNÇÃO com um 3º parâmetro
// ------------------------------
export const getMenuItems = (
  userType: string,
  stats?: {
    upcomingAppointments?: number
    availableJobs?: number
    unreadNotifications?: number
    pendingReports?: number
    pendingModerations?: number
  },
  opts?: { hasActiveSubscription?: boolean }  // << NOVO
): DashboardMenuItem[] => {
  const {
    upcomingAppointments = 0,
    availableJobs = 0,
    unreadNotifications = 0,
    pendingReports = 0,
    pendingModerations = 0,
  } = stats || {}

  switch (userType) {
    case 'paciente': {
      const items: DashboardMenuItem[] = [
        { id: 'overview', label: 'Início', href: '/dashboard/paciente', icon: Home },
        {
          id: 'teleconsultas',
          label: 'Teleconsultas',
          icon: Video,
          href: '/dashboard/paciente/teleconsultas',
          badge: upcomingAppointments > 0 ? { count: upcomingAppointments, variant: 'default' } : undefined,
        },
        { id: 'buscar', label: 'Buscar', icon: Search },
        { id: 'chat', label: 'Chat', icon: MessageSquare },
        { id: 'duvidas', label: 'Fórum', icon: HelpCircle },
        { id: 'iris', label: 'IrisBot', icon: Bot },
        {
          id: 'notificacoes',
          label: 'Notificações',
          icon: Bell,
          badge: unreadNotifications > 0 ? { count: unreadNotifications, variant: 'destructive' } : undefined,
        },
        { id: 'perfil', label: 'Meu Perfil', icon: User },
      ]
      return items
    }

    case 'nutricionista': {
      const items: DashboardMenuItem[] = [
        { id: 'overview', label: 'Visão Geral', icon: Home, href: '/dashboard/nutricionistas' },
        {
          id: 'teleconsultas',
          label: 'Teleconsultas',
          icon: Video,
          href: '/dashboard/nutricionistas/teleconsultas',
        },
        { id: 'chat', label: 'Chat', icon: MessageSquare },
        { id: 'blog', label: 'Blog', icon: BookOpen },
        { id: 'forum', label: 'Fórum', icon: MessageSquare },
        {
          id: 'vagas',
          label: 'Vagas',
          icon: Briefcase,
          badge: availableJobs > 0 ? { count: availableJobs, variant: 'outline' } : undefined,
        },
        { id: 'candidaturas', label: 'Candidaturas', icon: FileText },
        { id: 'cursos', label: 'Cursos', icon: Users },
        { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
        { id: 'iris', label: 'IrisBot', icon: Bot },
        {
          id: 'notificacoes',
          label: 'Notificações',
          icon: Bell,
          badge: unreadNotifications > 0 ? { count: unreadNotifications, variant: 'destructive' } : undefined,
        },
        { id: 'assinatura', label: 'Assinatura', icon: CreditCard, href: '/dashboard/nutricionistas/assinatura' },
        { id: 'perfil', label: 'Meu Perfil', icon: User, href: '/dashboard/nutricionistas/perfil' },
      ]
      return applySubscriptionGate(items, userType, opts?.hasActiveSubscription)
    }

    case 'empresa': {
      const items: DashboardMenuItem[] = [
        { id: 'overview', label: 'Visão Geral', icon: Home },
        {
          id: 'vagas',
          label: 'Vagas',
          icon: Briefcase,
          badge: availableJobs > 0 ? { count: availableJobs, variant: 'default' } : undefined,
        },
        { id: 'candidatos', label: 'Candidatos', icon: Users },
        { id: 'processos', label: 'Processos', icon: FileText },
        { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
        {
          id: 'notificacoes',
          label: 'Notificações',
          icon: Bell,
          badge: unreadNotifications > 0 ? { count: unreadNotifications, variant: 'destructive' } : undefined,
        },
        { id: 'perfil', label: 'Perfil', icon: Building },
      ]
      return items
    }

    case 'admin': {
      const items: DashboardMenuItem[] = [
        { id: 'overview', label: 'Visão Geral', icon: Home },
        { id: 'usuarios', label: 'Usuários', icon: Users },
        { id: 'vagas', label: 'Vagas', icon: Briefcase },
        {
          id: 'relatorios',
          label: 'Relatórios',
          icon: FileText,
          badge: pendingReports > 0 ? { count: pendingReports, variant: 'destructive' } : undefined,
        },
        { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
        { id: 'analytics', label: 'Analytics', icon: TrendingUp },
        {
          id: 'moderacao',
          label: 'Moderação',
          icon: Shield,
          badge: pendingModerations > 0 ? { count: pendingModerations, variant: 'outline' } : undefined,
        },
        { id: 'sistema', label: 'Sistema', icon: Cog },
        { id: 'configuracoes', label: 'Configurações', icon: Settings },
        {
          id: 'notificacoes',
          label: 'Notificações',
          icon: Bell,
          badge: unreadNotifications > 0 ? { count: unreadNotifications, variant: 'destructive' } : undefined,
        },
      ]
      return items
    }

    default:
      return []
  }
}