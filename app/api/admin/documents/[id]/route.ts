import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-utils'

const schema = z.object({
  status: z.enum(['pending', 'verified', 'rejected']),
  label: z.string().min(1).max(255).optional(),
  notes: z.string().min(1).max(2000).optional(),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  await requireAdmin()
  const supabaseAdmin = createAdminClient()

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: 'Payload inválido' }, { status: 400 })
  }

  const { status, label, notes } = parsed.data
  const docId = params.id

  let isVerified: boolean | null = null
  let verificationNotes: string | null = null

  if (status === 'verified') {
    isVerified = true
    verificationNotes = notes ?? null
  } else if (status === 'pending') {
    isVerified = false
    verificationNotes = null
  } else {
    isVerified = false
    verificationNotes = notes ?? null
  }

  const update: Record<string, unknown> = {
    is_verified: isVerified,
    verification_notes: verificationNotes,
  }

  if (label) {
    update.title = label
  }

  const { data, error } = await supabaseAdmin
    .from('nutritionist_documents')
    .update(update)
    .eq('id', docId)
    .select('id, nutritionist_id, document_type, title, file_name, file_url, storage_path, file_size, mime_type, is_verified, verification_notes, created_at')
    .maybeSingle()

  if (error || !data) {
    const message = error?.message || 'Falha ao atualizar documento'
    return NextResponse.json({ ok: false, message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, document: data })
}

