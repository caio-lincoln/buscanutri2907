import { NextRequest } from 'next/server'
import { withErrorHandling, createApiResponse } from '@/lib/api-middleware'
import { requireAdmin } from '@/lib/auth-utils'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email().optional(),
  user_type: z.enum(['paciente', 'nutricionista', 'empresa']).optional(),
  name: z.string().min(1).optional(),
  is_verified: z.boolean().optional(),
})

export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await requireAdmin()
  const admin = createAdminClient()

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return createApiResponse({ success: false, error: 'Payload inválido' })
  }
  const { email, user_type, name, is_verified } = parsed.data

  // Buscar tipo atual do usuário
  const { data: userRow } = await admin
    .from('users')
    .select('id, user_type, email')
    .eq('id', params.id)
    .single()

  const currentType: 'paciente' | 'nutricionista' | 'empresa' | null = (userRow?.user_type as any) ?? null
  const effectiveType = (user_type as any) || currentType

  // Atualizar email no Auth e tabela users
  if (email && email !== userRow?.email) {
    const { error: authErr } = await admin.auth.admin.updateUserById(params.id, { email })
    if (authErr) {
      return createApiResponse({ success: false, error: `Falha ao atualizar email (auth): ${authErr.message}` })
    }
    await admin.from('users').update({ email }).eq('id', params.id)
  }

  // Atualizar tipo do usuário na tabela users (não migra perfis)
  if (user_type && user_type !== currentType) {
    await admin.from('users').update({ user_type }).eq('id', params.id)
  }

  // Atualizar nome conforme tipo
  if (name && effectiveType) {
    if (effectiveType === 'paciente') {
      await admin
        .from('patient_profiles')
        .update({ full_name: name })
        .eq('user_id', params.id)
    } else if (effectiveType === 'nutricionista') {
      await admin
        .from('nutritionist_profiles')
        .update({ full_name: name })
        .eq('user_id', params.id)
    } else if (effectiveType === 'empresa') {
      await admin
        .from('company_profiles')
        .update({ company_name: name })
        .eq('user_id', params.id)
    }
  }

  // Atualizar verificação para nutricionista/empresa
  if (typeof is_verified === 'boolean' && effectiveType) {
    if (effectiveType === 'nutricionista') {
      await admin
        .from('nutritionist_profiles')
        .update({ is_verified, verified_at: is_verified ? new Date().toISOString() : null })
        .eq('user_id', params.id)
    } else if (effectiveType === 'empresa') {
      await admin
        .from('company_profiles')
        .update({ is_verified })
        .eq('user_id', params.id)
    }
  }

  return createApiResponse({ success: true })
})