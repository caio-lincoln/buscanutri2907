import { getTransporter } from './gmail-transporter'
import { OutdatedPackage } from '../update-checker'

export async function sendSystemUpdateNotification(
  packages: Record<string, OutdatedPackage>,
  recipients: string[]
) {
  if (!recipients.length) {
    console.warn('Nenhum destinatário configurado para notificações de sistema.')
    return
  }

  const transporter = await getTransporter()
  
  // Construir corpo do email
  const packageListHtml = Object.entries(packages)
    .map(([name, info]) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 8px;"><strong>${name}</strong></td>
        <td style="padding: 8px;">${info.current}</td>
        <td style="padding: 8px;">${info.wanted}</td>
        <td style="padding: 8px; color: #d9534f; font-weight: bold;">${info.latest}</td>
      </tr>
    `).join('')

  const packageListText = Object.entries(packages)
    .map(([name, info]) => `${name}: Atual (${info.current}) -> Latest (${info.latest})`)
    .join('\n')

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>📦 Atualizações de Dependências Disponíveis</h2>
      <p>O sistema detectou novas versões para as seguintes bibliotecas:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background-color: #f8f9fa; text-align: left;">
            <th style="padding: 8px;">Pacote</th>
            <th style="padding: 8px;">Atual</th>
            <th style="padding: 8px;">Wanted</th>
            <th style="padding: 8px;">Latest</th>
          </tr>
        </thead>
        <tbody>
          ${packageListHtml}
        </tbody>
      </table>

      <p style="margin-top: 20px; font-size: 0.9em; color: #666;">
        Este é um alerta automático do sistema BuscaNutri.
        <br>
        Verifique as Breaking Changes antes de atualizar.
      </p>
    </div>
  `

  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'BuscaNutri'
  const supportEmail = process.env.GMAIL_SENDER_EMAIL || 'sistema@buscanutri.com'
  const FROM = `${appName} System <${supportEmail}>`

  await transporter.sendMail({
    from: FROM,
    to: recipients.join(', '),
    subject: `[${appName}] 📦 Atualizações de Sistema Disponíveis`,
    text: `Atualizações Disponíveis:\n\n${packageListText}`,
    html: html,
  })
}
