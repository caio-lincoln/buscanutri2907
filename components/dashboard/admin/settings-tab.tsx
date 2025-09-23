'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Settings, Mail, Key, Save, RefreshCw, Info, Code, FileText } from 'lucide-react'
import { toast } from '../../ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export function SettingsTab() {
  const [ platformName, setPlatformName ] = useState('Busca Nutri')
  const [ contactEmail, setContactEmail ] = useState('contato@buscanutri.com')
  const [ allowNewRegistrations, setAllowNewRegistrations ] = useState(true)
  const [ defaultUserRole, setDefaultUserRole ] = useState('paciente')

  // Templates de email HTML para cada tipo de usuário
  const [ nutritionistEmailHtml, setNutritionistEmailHtml ] = useState('')
  const [ patientEmailHtml, setPatientEmailHtml ] = useState('')
  const [ companyEmailHtml, setCompanyEmailHtml ] = useState('')

  // Templates de email texto para cada tipo de usuário
  const [ nutritionistEmailText, setNutritionistEmailText ] = useState('')
  const [ patientEmailText, setPatientEmailText ] = useState('')
  const [ companyEmailText, setCompanyEmailText ] = useState('')

  // Formato selecionado para cada tipo de usuário (padrão: text)
  const [ nutritionistFormat, setNutritionistFormat ] = useState('html')
  const [ patientFormat, setPatientFormat ] = useState('html')
  const [ companyFormat, setCompanyFormat ] = useState('html')

  const [ apiKey, setApiKey ] = useState('sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')
  const [ isConnectingGmail, setIsConnectingGmail ] = useState(true)
  const [ gmailConnected, setGmailConnected ] = useState(false)

  // Placeholders permitidos
  const placeholders = [ 'name', 'role', 'dashboard_url', 'app_name', 'support_email' ]

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
      setIsConnectingGmail(false)
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
      setIsConnectingGmail(false)
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

  const handleSaveChanges = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform_name: platformName,
          contact_email: contactEmail,
          allow_registrations: allowNewRegistrations,
          default_user_role: defaultUserRole,
          welcome_nutritionist_html: nutritionistEmailHtml,
          welcome_nutritionist_text: nutritionistEmailText,
          welcome_patient_html: patientEmailHtml,
          welcome_patient_text: patientEmailText,
          welcome_company_html: companyEmailHtml,
          welcome_company_text: companyEmailText,
          api_key: apiKey
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error.message)
      }

      toast({
        title: 'Configurações salvas',
        description: 'As configurações foram salvas com sucesso!',
        variant: 'default',
      })
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      toast({
        title: 'Erro ao salvar configurações',
        description: String(error),
        variant: 'destructive',
      })
    }
  }

  // Adicionar useEffect para carregar as configurações
  useEffect(() => {
    // Função para carregar as configurações
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings')
        const data = await response.json()

        if (data.data) {
          const settings = data.data
          setPlatformName(settings.platform_name || 'Busca Nutri')
          setContactEmail(settings.contact_email || 'contato@buscanutri.com')
          setAllowNewRegistrations(settings.allow_registrations !== false)
          setDefaultUserRole(settings.default_user_role || 'paciente')

          // Carregar templates de email HTML
          setNutritionistEmailHtml(settings.welcome_nutritionist_html || '')
          setPatientEmailHtml(settings.welcome_patient_html || '')
          setCompanyEmailHtml(settings.welcome_company_html || '')

          // Carregar templates de email texto
          setNutritionistEmailText(settings.welcome_nutritionist_text || '')
          setPatientEmailText(settings.welcome_patient_text || '')
          setCompanyEmailText(settings.welcome_company_text || '')

          setApiKey(settings.api_key || '')
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error)
      }
    }

    // Carrega as configurações ao montar o componente
    loadSettings()

    // Verifica se o Gmail já está conectado
    checkGmailConnection()
  }, [])

  // Componente para exibir os placeholders disponíveis
  const PlaceholdersInfo = () => (
    <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
        <Info className="h-4 w-4" />
        <span className="font-medium">Placeholders disponíveis:</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {placeholders.map(placeholder => (
          <code key={placeholder} className="px-2 py-1 bg-gray-100 rounded text-xs inline-block">
            {`{{${placeholder}}}`}
          </code>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Exemplo: Olá {'{name}'}, bem-vindo ao {'{{app_name}}'}!
      </p>
    </div>
  )

  // Componente para selecionar o formato (HTML ou texto)
  const FormatSelector = ({ value, onChange, id }) => (
    <RadioGroup
      value={value}
      onValueChange={onChange}
      className="flex space-x-4 mb-4"
      id={id}
    >
      {/*
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="text" id={`${id}-text`} />
        <Label htmlFor={`${id}-text`} className="flex items-center gap-1">
          <FileText className="h-4 w-4" /> Texto
        </Label>
      </div>
      */}
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="html" id={`${id}-html`} />
        <Label htmlFor={`${id}-html`} className="flex items-center gap-1">
          <Code className="h-4 w-4" /> HTML
        </Label>
      </div>
    </RadioGroup>
  )

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
            <Label>Templates de Email de Boas-Vindas</Label>
            <Tabs defaultValue="nutritionist" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="nutritionist">Nutricionistas</TabsTrigger>
                <TabsTrigger value="patient">Pacientes</TabsTrigger>
                <TabsTrigger value="company">Empresas</TabsTrigger>
              </TabsList>

              <TabsContent value="nutritionist" className="space-y-4">
                <FormatSelector
                  value={nutritionistFormat}
                  onChange={setNutritionistFormat}
                  id="nutritionist-format"
                />
                <Textarea
                  value={nutritionistFormat === 'html' ? nutritionistEmailHtml : nutritionistEmailText}
                  onChange={e => nutritionistFormat === 'html'
                    ? setNutritionistEmailHtml(e.target.value)
                    : setNutritionistEmailText(e.target.value)}
                  className="min-h-[200px] font-mono text-sm border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder={nutritionistFormat === 'html'
                    ? '<h2>Olá {{name}}!</h2><p>Bem-vindo ao {{app_name}}...</p>'
                    : 'Olá {{name}}, bem-vindo ao {{app_name}}...'}
                />
                <PlaceholdersInfo />
              </TabsContent>

              <TabsContent value="patient" className="space-y-4">
                <FormatSelector
                  value={patientFormat}
                  onChange={setPatientFormat}
                  id="patient-format"
                />
                <Textarea
                  value={patientFormat === 'html' ? patientEmailHtml : patientEmailText}
                  onChange={e => patientFormat === 'html'
                    ? setPatientEmailHtml(e.target.value)
                    : setPatientEmailHtml(e.target.value)}
                  className="min-h-[200px] font-mono text-sm border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder={patientFormat === 'html'
                    ? '<h2>Olá {{name}}!</h2><p>Bem-vindo ao {{app_name}}...</p>'
                    : 'Olá {{name}}, bem-vindo ao {{app_name}}...'}
                />
                <PlaceholdersInfo />
              </TabsContent>

              <TabsContent value="company" className="space-y-4">
                <FormatSelector
                  value={companyFormat}
                  onChange={setCompanyFormat}
                  id="company-format"
                />
                <Textarea
                  value={companyFormat === 'html' ? companyEmailHtml : companyEmailText}
                  onChange={e => companyFormat === 'html'
                    ? setCompanyEmailHtml(e.target.value)
                    : setCompanyEmailText(e.target.value)}
                  className="min-h-[200px] font-mono text-sm border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder={companyFormat === 'html'
                    ? '<h2>Olá {{name}}!</h2><p>Bem-vindo ao {{app_name}}...</p>'
                    : 'Olá {{name}}, bem-vindo ao {{app_name}}...'}
                />
                <PlaceholdersInfo />
              </TabsContent>
            </Tabs>
          </div>

          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleSaveChanges}
          >
            <Save className="h-4 w-4 mr-2" /> Salvar Templates
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
