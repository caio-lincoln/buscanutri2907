'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Settings, Mail, Key, Save } from 'lucide-react'

export function SettingsTab() {
  const [platformName, setPlatformName] = useState('Busca Nutri')
  const [contactEmail, setContactEmail] = useState('contato@buscanutri.com')
  const [allowNewRegistrations, setAllowNewRegistrations] = useState(true)
  const [defaultUserRole, setDefaultUserRole] = useState('paciente')
  const [welcomeEmailTemplate, setWelcomeEmailTemplate] = useState(
    'Olá [Nome do Usuário],\n\nBem-vindo à Busca Nutri! Estamos felizes em tê-lo(a) conosco.\n\nAtenciosamente,\nEquipe Busca Nutri'
  )
  const [apiKey, setApiKey] = useState('sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')

  const handleSaveChanges = () => {
    // Save settings logic would go here
    alert('Configurações salvas com sucesso!')
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-[#1E1D40]">
        Configurações da Plataforma
      </h2>

      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-[#1E1D40] flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" /> Configurações Gerais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="platform-name">Nome da Plataforma</Label>
            <Input
              id="platform-name"
              value={platformName}
              onChange={e => setPlatformName(e.target.value)}
              className="border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact-email">Email de Contato</Label>
            <Input
              id="contact-email"
              type="email"
              value={contactEmail}
              onChange={e => setContactEmail(e.target.value)}
              className="border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="allow-registrations">
              Permitir Novos Cadastros
            </Label>
            <Switch
              id="allow-registrations"
              checked={allowNewRegistrations}
              onCheckedChange={setAllowNewRegistrations}
            />
          </div>
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleSaveChanges}
          >
            <Save className="h-4 w-4 mr-2" /> Salvar Alterações
          </Button>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-[#1E1D40] flex items-center gap-2">
            <Mail className="h-5 w-5 text-gray-600" /> Modelos de Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="welcome-email">
              Template de Email de Boas-Vindas
            </Label>
            <Textarea
              id="welcome-email"
              value={welcomeEmailTemplate}
              onChange={e => setWelcomeEmailTemplate(e.target.value)}
              className="min-h-[150px] border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Edite o conteúdo do email de boas-vindas. Use [Nome do Usuário] para o nome."
            />
          </div>
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleSaveChanges}
          >
            <Save className="h-4 w-4 mr-2" /> Salvar Template
          </Button>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-[#1E1D40] flex items-center gap-2">
            <Key className="h-5 w-5 text-gray-600" /> Chaves de API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="api-key">Chave de API Principal</Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              className="border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <p className="text-sm text-gray-500">
            Use esta chave para integrações externas. Mantenha-a segura.
          </p>
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleSaveChanges}
          >
            <Save className="h-4 w-4 mr-2" /> Gerar Nova Chave
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
