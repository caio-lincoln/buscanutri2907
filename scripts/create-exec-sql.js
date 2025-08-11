#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createExecFunction() {
  console.log('🔧 Criando função exec_sql...');
  
  const sql = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql_query;
    END;
    $$;
    
    GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
    GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;
  `;
  
  try {
    // Testar conexão com uma tabela que sabemos que existe
    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Erro de conexão:', error.message);
      return;
    }
    
    console.log('✅ Conectado ao Supabase');
    
    // Usar uma query SQL direta para criar a função
    const { data, error: createError } = await supabase.rpc('exec_sql', { 
      sql_query: sql 
    }).catch(async () => {
      // Se exec_sql não existe, tentar criar via query SQL
      console.log('⚠️  Função exec_sql não existe, tentando criar...');
      
      // Usar uma abordagem alternativa - executar via REST API
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
        },
        body: JSON.stringify({ sql_query: sql })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return { data: null, error: null };
    });
    
    if (createError) {
      console.log('❌ Erro ao criar função:', createError.message);
      
      // Tentar abordagem alternativa usando SQL direto
      console.log('🔄 Tentando abordagem alternativa...');
      
      // Dividir em comandos menores
      const commands = [
        `CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
         RETURNS void
         LANGUAGE plpgsql
         SECURITY DEFINER
         AS $$
         BEGIN
           EXECUTE sql_query;
         END;
         $$`,
        `GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated`,
        `GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role`
      ];
      
      for (const cmd of commands) {
        console.log(`Executando: ${cmd.substring(0, 50)}...`);
        // Aqui você precisaria executar via SQL Editor do Supabase
      }
      
      console.log('⚠️  Execute os comandos acima no SQL Editor do Supabase Dashboard');
      
    } else {
      console.log('✅ Função exec_sql criada com sucesso!');
    }
    
    // Testar a função
    console.log('🧪 Testando função exec_sql...');
    const { data: testData, error: testError } = await supabase.rpc('exec_sql', {
      sql_query: 'SELECT 1 as test'
    });
    
    if (testError) {
      console.log('❌ Erro no teste:', testError.message);
    } else {
      console.log('✅ Função exec_sql funcionando corretamente!');
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
    
    console.log('\n📋 INSTRUÇÕES MANUAIS:');
    console.log('1. Acesse o Supabase Dashboard');
    console.log('2. Vá para SQL Editor');
    console.log('3. Execute o seguinte SQL:');
    console.log('\n' + sql);
  }
}

createExecFunction();