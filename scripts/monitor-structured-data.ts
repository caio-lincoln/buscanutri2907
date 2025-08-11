/**
 * Script de monitoramento para detectar problemas com dados estruturados
 * Executa verificações periódicas e alerta sobre inconsistências
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { logNormalizationEvent } from '../lib/structured-data-utils'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

interface MonitoringConfig {
  checkInterval: number // em minutos
  alertThreshold: number // número de problemas para disparar alerta
  enableSlackAlerts: boolean
  enableEmailAlerts: boolean
  dryRun: boolean
}

interface DataIssue {
  table: string
  column: string
  id: string
  issue_type: 'double_escape' | 'json_string' | 'invalid_format' | 'mixed_types'
  current_value: any
  suggested_fix: any
  severity: 'low' | 'medium' | 'high'
  detected_at: string
}

class StructuredDataMonitor {
  private supabase
  private config: MonitoringConfig
  private issues: DataIssue[] = []

  constructor(config: MonitoringConfig) {
    this.config = config
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  /**
   * Inicia o monitoramento contínuo
   */
  async startMonitoring() {
    console.log('🔍 Iniciando monitoramento de dados estruturados...')
    console.log(`📊 Intervalo: ${this.config.checkInterval} minutos`)
    console.log(`⚠️  Limite de alerta: ${this.config.alertThreshold} problemas`)

    if (this.config.dryRun) {
      console.log('🧪 Modo DRY RUN ativado - apenas relatórios')
    }

    // Executar verificação inicial
    await this.runHealthCheck()

    // Configurar verificações periódicas
    setInterval(
      async () => {
        await this.runHealthCheck()
      },
      this.config.checkInterval * 60 * 1000
    )
  }

  /**
   * Executa verificação completa de saúde dos dados
   */
  async runHealthCheck() {
    console.log(
      `\n🔍 Executando verificação de saúde - ${new Date().toISOString()}`
    )

    this.issues = []

    // Verificar tabelas principais
    await this.checkNutritionistProfiles()
    await this.checkUserProfiles()
    await this.checkCompanyProfiles()

    // Gerar relatório
    await this.generateReport()

    // Enviar alertas se necessário
    if (this.issues.length >= this.config.alertThreshold) {
      await this.sendAlerts()
    }
  }

  /**
   * Verifica perfis de nutricionistas
   */
  async checkNutritionistProfiles() {
    const structuredFields = [
      'specialties',
      'languages',
      'services',
      'certifications',
      'achievements',
      'working_hours',
      'social_media',
      'addresses',
    ]

    for (const field of structuredFields) {
      await this.checkTableField('nutritionist_profiles', field)
    }
  }

  /**
   * Verifica perfis de usuários
   */
  async checkUserProfiles() {
    const structuredFields = [
      'preferences',
      'dietary_restrictions',
      'health_conditions',
    ]

    for (const field of structuredFields) {
      await this.checkTableField('user_profiles', field)
    }
  }

  /**
   * Verifica perfis de empresas
   */
  async checkCompanyProfiles() {
    const structuredFields = ['services', 'locations', 'contact_methods']

    for (const field of structuredFields) {
      await this.checkTableField('company_profiles', field)
    }
  }

  /**
   * Verifica um campo específico de uma tabela
   */
  async checkTableField(table: string, field: string) {
    try {
      const { data, error } = await this.supabase
        .from(table)
        .select(`id, ${field}`)
        .not(field, 'is', null)
        .limit(1000)

      if (error) {
        console.error(`❌ Erro ao verificar ${table}.${field}:`, error)
        return
      }

      for (const row of data || []) {
        const value = row[field]
        const issues = this.analyzeFieldValue(value, table, field, row.id)
        this.issues.push(...issues)
      }
    } catch (error) {
      console.error(`❌ Erro ao verificar ${table}.${field}:`, error)
    }
  }

  /**
   * Analisa um valor de campo para detectar problemas
   */
  analyzeFieldValue(
    value: any,
    table: string,
    field: string,
    id: string
  ): DataIssue[] {
    const issues: DataIssue[] = []
    const now = new Date().toISOString()

    // Verificar se é string quando deveria ser array/objeto
    if (typeof value === 'string') {
      // Detectar JSON string
      if (this.looksLikeJson(value)) {
        issues.push({
          table,
          column: field,
          id,
          issue_type: 'json_string',
          current_value: value,
          suggested_fix: this.suggestJsonFix(value),
          severity: 'high',
          detected_at: now,
        })
      }

      // Detectar múltiplos escapes
      if (this.hasMultipleEscapes(value)) {
        issues.push({
          table,
          column: field,
          id,
          issue_type: 'double_escape',
          current_value: value,
          suggested_fix: this.suggestEscapeFix(value),
          severity: 'high',
          detected_at: now,
        })
      }
    }

    // Verificar arrays com elementos inconsistentes
    if (Array.isArray(value)) {
      const hasStringElements = value.some(
        item => typeof item === 'string' && this.looksLikeJson(item)
      )
      if (hasStringElements) {
        issues.push({
          table,
          column: field,
          id,
          issue_type: 'mixed_types',
          current_value: value,
          suggested_fix: value.map(item => this.suggestJsonFix(item)),
          severity: 'medium',
          detected_at: now,
        })
      }
    }

    return issues
  }

  /**
   * Verifica se uma string parece ser JSON
   */
  looksLikeJson(value: string): boolean {
    if (typeof value !== 'string') return false

    const trimmed = value.trim()
    return (
      (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('"[') && trimmed.endsWith(']"')) ||
      (trimmed.startsWith('"{') && trimmed.endsWith('}"'))
    )
  }

  /**
   * Verifica se uma string tem múltiplos escapes
   */
  hasMultipleEscapes(value: string): boolean {
    return /\\\\+["'\[\]{}]/g.test(value)
  }

  /**
   * Sugere correção para JSON string
   */
  suggestJsonFix(value: any): any {
    if (typeof value !== 'string') return value

    try {
      // Tentar parse direto
      return JSON.parse(value)
    } catch {
      try {
        // Tentar limpar escapes e parsear
        const cleaned = value.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
        return JSON.parse(cleaned)
      } catch {
        // Se falhar, tentar separar por vírgulas
        return value
          .split(',')
          .map(item => item.trim())
          .filter(Boolean)
      }
    }
  }

  /**
   * Sugere correção para escapes múltiplos
   */
  suggestEscapeFix(value: string): any {
    let cleaned = value

    // Remover escapes duplos progressivamente
    while (cleaned.includes('\\\\') || cleaned.includes('\\"')) {
      cleaned = cleaned.replace(/\\\\"/g, '"').replace(/\\\\/g, '\\')
    }

    return this.suggestJsonFix(cleaned)
  }

  /**
   * Gera relatório de problemas encontrados
   */
  async generateReport() {
    console.log(`\n📊 RELATÓRIO DE MONITORAMENTO`)
    console.log(`🕐 ${new Date().toISOString()}`)
    console.log(`🔍 Problemas encontrados: ${this.issues.length}`)

    if (this.issues.length === 0) {
      console.log('✅ Nenhum problema detectado!')
      return
    }

    // Agrupar por severidade
    const bySeverity = this.issues.reduce(
      (acc, issue) => {
        acc[issue.severity] = (acc[issue.severity] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    console.log(`🔴 Alta: ${bySeverity.high || 0}`)
    console.log(`🟡 Média: ${bySeverity.medium || 0}`)
    console.log(`🟢 Baixa: ${bySeverity.low || 0}`)

    // Agrupar por tipo
    const byType = this.issues.reduce(
      (acc, issue) => {
        acc[issue.issue_type] = (acc[issue.issue_type] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    console.log(`\n📋 Por tipo:`)
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`)
    })

    // Mostrar exemplos dos problemas mais críticos
    const criticalIssues = this.issues
      .filter(issue => issue.severity === 'high')
      .slice(0, 5)
    if (criticalIssues.length > 0) {
      console.log(`\n🚨 Problemas críticos (primeiros 5):`)
      criticalIssues.forEach((issue, index) => {
        console.log(
          `  ${index + 1}. ${issue.table}.${issue.column} (ID: ${issue.id})`
        )
        console.log(`     Tipo: ${issue.issue_type}`)
        console.log(
          `     Valor: ${JSON.stringify(issue.current_value).substring(0, 100)}...`
        )
      })
    }

    // Salvar relatório em arquivo
    await this.saveReportToFile()

    // Registrar evento de monitoramento
    logNormalizationEvent('monitoring_check', {
      issues_found: this.issues.length,
      severity_breakdown: bySeverity,
      type_breakdown: byType,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Salva relatório em arquivo
   */
  async saveReportToFile() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `monitoring-report-${timestamp}.json`

    const report = {
      timestamp: new Date().toISOString(),
      total_issues: this.issues.length,
      issues: this.issues,
      config: this.config,
    }

    try {
      const fs = require('fs').promises
      await fs.writeFile(
        `./reports/${filename}`,
        JSON.stringify(report, null, 2)
      )
      console.log(`💾 Relatório salvo: ./reports/${filename}`)
    } catch (error) {
      console.error('❌ Erro ao salvar relatório:', error)
    }
  }

  /**
   * Envia alertas quando necessário
   */
  async sendAlerts() {
    console.log(
      `\n🚨 ALERTA: ${this.issues.length} problemas detectados (limite: ${this.config.alertThreshold})`
    )

    const criticalCount = this.issues.filter(
      issue => issue.severity === 'high'
    ).length

    const alertMessage = `
🚨 ALERTA: Problemas com dados estruturados detectados

📊 Total de problemas: ${this.issues.length}
🔴 Críticos: ${criticalCount}
🕐 Detectado em: ${new Date().toISOString()}

🔗 Verifique o relatório completo para mais detalhes.
    `.trim()

    if (this.config.enableSlackAlerts) {
      await this.sendSlackAlert(alertMessage)
    }

    if (this.config.enableEmailAlerts) {
      await this.sendEmailAlert(alertMessage)
    }
  }

  /**
   * Envia alerta para Slack
   */
  async sendSlackAlert(message: string) {
    // Implementar integração com Slack
    console.log('📱 Enviando alerta para Slack...')
    console.log(message)
  }

  /**
   * Envia alerta por email
   */
  async sendEmailAlert(message: string) {
    // Implementar integração com email
    console.log('📧 Enviando alerta por email...')
    console.log(message)
  }

  /**
   * Executa correção automática de problemas (se habilitado)
   */
  async autoFix() {
    if (this.config.dryRun) {
      console.log('🧪 Modo DRY RUN - correções não serão aplicadas')
      return
    }

    console.log(
      `🔧 Iniciando correção automática de ${this.issues.length} problemas...`
    )

    let fixedCount = 0
    let errorCount = 0

    for (const issue of this.issues) {
      try {
        const { error } = await this.supabase
          .from(issue.table)
          .update({ [issue.column]: issue.suggested_fix })
          .eq('id', issue.id)

        if (error) {
          console.error(
            `❌ Erro ao corrigir ${issue.table}.${issue.column} (${issue.id}):`,
            error
          )
          errorCount++
        } else {
          console.log(
            `✅ Corrigido: ${issue.table}.${issue.column} (${issue.id})`
          )
          fixedCount++
        }
      } catch (error) {
        console.error(
          `❌ Erro ao corrigir ${issue.table}.${issue.column} (${issue.id}):`,
          error
        )
        errorCount++
      }
    }

    console.log(`\n📊 Correção automática concluída:`)
    console.log(`✅ Corrigidos: ${fixedCount}`)
    console.log(`❌ Erros: ${errorCount}`)
  }
}

// Configuração padrão
const defaultConfig: MonitoringConfig = {
  checkInterval: 30, // 30 minutos
  alertThreshold: 10,
  enableSlackAlerts: false,
  enableEmailAlerts: false,
  dryRun: true,
}

// Executar se chamado diretamente
if (require.main === module) {
  const monitor = new StructuredDataMonitor(defaultConfig)

  // Verificar argumentos da linha de comando
  const args = process.argv.slice(2)

  if (args.includes('--auto-fix')) {
    monitor
      .runHealthCheck()
      .then(() => monitor.autoFix())
      .catch(console.error)
  } else if (args.includes('--once')) {
    monitor.runHealthCheck().catch(console.error)
  } else {
    monitor.startMonitoring().catch(console.error)
  }
}

export { StructuredDataMonitor, type MonitoringConfig, type DataIssue }
