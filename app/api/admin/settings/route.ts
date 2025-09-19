import { NextRequest } from 'next/server'
import { createApiResponse, withAuth } from '@/lib/api-middleware'
import { requireAdmin } from '@/lib/auth-utils'
import { createAdminClient } from '@/lib/supabase/server'

interface PlatformSettings {
  platform_name?: string
  contact_email?: string
  allow_registrations?: boolean
  default_user_role?: string
  welcome_nutritionist_html?: string
  welcome_nutritionist_text?: string
  welcome_patient_html?: string
  welcome_patient_text?: string
  welcome_company_html?: string
  welcome_company_text?: string
  api_key?: string
}

export const GET = withAuth(async (req: NextRequest) => {
  await requireAdmin()
  
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('platform_settings')
    .select('*')
    .single()
  
  if (error) {
    return createApiResponse({
      platform_name: 'Busca Nutri',
      contact_email: 'contato@buscanutri.com',
      allow_registrations: true,
      default_user_role: 'paciente',
      welcome_nutritionist_html: '',
      welcome_nutritionist_text: '',
      welcome_patient_html: '',
      welcome_patient_text: '',
      welcome_company_html: '',
      welcome_company_text: '',
      api_key: ''
    })
  }
  
  return createApiResponse(data)
})

export const POST = withAuth(async (req: NextRequest) => {
  await requireAdmin()
  
  const supabase = createAdminClient()
  
  const settings: PlatformSettings = await req.json()
  
  const { data, error } = await supabase
    .from('platform_settings')
    .upsert({
      id: 1, 
      ...settings,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' })
    .select()
  
  if (error) {
    throw new Error(`Erro ao salvar configurações: ${error.message}`)
  }
  
  return createApiResponse({ success: true, data })
})