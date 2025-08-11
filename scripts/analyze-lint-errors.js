#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Lê o relatório do ESLint
const reportPath = path.join(__dirname, '..', 'eslint-report.json');

if (!fs.existsSync(reportPath)) {
  console.error('❌ Arquivo eslint-report.json não encontrado');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

// Filtra apenas arquivos do projeto (não .next)
const projectFiles = report.filter(file => 
  !file.filePath.includes('.next') && 
  !file.filePath.includes('node_modules') &&
  !file.filePath.includes('.tmp.driveupload') &&
  (file.errorCount > 0 || file.warningCount > 0)
);

// Agrupa erros por tipo
const errorsByRule = {};
const filesByErrorCount = [];

projectFiles.forEach(file => {
  const totalIssues = file.errorCount + file.warningCount;
  if (totalIssues > 0) {
    filesByErrorCount.push({
      filePath: file.filePath.replace(process.cwd(), '.'),
      errorCount: file.errorCount,
      warningCount: file.warningCount,
      totalIssues,
      fixableErrors: file.fixableErrorCount,
      fixableWarnings: file.fixableWarningCount
    });

    file.messages.forEach(message => {
      if (!errorsByRule[message.ruleId]) {
        errorsByRule[message.ruleId] = {
          count: 0,
          severity: message.severity === 2 ? 'error' : 'warning',
          files: new Set()
        };
      }
      errorsByRule[message.ruleId].count++;
      errorsByRule[message.ruleId].files.add(file.filePath);
    });
  }
});

// Ordena arquivos por número de problemas
filesByErrorCount.sort((a, b) => b.totalIssues - a.totalIssues);

// Ordena regras por frequência
const rulesByFrequency = Object.entries(errorsByRule)
  .sort(([,a], [,b]) => b.count - a.count);

console.log('📊 ANÁLISE DE ERROS DE LINTING\n');

console.log('🔥 TOP 20 ARQUIVOS COM MAIS PROBLEMAS:');
console.log('=====================================');
filesByErrorCount.slice(0, 20).forEach((file, index) => {
  console.log(`${index + 1}. ${file.filePath}`);
  console.log(`   ❌ ${file.errorCount} erros | ⚠️  ${file.warningCount} avisos | 🔧 ${file.fixableErrors + file.fixableWarnings} corrigíveis`);
  console.log('');
});

console.log('\n📋 TOP 15 REGRAS MAIS VIOLADAS:');
console.log('===============================');
rulesByFrequency.slice(0, 15).forEach(([rule, data], index) => {
  console.log(`${index + 1}. ${rule} (${data.severity})`);
  console.log(`   🔢 ${data.count} ocorrências em ${data.files.size} arquivos`);
  console.log('');
});

// Identifica regras prioritárias para CI
const priorityRules = ['no-console', 'no-useless-escape', 'no-irregular-whitespace'];
console.log('\n🚨 REGRAS PRIORITÁRIAS PARA CI:');
console.log('===============================');
priorityRules.forEach(rule => {
  if (errorsByRule[rule]) {
    console.log(`✅ ${rule}: ${errorsByRule[rule].count} ocorrências`);
  } else {
    console.log(`✅ ${rule}: 0 ocorrências`);
  }
});

// Estatísticas gerais
const totalErrors = projectFiles.reduce((sum, file) => sum + file.errorCount, 0);
const totalWarnings = projectFiles.reduce((sum, file) => sum + file.warningCount, 0);
const totalFixable = projectFiles.reduce((sum, file) => sum + file.fixableErrorCount + file.fixableWarningCount, 0);

console.log('\n📈 ESTATÍSTICAS GERAIS:');
console.log('=======================');
console.log(`📁 Arquivos com problemas: ${projectFiles.length}`);
console.log(`❌ Total de erros: ${totalErrors}`);
console.log(`⚠️  Total de avisos: ${totalWarnings}`);
console.log(`🔧 Total corrigível automaticamente: ${totalFixable}`);
console.log(`📊 Total de problemas: ${totalErrors + totalWarnings}`);

// Gera lista de arquivos prioritários para correção
const priorityFiles = filesByErrorCount.slice(0, 10);
console.log('\n🎯 ARQUIVOS PRIORITÁRIOS PARA CORREÇÃO:');
console.log('=======================================');
priorityFiles.forEach((file, index) => {
  console.log(`${index + 1}. ${file.filePath}`);
});

// Salva relatório detalhado
const detailedReport = {
  summary: {
    totalFiles: projectFiles.length,
    totalErrors,
    totalWarnings,
    totalFixable,
    totalIssues: totalErrors + totalWarnings
  },
  priorityFiles: priorityFiles.map(f => f.filePath),
  topRules: rulesByFrequency.slice(0, 15).map(([rule, data]) => ({
    rule,
    count: data.count,
    severity: data.severity,
    fileCount: data.files.size
  })),
  priorityRulesStatus: priorityRules.map(rule => ({
    rule,
    count: errorsByRule[rule]?.count || 0,
    present: !!errorsByRule[rule]
  }))
};

fs.writeFileSync(
  path.join(__dirname, '..', 'lint-analysis.json'),
  JSON.stringify(detailedReport, null, 2)
);

console.log('\n💾 Relatório detalhado salvo em: lint-analysis.json');