import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '../../../../lib/email/send-email'
import { createAdminClient } from '../../../../lib/supabase/server'

function mapRole(raw?: string) {
  const r = (raw || '').toUpperCase()
  if ([ 'NUTRITIONIST', 'NUTRICIONISTA' ].includes(r)) return 'NUTRITIONIST'
  if ([ 'COMPANY', 'EMPRESA' ].includes(r)) return 'COMPANY'
  return 'PATIENT'
}

export async function POST(req: NextRequest) {
  if (req.headers.get('x-webhook-token') !== `${process.env[ 'WEBHOOK_TOKEN' ]}`) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const body = await req.json()
  const rec = body?.record ?? body?.user ?? body

  const email = rec?.email

  if (!rec || !email) {
    return NextResponse.json({ error: 'Dados de usuário inválidos' }, { status: 400 })
  }

  await new Promise(resolve => setTimeout(resolve, 3000));

  const userType = rec?.raw_user_meta_data?.user_type
  const collection = userType === 'paciente' ? "patient_profiles" :  userType === 'nutricionista' ? "nutritionist_profiles" : "company_profiles"

  const supabase = createAdminClient()
  const { data: profile, error } = await supabase
  .from(collection)
  .select('*')
  .eq('user_id', rec.id)
  .single()
  
  if (error) {
    return NextResponse.json({ ok: false, error: 'Erro ao buscar perfil' }, { status: 500 })
  }

  const name = profile?.full_name?.split(' ')?.[0]
  const companyName = profile?.responsible_name?.split(' ')?.[0]
  const role = mapRole(userType ?? rec?.user_metadata?.user_type)

  if (!email) return NextResponse.json({ ok: false, error: 'no email' }, { status: 400 })

  const { data: settings, error: settingsError } = await supabase
  .from('platform_settings')
  .select('platform_name, contact_email, welcome_nutritionist_html, welcome_nutritionist_text, welcome_patient_html, welcome_patient_text, welcome_company_html, welcome_company_text')
  .eq('id', 1)
  .single()
  
  if (settingsError || !settings) {
    return NextResponse.json({ ok: false, error: 'Erro ao buscar configurações' }, { status: 500 })
  }

  try {
    await sendWelcomeEmail({
      to: email,
      name,
      company_name: companyName,
      role,
      app_name: settings.platform_name,
      support_email: settings.contact_email,
      welcome_nutritionist_html: settings.welcome_nutritionist_html,
      welcome_nutritionist_text: settings.welcome_nutritionist_text,
      welcome_patient_html: settings.welcome_patient_html,
      welcome_patient_text: settings.welcome_patient_text,
      welcome_company_html: settings.welcome_company_html,
      welcome_company_text: settings.welcome_company_text,
      welcome_email_template: ''
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.log("🚀 ~ POST ~ error:", error)
    return NextResponse.json({ ok: false, error: 'Erro ao enviar email' }, { status: 500 })
  }
}
