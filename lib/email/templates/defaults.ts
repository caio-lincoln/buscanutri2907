import { UserRole } from '../templates'

export const defaultSubjects: Record<UserRole, string> = {
  NUTRITIONIST: 'Bem-vindo(a) ao BuscaNutri — Comece a atender hoje!',
  PATIENT: 'Bem-vindo(a) ao BuscaNutri — Sua jornada de saúde começa aqui',
  COMPANY: 'Bem-vindo(a) ao BuscaNutri — Conecte sua equipe à nutrição'
}

export const defaultHtmlTemplates: Record<UserRole, string> = {
  NUTRITIONIST: `
<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Helvetica,Arial; color:#1E1D40;">
<h2>Olá {{name}} 👋</h2>
<p>Que bom ter você no <strong>BuscaNutri</strong>! Complete seu perfil profissional, conecte sua conta para pagamentos e publique sua agenda.</p>
<ul>
<li>✔️ Configure horários e modalidades de atendimento</li>
<li>✔️ Conecte sua conta para receber (Stripe/PIX, conforme seu setup)</li>
<li>✔️ Personalize seu cartão de visita</li>
</ul>
<a href="{{platformUrl}}/dashboard/nutricionistas" style="display:inline-block;padding:12px 18px;border-radius:10px;text-decoration:none;background:#4AB0D9;color:#fff;font-weight:600">Acessar plataforma</a>
<p style="margin-top:24px;font-size:13px;color:#6b7280">Dica: perfis completos recebem mais agendamentos.</p>
</div>
`,

  PATIENT: `
<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Helvetica,Arial; color:#1E1D40;">
<h2>Bem-vindo(a) {{name}}! 🥗</h2>
<p>Você está a um passo de encontrar o(a) nutricionista ideal. Busque por especialidade, atendimento online/presencial e avaliações reais.</p>
<ul>
<li>🔎 Explore profissionais por área de atuação</li>
<li>🗓️ Agende no melhor horário para você</li>
<li>💬 Tire dúvidas no pré-atendimento (se habilitado)</li>
</ul>
<a href="{{platformUrl}}/dashboard/pacientes" style="display:inline-block;padding:12px 18px;border-radius:10px;text-decoration:none;background:#4AB0D9;color:#fff;font-weight:600">Acessar plataforma</a>
</div>
`,

  COMPANY: `
<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Helvetica,Arial; color:#1E1D40;">
<h2>Olá {{name}}! 🧭</h2>
<p>Agora sua empresa pode conectar colaboradores a nutricionistas credenciados, gerenciar benefícios e acompanhar indicadores de saúde.</p>
<ul>
<li>🏢 Cadastre unidades e elegibilidade</li>
<li>👤 Convide colaboradores com um clique</li>
<li>📊 Acompanhe relatórios de utilização</li>
</ul>
<a href="{{platformUrl}}/dashboard/empresas" style="display:inline-block;padding:12px 18px;border-radius:10px;text-decoration:none;background:#4AB0D9;color:#fff;font-weight:600">Acessar plataforma</a>
</div>
`
}

export const defaultTextTemplates: Record<UserRole, string> = {
  NUTRITIONIST: `Olá {{name}}! Complete seu perfil, conecte pagamentos e publique sua agenda no BuscaNutri.`,
  PATIENT: `Olá {{name}}! Encontre nutricionistas e agende seu atendimento pelo BuscaNutri.`,
  COMPANY: `Olá {{name}}! Cadastre unidades e convide colaboradores para usar o NutriBusca.`
}
