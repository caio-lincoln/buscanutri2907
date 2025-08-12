#!/usr/bin/env node

/**
 * Script para verificar se não há referências diretas ao localStorage no código
 * Parte do sistema de refatoração de armazenamento local
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Configurações
const PROJECT_ROOT = process.cwd()
const ALLOWED_FILES = [
  // Arquivos onde localStorage ainda é permitido (para migração/fallback)
  'lib/storage/migrations.ts',
  'lib/storage/storage-service.ts',
  'components/client-only.tsx', // Contém fallback
  'app/test-notifications/page.tsx', // Contém fallback
  '__tests__/**/*.test.ts', // Testes podem usar localStorage
  'scripts/check-no-localstorage.js', // Este próprio script
  'VERCEL_DEPLOY_FIXES.md', // Documentação
  'MUDANCAS_AUTENTICACAO.md', // Documentação
  'README.md' // Documentação
]

const SEARCH_PATTERNS = [
  'localStorage.getItem',
  'localStorage.setItem', 
  'localStorage.removeItem',
  'localStorage.clear',
  'localStorage.key',
  'window.localStorage',
  'global.localStorage'
]

// Cores para output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function isAllowedFile(filePath) {
  return ALLOWED_FILES.some(pattern => {
    if (pattern.includes('**')) {
      // Padrão glob
      const regex = new RegExp(pattern.replace('**', '.*').replace('*', '[^/]*'))
      return regex.test(filePath)
    }
    return filePath.includes(pattern)
  })
}

function searchForLocalStorage() {
  log('🔍 Verificando referências ao localStorage...', 'blue')
  
  const violations = []
  
  for (const pattern of SEARCH_PATTERNS) {
    try {
      // Usar ripgrep se disponível, senão usar grep
      let command
      try {
        execSync('rg --version', { stdio: 'ignore' })
        command = `rg -n "${pattern}" --type ts --type tsx --type js --type jsx`
      } catch {
        command = `grep -rn "${pattern}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" .`
      }
      
      const output = execSync(command, { 
        cwd: PROJECT_ROOT,
        encoding: 'utf8',
        stdio: 'pipe'
      })
      
      if (output.trim()) {
        const lines = output.trim().split('\n')
        
        for (const line of lines) {
          const [filePath, lineNumber, content] = line.split(':')
          const normalizedPath = path.normalize(filePath).replace(/\\/g, '/')
          
          if (!isAllowedFile(normalizedPath)) {
            violations.push({
              file: normalizedPath,
              line: lineNumber,
              content: content?.trim(),
              pattern
            })
          }
        }
      }
    } catch (error) {
      // Padrão não encontrado ou erro no comando - continuar
      if (!error.message.includes('exit code 1')) {
        log(`⚠️  Erro ao buscar padrão "${pattern}": ${error.message}`, 'yellow')
      }
    }
  }
  
  return violations
}

function generateReport(violations) {
  if (violations.length === 0) {
    log('✅ Sucesso! Nenhuma referência direta ao localStorage encontrada.', 'green')
    log('🎉 O sistema de storage foi migrado com sucesso!', 'green')
    return true
  }
  
  log(`❌ Encontradas ${violations.length} violações:`, 'red')
  log('', 'reset')
  
  const groupedByFile = violations.reduce((acc, violation) => {
    if (!acc[violation.file]) {
      acc[violation.file] = []
    }
    acc[violation.file].push(violation)
    return acc
  }, {})
  
  for (const [file, fileViolations] of Object.entries(groupedByFile)) {
    log(`📄 ${file}:`, 'bold')
    
    for (const violation of fileViolations) {
      log(`   Linha ${violation.line}: ${violation.content}`, 'red')
      log(`   Padrão: ${violation.pattern}`, 'yellow')
    }
    
    log('', 'reset')
  }
  
  log('🔧 Para corrigir:', 'blue')
  log('1. Substitua localStorage.getItem() por storage.get()', 'blue')
  log('2. Substitua localStorage.setItem() por storage.set()', 'blue')
  log('3. Substitua localStorage.removeItem() por storage.remove()', 'blue')
  log('4. Use o hook useStorage() em componentes React', 'blue')
  log('5. Importe { storage } from "@/lib/storage"', 'blue')
  
  return false
}

function checkPackageJson() {
  try {
    const packagePath = path.join(PROJECT_ROOT, 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
    
    // Verificar se há script de teste
    if (!packageJson.scripts?.test) {
      log('⚠️  Recomendação: Adicione um script de teste ao package.json', 'yellow')
      log('   "test": "jest"', 'yellow')
    }
    
    // Verificar se há script de lint
    if (!packageJson.scripts?.lint) {
      log('⚠️  Recomendação: Adicione um script de lint ao package.json', 'yellow')
      log('   "lint": "eslint . --ext .ts,.tsx,.js,.jsx"', 'yellow')
    }
    
    return true
  } catch (error) {
    log(`⚠️  Não foi possível verificar package.json: ${error.message}`, 'yellow')
    return false
  }
}

function main() {
  log('🚀 Verificação de Migração do Sistema de Storage', 'bold')
  log('=' .repeat(50), 'blue')
  
  // Verificar se estamos no diretório correto
  if (!fs.existsSync(path.join(PROJECT_ROOT, 'package.json'))) {
    log('❌ Erro: Execute este script na raiz do projeto (onde está o package.json)', 'red')
    process.exit(1)
  }
  
  // Verificar package.json
  checkPackageJson()
  
  // Buscar violações
  const violations = searchForLocalStorage()
  
  // Gerar relatório
  const success = generateReport(violations)
  
  log('=' .repeat(50), 'blue')
  
  if (success) {
    log('✅ Verificação concluída com sucesso!', 'green')
    process.exit(0)
  } else {
    log('❌ Verificação falhou. Corrija as violações acima.', 'red')
    process.exit(1)
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main()
}

module.exports = {
  searchForLocalStorage,
  generateReport,
  isAllowedFile
}