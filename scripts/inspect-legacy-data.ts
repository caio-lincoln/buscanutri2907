import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! 

if (!supabaseUrl || !supabaseKey) {
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectLegacyData() {
  console.log('--- Inspecting Legacy Consultations ---')

  const { data: consultations, error } = await supabase
    .from('consultations')
    .select('*')
    .limit(10)

  if (error) {
    console.error('Error fetching consultations:', error.message)
    return
  }

  console.log(`Found ${consultations.length} sample records in consultations table.`)
  if (consultations.length > 0) {
    console.log('Sample record:', JSON.stringify(consultations[0], null, 2))
    
    // Check fields compatibility
    const c = consultations[0]
    console.log('\nCompatibility Check:')
    console.log('- Has patient_id?', !!c.patient_id)
    console.log('- Has nutritionist_id?', !!c.nutritionist_id)
    console.log('- Has status?', c.status)
    console.log('- Has date/time?', c.start_time || c.scheduled_at || c.date)
  }
}

inspectLegacyData()
