
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const admin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function main() {
  console.log('=== TESTE DE VALIDAÇÃO: SOFT DELETE ===')

  // 1. Criar Nutricionista
  const nutEmail = `test-soft-del-${Date.now()}@example.com`
  const password = 'Password123!'
  
  console.log(`Criando Nutri ${nutEmail}...`)
  const { data: nutAuth } = await admin.auth.admin.createUser({
    email: nutEmail,
    password,
    email_confirm: true,
    user_metadata: { user_type: 'nutricionista', role: 'admin' } // Role admin para simular quem deleta? Não, este será deletado.
  })
  
  if (!nutAuth.user) throw new Error('Falha ao criar Nutri Auth')
  const nutId = nutAuth.user.id
  
  // Public User
  await admin.from('users').upsert({
    id: nutId,
    email: nutEmail,
    user_type: 'nutricionista'
  })
  
  // Profile
  const { data: nutProfile, error: nutProfileError } = await admin.from('nutritionist_profiles').insert({
    user_id: nutId,
    full_name: 'Nutri Soft Delete Test',
    crn: `TEST-${Date.now()}`
  }).select().single()

  if (nutProfileError) {
    console.error('Erro detalhado ao criar profile:', nutProfileError)
    throw new Error(`Falha ao criar Nutri Profile: ${nutProfileError.message}`)
  }

  if (!nutProfile) throw new Error('Falha ao criar Nutri Profile (dados vazios)')

  // 2. Criar Paciente (para ter relação)
  const patEmail = `test-pat-soft-${Date.now()}@example.com`
  const { data: patAuth } = await admin.auth.admin.createUser({
    email: patEmail,
    password,
    email_confirm: true,
    user_metadata: { user_type: 'paciente' }
  })
  
  if (!patAuth.user) throw new Error('Falha ao criar Paciente Auth')
  const patId = patAuth.user.id
  
  await admin.from('users').upsert({
    id: patId,
    email: patEmail,
    user_type: 'paciente'
  })
  
  const { data: patProfile } = await admin.from('patient_profiles').insert({
    user_id: patId,
    full_name: 'Patient Soft Delete Test',
    phone: '11999999999'
  }).select().single()

  if (!patProfile) throw new Error('Falha ao criar Patient Profile')

  // 3. Criar Agendamento
  console.log('Criando Agendamento...')
  const { data: appointment, error: appError } = await admin.from('appointments').insert({
      patient_id: patProfile.id,
      nutritionist_id: nutProfile.id,
      appointment_date: new Date().toISOString(),
      appointment_time: '14:00:00',
      duration_minutes: 60,
      type: 'online',
      status: 'agendado',
      patient_name: 'Patient Soft Delete Test'
    }).select().single()

  if (appError) {
      console.error('Erro ao criar agendamento:', appError)
      throw new Error('Falha ao criar agendamento')
  }

  // 4. Executar Lógica de Soft Delete (Simulando API)
  console.log('--- Executando Soft Delete no Nutricionista ---')
  const timestamp = new Date().toISOString()

  // 4.1 Update Users
  const { error: uErr } = await admin.from('users').update({ is_deleted: true, deleted_at: timestamp }).eq('id', nutId)
  if (uErr) console.error('Erro ao soft delete user:', uErr)
  else console.log('Soft delete user OK')

  // 4.2 Update Profile
  const { error: pErr } = await admin.from('nutritionist_profiles').update({ is_deleted: true, deleted_at: timestamp }).eq('user_id', nutId)
  if (pErr) console.error('Erro ao soft delete profile:', pErr)
  else console.log('Soft delete profile OK')

  // 4.3 Update Appointments
  const { error: aErr } = await admin.from('appointments').update({ is_deleted: true, deleted_at: timestamp }).eq('nutritionist_id', nutProfile.id)
  if (aErr) console.error('Erro ao soft delete appointment:', aErr)
  else console.log('Soft delete appointment OK')

  // 4.4 Delete Auth
  console.log('Deletando do Auth...')
  const { error: authErr } = await admin.auth.admin.deleteUser(nutId)
  if (authErr) {
      console.error('ERRO CRÍTICO AO DELETAR DO AUTH:', authErr)
      // Se der erro aqui, é o problema original (provavelmente FK constraint se não removemos o cascade ou se users tiver FK para auth.users)
  } else {
      console.log('Sucesso ao deletar do Auth')
  }

  // 5. Verificar Estado Final
  console.log('--- Verificação ---')
  
  // Auth User deve não existir
  const { data: checkAuth, error: checkAuthErr } = await admin.auth.admin.getUserById(nutId)
  console.log('Auth User existe?', !!checkAuth?.user) // Esperado: false (ou erro de not found)

  // Public User deve existir mas is_deleted=true
  const { data: checkUser } = await admin.from('users').select('id, is_deleted').eq('id', nutId).single()
  console.log('Public User:', checkUser) // Esperado: { id: ..., is_deleted: true }

  // Profile deve existir mas is_deleted=true
  const { data: checkProfile } = await admin.from('nutritionist_profiles').select('id, is_deleted').eq('user_id', nutId).single()
  console.log('Profile:', checkProfile) // Esperado: { id: ..., is_deleted: true }

  // Appointment deve existir mas is_deleted=true
  const { data: checkApp } = await admin.from('appointments').select('id, is_deleted').eq('id', appointment.id).single()
  console.log('Appointment:', checkApp) // Esperado: { id: ..., is_deleted: true }

  // Limpeza (Paciente)
  if (patAuth?.user) await admin.auth.admin.deleteUser(patAuth.user.id)
}

main().catch(console.error)
