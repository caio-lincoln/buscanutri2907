import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../../lib/supabase/server'
import { requireAdmin } from '../../../../../lib/auth-utils'

export async function POST(req: Request) {
  await requireAdmin()
  const body = await req.json().catch(() => ({}))
  const { paths = [], expiresIn = 300, bucket = 'documentos-nutricionistas' } = body as { paths: string[]; expiresIn?: number; bucket?: string }

  if (!Array.isArray(paths) || paths.length === 0) {
    return NextResponse.json({ ok: false, message: 'paths inválidos' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin.storage.from(bucket).createSignedUrls(paths, expiresIn)
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })

  const results: Record<string, string | null> = {}
  data?.forEach((r, i) => { results[paths[i]] = r?.signedUrl ?? null })
  return NextResponse.json({ ok: true, results })
}
