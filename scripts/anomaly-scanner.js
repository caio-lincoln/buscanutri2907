#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * Scanner de anomalias para detectar e corrigir padrões problemáticos
 */
class AnomalyScanner {
  constructor() {
    this.patterns = {
      // JSON duplamente/tri-escapado
      doubleEscapedJson: /\\\\\\\\"/g,
      tripleEscapedJson: /\\\\\\\\\\\\"/g,
      
      // Barras duplas desnecessárias
      doubleBars: /\\\\\\\\/g,
      
      // Chaves/colchetes repetidos
      repeatedBraces: /\{\{+/g,
      repeatedCloseBraces: /\}\}+/g,
      repeatedBrackets: /\[\[+/g,
      repeatedCloseBrackets: /\]\]+/g,
      
      // Espaços irregulares
      irregularWhitespace: /[\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/g,
      
      // Escapes desnecessários
      uselessEscapes: /\\([^"'\\\/bfnrtux])/g,
    };
    
    this.fixes = {
      doubleEscapedJson: '\\"',
      tripleEscapedJson: '\\"',
      doubleBars: '\\\\',
      repeatedBraces: '{',
      repeatedCloseBraces: '}',
      repeatedBrackets: '[',
      repeatedCloseBrackets: ']',
      irregularWhitespace: ' ',
      uselessEscapes: '$1',
    };
    
    this.results = {
      filesScanned: 0,
      filesFixed: 0,
      anomaliesFound: {},
      errors: []
    };
  }

  /**
   * Escaneia todos os arquivos do projeto
   */
  async scanProject() {
    console.log('🔍 Iniciando scanner de anomalias...\n');
    
    const patterns = [
      'app/**/*.{ts,tsx,js,jsx}',
      'components/**/*.{ts,tsx,js,jsx}',
      'lib/**/*.{ts,tsx,js,jsx}',
      'hooks/**/*.{ts,tsx,js,jsx}',
      'contexts/**/*.{ts,tsx,js,jsx}',
    ];
    
    const files = [];
    for (const pattern of patterns) {
      const matches = glob.sync(pattern, { 
        cwd: process.cwd(),
        ignore: ['**/node_modules/**', '**/.next/**', '**/.tmp.driveupload/**']
      });
      files.push(...matches);
    }
    
    console.log(`📁 Encontrados ${files.length} arquivos para análise\n`);
    
    for (const file of files) {
      await this.scanFile(file);
    }
    
    this.printResults();
  }

  /**
   * Escaneia um arquivo específico
   */
  async scanFile(filePath) {
    try {
      this.results.filesScanned++;
      
      const content = fs.readFileSync(filePath, 'utf8');
      let fixedContent = content;
      let hasChanges = false;
      
      // Detecta e corrige cada padrão
      for (const [patternName, pattern] of Object.entries(this.patterns)) {
        const matches = content.match(pattern);
        
        if (matches && matches.length > 0) {
          if (!this.results.anomaliesFound[patternName]) {
            this.results.anomaliesFound[patternName] = [];
          }
          
          this.results.anomaliesFound[patternName].push({
            file: filePath,
            count: matches.length,
            matches: matches.slice(0, 5) // Primeiros 5 matches
          });
          
          // Aplica correção
          const fix = this.fixes[patternName];
          if (fix) {
            fixedContent = fixedContent.replace(pattern, fix);
            hasChanges = true;
          }
        }
      }
      
      // Salva arquivo se houve mudanças
      if (hasChanges) {
        fs.writeFileSync(filePath, fixedContent, 'utf8');
        this.results.filesFixed++;
        console.log(`✅ Corrigido: ${filePath}`);
      }
      
    } catch (error) {
      this.results.errors.push({
        file: filePath,
        error: error.message
      });
      console.error(`❌ Erro ao processar ${filePath}: ${error.message}`);
    }
  }

  /**
   * Imprime resultados da análise
   */
  printResults() {
    console.log('\n📊 RELATÓRIO DE ANOMALIAS\n');
    console.log(`📁 Arquivos escaneados: ${this.results.filesScanned}`);
    console.log(`🔧 Arquivos corrigidos: ${this.results.filesFixed}`);
    console.log(`❌ Erros encontrados: ${this.results.errors.length}\n`);
    
    // Anomalias por tipo
    console.log('🔍 ANOMALIAS DETECTADAS:\n');
    
    for (const [patternName, occurrences] of Object.entries(this.results.anomaliesFound)) {
      const totalCount = occurrences.reduce((sum, occ) => sum + occ.count, 0);
      console.log(`📌 ${patternName}: ${totalCount} ocorrências em ${occurrences.length} arquivos`);
      
      // Top 5 arquivos mais problemáticos para este padrão
      const sortedOccurrences = occurrences.sort((a, b) => b.count - a.count).slice(0, 5);
      for (const occ of sortedOccurrences) {
        console.log(`   - ${occ.file}: ${occ.count} ocorrências`);
        if (occ.matches.length > 0) {
          console.log(`     Exemplos: ${occ.matches.slice(0, 2).join(', ')}`);
        }
      }
      console.log('');
    }
    
    // Erros
    if (this.results.errors.length > 0) {
      console.log('❌ ERROS DURANTE O PROCESSAMENTO:\n');
      for (const error of this.results.errors) {
        console.log(`   - ${error.file}: ${error.error}`);
      }
    }
    
    // Salva relatório detalhado
    const reportPath = path.join(process.cwd(), 'anomaly-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`📄 Relatório detalhado salvo em: ${reportPath}`);
  }
}

// Executa o scanner se chamado diretamente
if (require.main === module) {
  const scanner = new AnomalyScanner();
  scanner.scanProject().catch(console.error);
}

module.exports = AnomalyScanner;