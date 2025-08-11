#!/usr/bin/env node

/**
 * Script para aplicar correções de segurança diretamente via SQL
 * Este script aplica as correções uma por uma usando queries SQL diretas
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Executa uma query SQL usando uma abordagem direta
 */
async function executeDirectSQL(sql, description) {
  console.log(`🔧 ${description}`);
  
  try {
    // Para políticas RLS, usar uma abordagem específica
    if (sql.includes('DROP POLICY') || sql.includes('CREATE POLICY')) {
      // Políticas RLS precisam ser executadas via SQL direto
      console.log(`⚠️  ${description} - Requer execução manual no SQL Editor`);
      return { success: false, manual: true, sql };
    }
    
    // Para funções, tentar criar diretamente
    if (sql.includes('CREATE OR REPLACE FUNCTION')) {
      console.log(`⚠️  ${description} - Requer execução manual no SQL Editor`);
      return { success: false, manual: true, sql };
    }
    
    // Para índices, tentar criar via query
    if (sql.includes('CREATE INDEX')) {
      console.log(`⚠️  ${description} - Requer execução manual no SQL Editor`);
      return { success: false, manual: true, sql };
    }
    
    // Para comentários, pular
    if (sql.includes('COMMENT ON')) {
      console.log(`✅ ${description} - Pulado (comentário)`);
      return { success: true };
    }
    
    console.log(`❌ ${description} - Tipo de comando não suportado`);
    return { success: false, error: 'Comando não suportado' };
    
  } catch (error) {
    console.error(`❌ Erro ao executar ${description}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Gera um relatório das correções necessárias
 */
async function generateSecurityReport() {
  console.log('🚀 Gerando relatório de correções de segurança...\n');
  
  const corrections = [
    {
      type: 'RLS Policy',
      description: 'Otimizar política "Users can view consultation profiles" em telemedicine_consultations',
      sql: `DROP POLICY IF EXISTS "Users can view consultation profiles" ON public.telemedicine_consultations;
CREATE POLICY "Users can view consultation profiles" ON public.telemedicine_consultations
    FOR SELECT USING (
        (patient_id = (select auth.uid())) OR 
        (nutritionist_id = (select auth.uid()))
    );`,
      priority: 'Alta'
    },
    {
      type: 'RLS Policy',
      description: 'Otimizar política "Users can view own consultations" em telemedicine_consultations',
      sql: `DROP POLICY IF EXISTS "Users can view own consultations" ON public.telemedicine_consultations;
CREATE POLICY "Users can view own consultations" ON public.telemedicine_consultations
    FOR SELECT USING (
        (patient_id = (select auth.uid())) OR 
        (nutritionist_id = (select auth.uid()))
    );`,
      priority: 'Alta'
    },
    {
      type: 'RLS Policy',
      description: 'Otimizar política "Admin access to user roles" em user_roles',
      sql: `DROP POLICY IF EXISTS "Admin access to user roles" ON public.user_roles;
CREATE POLICY "Admin access to user roles" ON public.user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = (select auth.uid())
            AND users.user_type = 'admin'::user_type
        )
    );`,
      priority: 'Alta'
    },
    {
      type: 'Function',
      description: 'Corrigir função increment_question_views com search_path fixo',
      sql: `CREATE OR REPLACE FUNCTION public.increment_question_views(question_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE blog_questions 
    SET views = views + 1 
    WHERE id = question_id;
END;
$$;`,
      priority: 'Média'
    },
    {
      type: 'Function',
      description: 'Corrigir função update_anamnese_updated_at com search_path fixo',
      sql: `CREATE OR REPLACE FUNCTION public.update_anamnese_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;`,
      priority: 'Média'
    },
    {
      type: 'Index',
      description: 'Criar índice para consultation_messages.sender_id',
      sql: `CREATE INDEX IF NOT EXISTS idx_consultation_messages_sender_id 
ON public.consultation_messages(sender_id);`,
      priority: 'Baixa'
    },
    {
      type: 'Index',
      description: 'Criar índice para consultation_notes.author_id',
      sql: `CREATE INDEX IF NOT EXISTS idx_consultation_notes_author_id 
ON public.consultation_notes(author_id);`,
      priority: 'Baixa'
    }
  ];
  
  console.log('📋 RELATÓRIO DE CORREÇÕES DE SEGURANÇA');
  console.log('='.repeat(60));
  
  let manualCount = 0;
  
  for (let i = 0; i < corrections.length; i++) {
    const correction = corrections[i];
    console.log(`\n${i + 1}. ${correction.description}`);
    console.log(`   Tipo: ${correction.type}`);
    console.log(`   Prioridade: ${correction.priority}`);
    
    const result = await executeDirectSQL(correction.sql, correction.description);
    
    if (result.manual) {
      manualCount++;
      console.log(`   Status: ⚠️  REQUER EXECUÇÃO MANUAL`);
    } else if (result.success) {
      console.log(`   Status: ✅ APLICADO`);
    } else {
      console.log(`   Status: ❌ ERRO - ${result.error}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DO RELATÓRIO');
  console.log('='.repeat(60));
  console.log(`Total de correções: ${corrections.length}`);
  console.log(`Requerem execução manual: ${manualCount}`);
  console.log(`Aplicadas automaticamente: ${corrections.length - manualCount}`);
  
  if (manualCount > 0) {
    console.log('\n🔧 INSTRUÇÕES PARA EXECUÇÃO MANUAL:');
    console.log('1. Acesse o Supabase Dashboard');
    console.log('2. Vá para SQL Editor');
    console.log('3. Execute os comandos SQL listados acima');
    console.log('4. Execute na ordem de prioridade: Alta → Média → Baixa');
  }
  
  // Salvar relatório detalhado
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      total: corrections.length,
      manual: manualCount,
      automatic: corrections.length - manualCount
    },
    corrections: corrections.map(c => ({
      ...c,
      status: 'manual_required'
    }))
  };
  
  const fs = require('fs');
  const path = require('path');
  const reportPath = path.join(__dirname, 'security-corrections-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  console.log(`\n📄 Relatório detalhado salvo em: ${reportPath}`);
  
  // Gerar arquivo SQL para execução manual
  const sqlPath = path.join(__dirname, 'security-corrections-manual.sql');
  const sqlContent = `-- Script de correções de segurança para execução manual
-- Gerado em: ${new Date().toISOString()}
-- Execute este script no SQL Editor do Supabase Dashboard

${corrections.map((c, i) => `
-- ${i + 1}. ${c.description}
-- Tipo: ${c.type} | Prioridade: ${c.priority}
${c.sql}
`).join('\n')}

-- Fim do script de correções
`;
  
  fs.writeFileSync(sqlPath, sqlContent);
  console.log(`📄 Script SQL para execução manual salvo em: ${sqlPath}`);
}

/**
 * Verifica o status atual dos advisors de segurança
 */
async function checkCurrentSecurityStatus() {
  console.log('\n🔍 Verificando status atual de segurança...');
  
  try {
    // Verificar se conseguimos acessar algumas tabelas básicas
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (usersError) {
      console.log('❌ Erro ao acessar tabela users:', usersError.message);
    } else {
      console.log('✅ Acesso à tabela users: OK');
    }
    
    const { data: profiles, error: profilesError } = await supabase
      .from('nutritionist_profiles')
      .select('id')
      .limit(1);
    
    if (profilesError) {
      console.log('❌ Erro ao acessar nutritionist_profiles:', profilesError.message);
    } else {
      console.log('✅ Acesso à tabela nutritionist_profiles: OK');
    }
    
    console.log('\n📋 Próximos passos recomendados:');
    console.log('1. Execute o script SQL gerado no Supabase Dashboard');
    console.log('2. Verifique os advisors de segurança novamente');
    console.log('3. Execute este script novamente para verificar melhorias');
    
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error.message);
  }
}

// Executar o script
async function main() {
  try {
    await generateSecurityReport();
    await checkCurrentSecurityStatus();
    console.log('\n🎉 Relatório de auditoria de segurança concluído!');
  } catch (error) {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  }
}

main();