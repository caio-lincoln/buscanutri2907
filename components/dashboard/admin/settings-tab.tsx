'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Settings, Mail, Key, Save, RefreshCw } from 'lucide-react'
import { toast } from '../../ui/use-toast'

export function SettingsTab() {
  const [platformName, setPlatformName] = useState('Busca Nutri')
  const [contactEmail, setContactEmail] = useState('contato@buscanutri.com')
  const [allowNewRegistrations, setAllowNewRegistrations] = useState(true)
  const [defaultUserRole, setDefaultUserRole] = useState('paciente')
  const [welcomeEmailTemplate, setWelcomeEmailTemplate] = useState(
    'Olá [Nome do Usuário],\n\nBem-vindo à Busca Nutri! Estamos felizes em tê-lo(a) conosco.\n\nAtenciosamente,\nEquipe Busca Nutri'
  )
  const [apiKey, setApiKey] = useState('sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')
  const [isConnectingGmail, setIsConnectingGmail] = useState(false)
  const [gmailConnected, setGmailConnected] = useState(false)

  useEffect(() => {
    // Verifica se há parâmetros de sucesso ou erro na URL
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const error = urlParams.get('error')
    
    if (success === 'gmail_connected') {
      toast({
        title: 'Gmail conectado com sucesso!',
        description: 'Agora você pode enviar emails usando sua conta do Gmail.',
        variant: 'default',
      })
      setGmailConnected(true)
      // Limpa os parâmetros da URL
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (error) {
      toast({
        title: 'Erro ao conectar Gmail',
        description: `Ocorreu um erro: ${error}`,
        variant: 'destructive',
      })
      // Limpa os parâmetros da URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
    
    // Verifica se o Gmail já está conectado
    checkGmailConnection()
  }, [])
  
  const checkGmailConnection = async () => {
    try {
      const response = await fetch('/api/admin/gmail/status')
      const data = await response.json()
      setGmailConnected(data.connected)
    } catch (error) {
      console.error('Erro ao verificar conexão do Gmail:', error)
    }
  }

  const handleConnectGmail = async () => {
    try {
      setIsConnectingGmail(true)
      const response = await fetch('/api/admin/gmail/auth')
      const data = await response.json()
      
      if (data.authUrl) {
        // Redireciona para a URL de autorização do Google
        window.location.href = data.authUrl
      } else {
        throw new Error('URL de autorização não encontrada')
      }
    } catch (error) {
      console.error('Erro ao conectar Gmail:', error)
      toast({
        title: 'Erro ao conectar Gmail',
        description: String(error),
        variant: 'destructive',
      })
    } finally {
      setIsConnectingGmail(false)
    }
  }

  const handleSaveChanges = () => {
    // Save settings logic would go here
    toast({
      title: 'Configurações salvas',
      description: 'As configurações foram salvas com sucesso!',
      variant: 'success',
    })
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
            <Mail className="h-5 w-5 text-gray-600" /> Configurações de Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="gmail-connection">Conexão com Gmail (OAuth)</Label>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${gmailConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>{gmailConnected ? 'Conectado' : 'Desconectado'}</span>
            </div>
            <Button
              onClick={handleConnectGmail}
              disabled={isConnectingGmail}
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isConnectingGmail ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Conectando...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" /> {gmailConnected ? 'Reconectar Gmail' : 'Conectar Gmail'}
                </>
              )}
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              Conecte sua conta do Gmail para enviar emails de boas-vindas e notificações.
            </p>
          </div>
          
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
