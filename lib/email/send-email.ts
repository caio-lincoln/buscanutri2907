import { getTransporter } from './gmail-transporter'
import { UserRole } from './templates'
import { renderEmailTemplate } from './templates/renderer'

export interface SendWelcomeInput {
  to: string
  name: string
  role: UserRole
  app_name: string;
  support_email: string;
  welcome_nutritionist_html?: string;
  welcome_nutritionist_text?: string;
  welcome_patient_html?: string;
  welcome_patient_text?: string;
  welcome_company_html?: string;
  welcome_company_text?: string;
  welcome_email_template?: string;
}

export async function sendWelcomeEmail({
  to,
  name,
  role,
  app_name,
  support_email,
  welcome_nutritionist_html,
  welcome_nutritionist_text,
  welcome_patient_html,
  welcome_patient_text,
  welcome_company_html,
  welcome_company_text,
  welcome_email_template
}: SendWelcomeInput) {
  const transporter = await getTransporter()

  let htmlTemplate = welcome_email_template; 
  let textTemplate;

  if (role === 'NUTRITIONIST') {
    htmlTemplate = welcome_nutritionist_html || htmlTemplate;
    textTemplate = welcome_nutritionist_text;
  } else if (role === 'PATIENT') {
    htmlTemplate = welcome_patient_html || htmlTemplate;
    textTemplate = welcome_patient_text;
  } else if (role === 'COMPANY') {
    htmlTemplate = welcome_company_html || htmlTemplate;
    textTemplate = welcome_company_text;
  }

  const template = await renderEmailTemplate(role, {
    name,
    role,
    dashboard_url: `${process.env[ 'NEXT_PUBLIC_APP_URL' ] || 'https://www.buscanutri.com.br'}/dashboard`,
    app_name: app_name ?? 'Busca Nutri',
    support_email: support_email || 'contato@buscanutri.com',
    welcome_email_template: htmlTemplate as string,
    welcome_email_text: textTemplate as string,
  })
  const FROM = `${app_name} <${support_email}>`

  await transporter.sendMail({
    from: FROM,
    to,
    subject: template.subject,
    text: template.text,
    html: template.html,
  })
}
