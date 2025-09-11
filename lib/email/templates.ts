export type UserRole = 'NUTRITIONIST' | 'PATIENT' | 'COMPANY'

export function subjectByRole(role: UserRole) {
  switch (role) {
    case 'NUTRITIONIST':
      return 'Bem-vindo(a) ao NutriBusca — Comece a atender hoje!'
    case 'PATIENT':
      return 'Bem-vindo(a) ao NutriBusca — Sua jornada de saúde começa aqui'
    case 'COMPANY':
      return 'Bem-vindo(a) ao NutriBusca — Conecte sua equipe à nutrição'
  }
}

export function htmlByRole(role: UserRole, { name }: { name?: string } = {}) {
  const safeName = name ? `, ${name}` : ''
  const baseStyle = `font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Helvetica,Arial; color:#1E1D40;`
  const btn = (href: string, label = 'Acessar plataforma') => `
<a href="${href}" style="display:inline-block;padding:12px 18px;border-radius:10px;text-decoration:none;background:#4AB0D9;color:#fff;font-weight:600">${label}</a>
`
  if (role === 'NUTRITIONIST') {
    return `
<div style="${baseStyle}">
<h2>Olá${safeName} 👋</h2>
<p>Que bom ter você no <strong>NutriBusca</strong>! Complete seu perfil profissional, conecte sua conta para pagamentos e publique sua agenda.</p>
<ul>
<li>✔️ Configure horários e modalidades de atendimento</li>
<li>✔️ Conecte sua conta para receber (Stripe/PIX, conforme seu setup)</li>
<li>✔️ Personalize seu cartão de visita</li>
</ul>
${btn(process.env[ 'NEXT_PUBLIC_APP_URL' ] ?? 'https://www.buscanutri.com.br/')}
<p style="margin-top:24px;font-size:13px;color:#6b7280">Dica: perfis completos recebem mais agendamentos.</p>
</div>
`
  }
  if (role === 'PATIENT') {
    return `
<div style="${baseStyle}">
<h2>Bem-vindo(a)${safeName}! 🥗</h2>
<p>Você está a um passo de encontrar o(a) nutricionista ideal. Busque por especialidade, atendimento online/presencial e avaliações reais.</p>
<ul>
<li>🔎 Explore profissionais por área de atuação</li>
<li>🗓️ Agende no melhor horário para você</li>
<li>💬 Tire dúvidas no pré-atendimento (se habilitado)</li>
</ul>
${btn(process.env[ 'NEXT_PUBLIC_APP_URL' ] ?? 'https://www.buscanutri.com.br/')}
</div>
`
  }
  // COMPANY
  return `
<div style="${baseStyle}">
<h2>Olá${safeName}! 🧭</h2>
<p>Agora sua empresa pode conectar colaboradores a nutricionistas credenciados, gerenciar benefícios e acompanhar indicadores de saúde.</p>
<ul>
<li>🏢 Cadastre unidades e elegibilidade</li>
<li>👤 Convide colaboradores com um clique</li>
<li>📊 Acompanhe relatórios de utilização</li>
</ul>
${btn(process.env[ 'NEXT_PUBLIC_APP_URL' ] ?? 'https://www.buscanutri.com.br/')}
</div>
`
}

export function textFallback(role: UserRole, { name }: { name?: string } = {}) {
  const safeName = name ? `, ${name}` : ''
  switch (role) {
    case 'NUTRITIONIST':
      return `Olá${safeName}! Complete seu perfil, conecte pagamentos e publique sua agenda no NutriBusca.`
    case 'PATIENT':
      return `Olá${safeName}! Encontre nutricionistas e agende seu atendimento pelo NutriBusca.`
    case 'COMPANY':
      return `Olá${safeName}! Cadastre unidades e convide colaboradores para usar o NutriBusca.`
  }
}
