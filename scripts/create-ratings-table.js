const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createConsultationRatingsTable() {
  try {
    console.log('🚀 Criando tabela de avaliações de consultas...')
    
    // Criar a tabela consultation_ratings
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS consultation_ratings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          consultation_id UUID NOT NULL,
          patient_id UUID NOT NULL,
          nutritionist_id UUID NOT NULL,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          comment TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          -- Garantir que cada consulta só pode ter uma avaliação
          UNIQUE(consultation_id)
      );
    `
    
    const { error: createError } = await supabase.rpc('exec', { sql: createTableSQL })
    
    if (createError) {
      console.log('⚠️ Erro ao criar tabela (pode já existir):', createError.message)
    } else {
      console.log('✅ Tabela consultation_ratings criada com sucesso!')
    }
    
    // Verificar se a tabela existe
    const { data: tables, error: checkError } = await supabase
      .from('consultation_ratings')
      .select('id')
      .limit(1)
    
    if (checkError) {
      console.log('❌ Tabela não foi criada:', checkError.message)
    } else {
      console.log('✅ Tabela consultation_ratings está funcionando!')
    }
    
    console.log('🎉 Processo concluído!')
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

// Executar
createConsultationRatingsTable()