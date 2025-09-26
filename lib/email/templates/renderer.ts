import { defaultHtmlTemplates, defaultSubjects, defaultTextTemplates } from './defaults'
import { UserRole } from '../templates'

interface TemplateData {
  name?: string
  company_name?: string
  welcome_email_template?: string;
  welcome_email_text?: string;
  [key: string]: any
}

export async function renderEmailTemplate(role: UserRole, data: TemplateData = {}) {
  const customHtmlTemplate = data.welcome_email_template
  const customTextTemplate = data.welcome_email_text
  
  const htmlTemplate = customHtmlTemplate || defaultHtmlTemplates[role]
  const textTemplate = customTextTemplate || defaultTextTemplates[role]
  const subject = defaultSubjects[role]
  
  // Prepara os dados para substituição
  const templateData = {
    ...data,
    ...(role === 'COMPANY' ? { companyName: data.company_name } : {}),
    platformUrl: process.env['NEXT_PUBLIC_APP_URL'] || 'https://www.buscanutri.com.br'
  }
  
  // Substitui as variáveis no template
  const html = replaceTemplateVars(htmlTemplate, templateData)
  const text = replaceTemplateVars(textTemplate, templateData)
  
  return {
    subject,
    html,
    text
  }
}

export const allowedVars = ['name', 'role', 'dashboard_url', 'app_name', 'support_email', 'company_name']

export function renderTemplate(str: string, vars: Record<string, string>): string {
  // Sanitizar as variáveis para permitir apenas as chaves permitidas
  const sanitizedVars: Record<string, string> = {}
  for (const key of allowedVars) {
    if (key in vars) {
      sanitizedVars[key] = vars[key]
    }
  }

  // Substituir os placeholders por seus valores
  let result = str
  for (const [key, value] of Object.entries(sanitizedVars)) {
    const placeholder = `{{${key}}}`
    result = result.replace(new RegExp(placeholder, 'g'), value || '')
  }

  // Remover placeholders não reconhecidos
  result = result.replace(/{{[^}]+}}/g, '')

  return result
}

function replaceTemplateVars(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? data[key] : ''
  })
}
