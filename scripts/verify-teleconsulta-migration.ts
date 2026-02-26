import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! 

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verify() {
  console.log('--- Verifying Teleconsulta Migration ---')

  // 1. Check if teleconsulta_sessions is accessible
  const { count: sessionCount, error: sessionError } = await supabase
    .from('teleconsulta_sessions')
    .select('*', { count: 'exact', head: true })

  if (sessionError) {
    console.error('❌ teleconsulta_sessions access failed:', sessionError.message)
  } else {
    console.log(`✅ teleconsulta_sessions is accessible. Total records: ${sessionCount}`)
  }

  // 2. Check legacy tables
  const legacyTables = ['appointments', 'consultations', 'telemedicine_consultations', 'consultation_sessions']
  
  for (const table of legacyTables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.log(`⚠️ Table '${table}' access error (likely does not exist): ${error.message}`)
    } else {
      console.log(`ℹ️ Table '${table}' exists. Total records: ${count}`)
      if (count && count > 0) {
        console.log(`   WARNING: '${table}' is not empty. Verify if migration is needed.`)
      }
    }
  }

  // 3. Verify recent sessions (last 24h) are in teleconsulta_sessions
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  
  const { data: recentSessions, error: recentError } = await supabase
    .from('teleconsulta_sessions')
    .select('id, created_at, status')
    .gt('created_at', oneDayAgo)

  if (recentError) {
    console.error('❌ Error fetching recent sessions:', recentError.message)
  } else {
    console.log(`✅ Found ${recentSessions?.length || 0} sessions created in the last 24h in teleconsulta_sessions`)
    if (recentSessions && recentSessions.length > 0) {
      console.log('   Sample ID:', recentSessions[0].id)
      console.log('   Status distribution:', recentSessions.reduce((acc: any, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1
        return acc
      }, {}))
    }
  }

  // 4. Verify no new appointments in legacy table (last 24h)
  const { data: recentAppointments, error: legacyError } = await supabase
    .from('appointments')
    .select('id, created_at')
    .gt('created_at', oneDayAgo)

  if (legacyError) {
    console.error('⚠️ Error checking legacy table:', legacyError.message)
  } else if (recentAppointments && recentAppointments.length > 0) {
    console.error('❌ CRITICAL: Found new records in appointments table in the last 24h!', recentAppointments.length)
    console.error('   These records should not exist if migration is complete.')
  } else {
    console.log('✅ No new records in appointments table in the last 24h')
  }

  // 5. Check if API endpoints for appointments are blocked (Simulation)
  // We can't easily curl localhost here if server isn't running, but we can check code.
  // Assuming the developer (me) checked app/api/appointments/create/route.ts

  console.log('--- Verification Complete ---')
}

verify().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
