#!/usr/bin/env node

/**
 * Script para aplicar correções de segurança identificadas na auditoria do Supabase
 * 
 * Este script:
 * 1. Conecta ao Supabase usando as credenciais do ambiente
 * 2. Executa as correções de políticas RLS
 * 3. Corrige funções com search_path mutável
 * 4. Adiciona índices para melhorar performance
 * 5. Gera relatório das correções aplicadas
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Erro: Variáveis de ambiente do Supabase não encontradas');
    console.error('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Executa uma query SQL e retorna o resultado
 */
async function executeSQL(sql, description) {
    console.log(`🔧 Executando: ${description}`);
    
    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
        
        if (error) {
            console.error(`❌ Erro ao executar ${description}:`, error.message);
            return { success: false, error: error.message };
        }
        
        console.log(`✅ Sucesso: ${description}`);
        return { success: true, data };
    } catch (err) {
        console.error(`❌ Erro inesperado ao executar ${description}:`, err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Lê e executa o script SQL de correções
 */
async function applySecurityFixes() {
    console.log('🚀 Iniciando aplicação das correções de segurança...\n');
    
    const scriptPath = path.join(__dirname, 'security-audit-continuation.sql');
    
    if (!fs.existsSync(scriptPath)) {
        console.error('❌ Arquivo de script não encontrado:', scriptPath);
        return;
    }
    
    const sqlScript = fs.readFileSync(scriptPath, 'utf8');
    
    // Dividir o script em comandos individuais
    const commands = sqlScript
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📋 Total de comandos a executar: ${commands.length}\n`);
    
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        
        // Pular comentários e linhas vazias
        if (command.startsWith('--') || command.trim() === '') {
            continue;
        }
        
        // Extrair descrição do comando
        let description = `Comando ${i + 1}`;
        if (command.includes('DROP POLICY')) {
            description = `Removendo política RLS`;
        } else if (command.includes('CREATE POLICY')) {
            description = `Criando política RLS otimizada`;
        } else if (command.includes('DROP FUNCTION')) {
            description = `Removendo função`;
        } else if (command.includes('CREATE OR REPLACE FUNCTION')) {
            description = `Criando função com segurança aprimorada`;
        } else if (command.includes('CREATE INDEX')) {
            description = `Criando índice para performance`;
        } else if (command.includes('COMMENT ON')) {
            description = `Adicionando documentação`;
        }
        
        const result = await executeSQL(command + ';', description);
        results.push({
            command: description,
            success: result.success,
            error: result.error
        });
        
        if (result.success) {
            successCount++;
        } else {
            errorCount++;
        }
        
        // Pequena pausa entre comandos
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Relatório final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO FINAL DAS CORREÇÕES DE SEGURANÇA');
    console.log('='.repeat(60));
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📋 Total: ${results.length}`);
    
    if (errorCount > 0) {
        console.log('\n❌ Comandos que falharam:');
        results
            .filter(r => !r.success)
            .forEach(r => {
                console.log(`  - ${r.command}: ${r.error}`);
            });
    }
    
    console.log('\n🎉 Auditoria de segurança concluída!');
    
    // Salvar relatório em arquivo
    const reportPath = path.join(__dirname, 'security-audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
            total: results.length,
            success: successCount,
            errors: errorCount
        },
        details: results
    }, null, 2));
    
    console.log(`📄 Relatório salvo em: ${reportPath}`);
}

/**
 * Verifica o status atual dos advisors de segurança
 */
async function checkSecurityAdvisors() {
    console.log('\n🔍 Verificando advisors de segurança restantes...');
    
    // Query para verificar funções com search_path mutável
    const functionsQuery = `
        SELECT 
            routine_name,
            routine_type,
            security_type,
            routine_definition
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_definition NOT LIKE '%SET search_path%'
        AND routine_type = 'FUNCTION'
        ORDER BY routine_name;
    `;
    
    const functionsResult = await executeSQL(functionsQuery, 'Verificando funções com search_path mutável');
    
    if (functionsResult.success && functionsResult.data) {
        console.log(`📋 Funções restantes com search_path mutável: ${functionsResult.data.length}`);
        if (functionsResult.data.length > 0) {
            functionsResult.data.slice(0, 5).forEach(func => {
                console.log(`  - ${func.routine_name} (${func.security_type})`);
            });
            if (functionsResult.data.length > 5) {
                console.log(`  ... e mais ${functionsResult.data.length - 5} funções`);
            }
        }
    }
    
    // Query para verificar políticas RLS com auth.uid() direto
    const rlsQuery = `
        SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND (qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%')
        ORDER BY tablename, policyname;
    `;
    
    const rlsResult = await executeSQL(rlsQuery, 'Verificando políticas RLS com auth.uid() direto');
    
    if (rlsResult.success && rlsResult.data) {
        console.log(`📋 Políticas RLS restantes com auth.uid() direto: ${rlsResult.data.length}`);
        if (rlsResult.data.length > 0) {
            rlsResult.data.slice(0, 5).forEach(policy => {
                console.log(`  - ${policy.tablename}.${policy.policyname}`);
            });
            if (rlsResult.data.length > 5) {
                console.log(`  ... e mais ${rlsResult.data.length - 5} políticas`);
            }
        }
    }
}

// Executar o script
async function main() {
    try {
        await applySecurityFixes();
        await checkSecurityAdvisors();
    } catch (error) {
        console.error('❌ Erro fatal:', error.message);
        process.exit(1);
    }
}

// Verificar se está sendo executado diretamente
if (require.main === module) {
    main();
}

module.exports = {
    applySecurityFixes,
    checkSecurityAdvisors,
    executeSQL
};