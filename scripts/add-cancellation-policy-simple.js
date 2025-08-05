const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addCancellationPolicyColumn() {
  try {
    console.log('🚀 Tentando adicionar coluna cancellation_policy...')
    
    // Primeiro, vamos verificar se a coluna já existe tentando fazer uma query
    console.log('🔍 Verificando se a coluna já existe...')
    
    try {
      const { data, error } = await supabase
        .from('nutritionist_profiles')
        .select('cancellation_policy')
        .limit(1)
      
      if (!error) {
        console.log('✅ A coluna cancellation_policy já existe!')
        console.log('🎉 Nenhuma ação necessária!')
        return
      }
      
      if (error && !error.message.includes('cancellation_policy')) {
        console.error('❌ Erro inesperado:', error.message)
        return
      }
    } catch (err) {
      console.log('⚠️  Coluna não existe, continuando com a criação...')
    }
    
    console.log('📝 Tentando criar a função exec_sql se não existir...')
    
    // Tentar criar a função exec_sql primeiro
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql_query;
      END;
      $$;
    `
    
    try {
      const { error: funcError } = await supabase.rpc('exec_sql', { 
        sql_query: createFunctionSQL 
      })
      
      if (funcError) {
        console.log('⚠️  Função exec_sql pode não existir, tentando abordagem alternativa...')
      } else {
        console.log('✅ Função exec_sql criada/verificada')
      }
    } catch (err) {
      console.log('⚠️  Tentando abordagem alternativa...')
    }
    
    // Tentar adicionar a coluna via RPC
    console.log('📝 Adicionando coluna via RPC...')
    const addColumnSQL = 'ALTER TABLE public.nutritionist_profiles ADD COLUMN IF NOT EXISTS cancellation_policy TEXT'
    
    try {
      const { error: rpcError } = await supabase.rpc('exec_sql', { 
        sql_query: addColumnSQL 
      })
      
      if (rpcError) {
        console.log('⚠️  RPC falhou:', rpcError.message)
        throw new Error('RPC failed')
      }
      
      console.log('✅ Coluna adicionada via RPC!')
      
    } catch (err) {
      console.log('⚠️  RPC não funcionou, a coluna precisa ser adicionada manualmente')
      console.log('')
      console.log('📋 INSTRUÇÕES MANUAIS:')
      console.log('1. Acesse o dashboard do Supabase: https://supabase.com/dashboard')
      console.log('2. Vá para seu projeto')
      console.log('3. Clique em "SQL Editor" no menu lateral')
      console.log('4. Execute o seguinte SQL:')
      console.log('')
      console.log('ALTER TABLE public.nutritionist_profiles ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;')
      console.log('')
      console.log('5. Clique em "Run" para executar')
      console.log('')
      return
    }
    
    // Verificar se a coluna foi adicionada
    console.log('🔍 Verificando se a coluna foi adicionada...')
    
    const { data, error } = await supabase
      .from('nutritionist_profiles')
      .select('cancellation_policy')
      .limit(1)
    
    if (error) {
      if (error.message.includes('cancellation_policy')) {
        console.log('❌ A coluna ainda não foi adicionada')
        console.log('📋 Execute manualmente no dashboard do Supabase:')
        console.log('ALTER TABLE public.nutritionist_profiles ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;')
      } else {
        console.error('❌ Erro ao verificar:', error.message)
      }
    } else {
      console.log('✅ Coluna cancellation_policy adicionada com sucesso!')
      console.log('🎉 O erro de atualização do perfil de nutricionista foi corrigido!')
    }
    
  } catch (error) {
    console.error('❌ Erro durante o processo:', error.message)
    console.log('')
    console.log('📋 SOLUÇÃO MANUAL:')
    console.log('Execute este SQL no dashboard do Supabase:')
    console.log('ALTER TABLE public.nutritionist_profiles ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;')
  }
}

// Executar
addCancellationPolicyColumn()