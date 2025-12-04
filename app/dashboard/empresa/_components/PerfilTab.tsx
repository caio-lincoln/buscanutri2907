'use client'

import {
  Building,
  User,
  FileText,
  Phone,
  Globe,
  MapPin,
  Users,
  Briefcase,
  Hash,
  UserCheck,
  Settings,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { Button } from '../../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../../../../components/ui/avatar'
import { useState } from 'react'
const CompanyProfileModal = dynamic(
  () =>
    import('../../../../components/company-profile-modal').then(
      (mod) => mod.CompanyProfileModal
    ),
  {
    ssr: false,
    loading: () => null,
  }
)
import type { CompanyProfile } from '../../../../lib/supabase'

interface PerfilTabProps {
  profile: CompanyProfile | null
  onProfileUpdate: () => void
}

export default function PerfilTab({ profile, onProfileUpdate }: PerfilTabProps) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">
              Perfil da Empresa
            </h1>
            <p className="text-gray-600">
              Visualize e gerencie as informações da sua empresa
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setIsProfileModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Settings className="h-4 w-4 mr-2" />
              Editar Perfil da Empresa
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informações da Empresa */}
          <Card className="border-0 shadow-lg backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Building className="h-4 w-4 text-white" />
                </div>
                <span>Informações da Empresa</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center">
                <Avatar className="h-20 w-20 mb-4">
                  <AvatarImage
                    src={
                      profile?.logo_url ||
                      `/placeholder.svg?height=80&width=80&query=${profile?.company_name || 'company'} logo`
                    }
                  />
                  <AvatarFallback className="bg-gray-200 text-gray-600 text-xl font-semibold">
                    {profile?.company_name?.charAt(0).toUpperCase() || 'E'}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    CNPJ
                  </label>
                  <p className="text-[#1E1D40] font-semibold">
                    {profile?.cnpj || 'Não informado'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Setor
                  </label>
                  <p className="text-[#1E1D40] font-semibold">
                    {profile?.industry || 'Não informado'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Porte da Empresa
                  </label>
                  <p className="text-[#1E1D40] font-semibold">
                    {profile?.company_size || 'Não informado'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Telefone
                  </label>
                  <p className="text-[#1E1D40] font-semibold">
                    {profile?.phone || 'Não informado'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Website
                  </label>
                  <p className="text-[#1E1D40] font-semibold">
                    {profile?.website || 'Não informado'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    E-mail
                  </label>
                  <p className="text-[#1E1D40] font-semibold">
                    {profile?.email || 'Não informado'}
                  </p>
                </div>
                {profile?.address && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-600">
                      Endereço
                    </label>
                    <p className="text-[#1E1D40] font-semibold">
                      {profile.address}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Descrição da Empresa */}
          <Card className="border-0 shadow-lg backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <span>Sobre a Empresa</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Descrição
                </label>
                <p className="text-[#1E1D40] font-medium text-sm mt-2 leading-relaxed">
                  {profile?.description || 'Nenhuma descrição informada'}
                </p>
              </div>
              {profile?.address && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Endereço
                  </label>
                  <p className="text-[#1E1D40] font-semibold">
                    {profile.address}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações do Responsável */}
          <Card className="border-0 shadow-lg backdrop-blur-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <UserCheck className="h-4 w-4 text-white" />
                </div>
                <span>Responsável pela Empresa</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Nome do Responsável
                  </label>
                  <p className="text-[#1E1D40] font-semibold">
                    {profile?.responsible_name || 'Não informado'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Cargo
                  </label>
                  <p className="text-[#1E1D40] font-semibold">
                    {profile?.responsible_position || 'Não informado'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    CPF
                  </label>
                  <p className="text-[#1E1D40] font-semibold">
                    {profile?.responsible_cpf || 'Não informado'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {profile && (
        <CompanyProfileModal
          open={isProfileModalOpen}
          onOpenChange={setIsProfileModalOpen}
          initialData={profile}
          onProfileUpdate={onProfileUpdate}
        />
      )}
    </>
  )
}
