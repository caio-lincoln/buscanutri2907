import { FROM, getTransporter } from './gmail-transporter'
import type { UserRole } from './templates'
import { subjectByRole, htmlByRole, textFallback } from './templates'

export interface SendWelcomeInput {
  to: string
  name: string
  role: UserRole
}

export async function sendWelcomeEmail({ to, name, role }: SendWelcomeInput) {
  const transporter = await getTransporter()
  const subject = subjectByRole(role)
  const html = htmlByRole(role, { name })
  const text = textFallback(role, { name })

  await transporter.sendMail({
    from: FROM,
    to,
    subject,
    text,
    html,
  })
}
