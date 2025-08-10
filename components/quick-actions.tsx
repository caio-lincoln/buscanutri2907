'use client'

import type React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  MessageCircle,
  Search,
  Heart,
  BookOpen,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  href?: string
  onClick?: () => void
}

interface QuickActionsProps {
  userType?: 'paciente' | 'nutricionista' | 'empresa' | 'admin'
  className?: string
}

const quickActionsData = {
  paciente: [
    {
      id: 'agendar',
      title: 'Agendar Consulta',
      description: 'Marque uma consulta com um nutricionista',
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      href: '/dashboard/paciente/agendamento',
    },
    {
      id: 'buscar',
      title: 'Buscar Nutricionistas',
      description: 'Encontre o profissional ideal para você',
      icon: Search,
      color: 'from-green-500 to-green-600',
      href: '/dashboard/paciente/nutricionistas',
    },
    {
      id: 'chat',
      title: 'Chat com IrisBot',
      description: 'Tire suas dúvidas sobre nutrição',
      icon: MessageCircle,
      color: 'from-purple-500 to-purple-600',
      href: '/dashboard/paciente/chat',
    },
    {
      id: 'favoritos',
      title: 'Meus Favoritos',
      description: 'Veja seus nutricionistas favoritos',
      icon: Heart,
      color: 'from-red-500 to-red-600',
      href: '/dashboard/paciente/favoritos',
    },
  ],
  nutricionista: [
    {
      id: 'agenda',
      title: 'Minha Agenda',
      description: 'Gerencie seus horários e consultas',
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      href: '/dashboard/nutricionista/agenda',
    },
    {
      id: 'pacientes',
      title: 'Meus Pacientes',
      description: 'Acompanhe o progresso dos pacientes',
      icon: Search,
      color: 'from-green-500 to-green-600',
      href: '/dashboard/nutricionista/pacientes',
    },
    {
      id: 'chat',
      title: 'Chat com Pacientes',
      description: 'Converse com seus pacientes',
      icon: MessageCircle,
      color: 'from-purple-500 to-purple-600',
      href: '/dashboard/nutricionista/chat',
    },
    {
      id: 'recursos',
      title: 'Recursos Educativos',
      description: 'Acesse materiais e cursos',
      icon: BookOpen,
      color: 'from-orange-500 to-orange-600',
      href: '/dashboard/nutricionista/recursos',
    },
  ],
  empresa: [
    {
      id: 'buscar',
      title: 'Buscar Nutricionistas',
      description: 'Encontre profissionais para sua equipe',
      icon: Search,
      color: 'from-blue-500 to-blue-600',
      href: '/dashboard/empresa/nutricionistas',
    },
    {
      id: 'candidatos',
      title: 'Gerenciar Candidatos',
      description: 'Acompanhe processos seletivos',
      icon: Calendar,
      color: 'from-green-500 to-green-600',
      href: '/dashboard/empresa/candidatos',
    },
    {
      id: 'chat',
      title: 'Chat Corporativo',
      description: 'Converse com nutricionistas',
      icon: MessageCircle,
      color: 'from-purple-500 to-purple-600',
      href: '/dashboard/empresa/chat',
    },
    {
      id: 'configuracoes',
      title: 'Configurações',
      description: 'Gerencie perfil da empresa',
      icon: Settings,
      color: 'from-gray-500 to-gray-600',
      href: '/dashboard/empresa/configuracoes',
    },
  ],
  admin: [
    {
      id: 'usuarios',
      title: 'Gerenciar Usuários',
      description: 'Administre usuários da plataforma',
      icon: Search,
      color: 'from-blue-500 to-blue-600',
      href: '/dashboard/admin/usuarios',
    },
    {
      id: 'relatorios',
      title: 'Relatórios',
      description: 'Visualize métricas e estatísticas',
      icon: BookOpen,
      color: 'from-green-500 to-green-600',
      href: '/dashboard/admin/relatorios',
    },
    {
      id: 'configuracoes',
      title: 'Configurações',
      description: 'Gerencie configurações do sistema',
      icon: Settings,
      color: 'from-purple-500 to-purple-600',
      href: '/dashboard/admin/configuracoes',
    },
    {
      id: 'suporte',
      title: 'Suporte',
      description: 'Gerencie tickets de suporte',
      icon: MessageCircle,
      color: 'from-orange-500 to-orange-600',
      href: '/dashboard/admin/suporte',
    },
  ],
}

export function QuickActions({
  userType = 'paciente',
  className,
}: QuickActionsProps) {
  const actions = quickActionsData[userType] || quickActionsData.paciente

  return (
    <Card className={cn('shadow-lg border-0', className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-[#1E1D40]">
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {actions.map(action => (
            <Button
              key={action.id}
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-3 hover:shadow-md transition-all duration-300 border-gray-200 hover:border-gray-300"
              onClick={action.onClick}
              asChild={!!action.href}
            >
              {action.href ? (
                <a href={action.href} className="w-full">
                  <div className="flex items-center gap-3 w-full">
                    <div
                      className={cn(
                        'w-10 h-10 bg-gradient-to-br rounded-lg flex items-center justify-center shadow-sm',
                        action.color
                      )}
                    >
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm text-[#1E1D40]">
                        {action.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </a>
              ) : (
                <div className="flex items-center gap-3 w-full">
                  <div
                    className={cn(
                      'w-10 h-10 bg-gradient-to-br rounded-lg flex items-center justify-center shadow-sm',
                      action.color
                    )}
                  >
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm text-[#1E1D40]">
                      {action.title}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {action.description}
                    </p>
                  </div>
                </div>
              )}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
