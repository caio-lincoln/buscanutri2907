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
  const newEmail = email ? email.trim().toLowerCase() : undefined
 
  const rawId = (await params).id
  let userRowQuery = admin.from('users').select('id, user_type, email')
  let userRowResp
  if (/^\\d+$/.test(rawId)) {
    userRowResp = await userRowQuery.eq('ID', Number(rawId)).maybeSingle()
  } else {
    userRowResp = await userRowQuery.eq('id', rawId).maybeSingle()
  }
  const userRow = userRowResp.data

  const currentType: 'paciente' | 'nutricionista' | 'empresa' | null = (userRow?.user_type as any) ?? null
  const effectiveType = (user_type as any) || currentType

  let didUpdateEmail = false
  let didUpdateType = false
  let didUpdateName = false
  let didUpdateVerified = false

  // Atualizar email no Auth e tabela users
  if (newEmail && newEmail !== userRow?.email) {
    const { data: existingAuthUser } = await admin
      .schema('auth')
      .from('users')
      .select('id')
      .eq('email', newEmail)
      .maybeSingle()
    if (existingAuthUser && existingAuthUser.id !== userRow?.id) {
      return createApiResponse({ success: false, error: 'E-mail já está em uso por outra conta' })
    }
    const { error: authErr } = await admin.auth.admin.updateUserById(userRow!.id, { email: newEmail })
    if (authErr) {
      return createApiResponse({ success: false, error: `Falha ao atualizar email (auth): ${authErr.message}` })
    }
    const { data: updatedUserEmail } = await admin
      .from('users')
      .update({ email: newEmail })
      .eq('id', userRow!.id)
      .select('id')
      .maybeSingle()
    didUpdateEmail = !!updatedUserEmail
  }

  // Atualizar tipo do usuário na tabela users (não migra perfis)
  if (user_type && user_type !== currentType) {
    const { data: updatedUserType } = await admin
      .from('users')
      .update({ user_type })
      .eq('id', userRow!.id)
      .select('id')
      .maybeSingle()
    didUpdateType = !!updatedUserType
  }

  // Atualizar nome conforme tipo
  if (name && effectiveType) {
    const tryUpdateWithFallback = async (
      table: 'patient_profiles' | 'nutritionist_profiles' | 'company_profiles',
      values: Record<string, any>
    ) => {
      // Primeiro tenta atualizar via user_id
      let { data: updatedByUserId } = await admin
        .from(table)
        .update(values)
        .eq('user_id', userRow!.id)
        .select('id')
        .maybeSingle()

      if (updatedByUserId) return true

      // Fallback: alguns registros podem ter o próprio id do perfil igual ao id do usuário
      const { data: updatedById } = await admin
        .from(table)
        .update(values)
        .eq('id', userRow!.id)
        .select('id')
        .maybeSingle()

      return !!updatedById
    }

    let updated = false
    if (effectiveType === 'paciente') {
      updated = await tryUpdateWithFallback('patient_profiles', { full_name: name })
      if (!updated) {
        // Criar perfil ausente e tentar novamente
        await admin.from('patient_profiles').insert({ user_id: userRow!.id, full_name: name }).select('id').maybeSingle()
        updated = await tryUpdateWithFallback('patient_profiles', { full_name: name })
      }
    } else if (effectiveType === 'nutricionista') {
      updated = await tryUpdateWithFallback('nutritionist_profiles', { full_name: name })
      if (!updated) {
        await admin.from('nutritionist_profiles').insert({ user_id: userRow!.id, full_name: name, is_verified: false }).select('id').maybeSingle()
        updated = await tryUpdateWithFallback('nutritionist_profiles', { full_name: name })
      }
    } else if (effectiveType === 'empresa') {
      updated = await tryUpdateWithFallback('company_profiles', { company_name: name })
      if (!updated) {
        await admin.from('company_profiles').insert({ user_id: userRow!.id, company_name: name, is_verified: false }).select('id').maybeSingle()
        updated = await tryUpdateWithFallback('company_profiles', { company_name: name })
      }
    }

    if (!updated) {
      return createApiResponse({ success: false, error: 'Perfil não encontrado para atualizar nome' })
    }
    didUpdateName = updated
  }

  // Atualizar verificação para nutricionista/empresa
  if (typeof is_verified === 'boolean' && effectiveType) {
    const tryUpdateVerifyWithFallback = async (
      table: 'nutritionist_profiles' | 'company_profiles',
      values: Record<string, any>
    ) => {
      let { data: updatedByUserId } = await admin
        .from(table)
        .update(values)
        .eq('user_id', userRow!.id)
        .select('id')
        .maybeSingle()

      if (updatedByUserId) return true

      const { data: updatedById } = await admin
        .from(table)
        .update(values)
        .eq('id', userRow!.id)
        .select('id')
        .maybeSingle()

      return !!updatedById
    }

    if (effectiveType === 'nutricionista') {
      didUpdateVerified = await tryUpdateVerifyWithFallback('nutritionist_profiles', { is_verified, verified_at: is_verified ? new Date().toISOString() : null })
      if (!didUpdateVerified) {
        await admin.from('nutritionist_profiles').insert({ user_id: userRow!.id, full_name: null, is_verified }).select('id').maybeSingle()
        didUpdateVerified = await tryUpdateVerifyWithFallback('nutritionist_profiles', { is_verified, verified_at: is_verified ? new Date().toISOString() : null })
      }
    } else if (effectiveType === 'empresa') {
      didUpdateVerified = await tryUpdateVerifyWithFallback('company_profiles', { is_verified })
      if (!didUpdateVerified) {
        await admin.from('company_profiles').insert({ user_id: userRow!.id, company_name: null, is_verified }).select('id').maybeSingle()
        didUpdateVerified = await tryUpdateVerifyWithFallback('company_profiles', { is_verified })
      }
    }
  }

  const success = didUpdateEmail || didUpdateType || didUpdateName || didUpdateVerified
  return createApiResponse({
    success,
    changed: {
      email: didUpdateEmail,
      user_type: didUpdateType,
      name: didUpdateName,
      is_verified: didUpdateVerified,
    }
  })
})
