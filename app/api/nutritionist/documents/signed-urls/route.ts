import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '../../../../../lib/supabase/server';

export async function POST(req: Request) {
  const body = await req.json()
  const { paths, expiresIn = 300, bucket = 'nutritionist-documents' } = body as { paths: string[]; expiresIn?: number; bucket?: string }

  const supa = await createClient()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return NextResponse.json({ ok:false }, { status: 401 })

  // As paths são construídas com userId como primeiro segmento: `${user.id}/...`
  const owned = (paths || []).every(p => typeof p === 'string' && p.startsWith(`${user.id}/`))
  if (!owned) return NextResponse.json({ ok:false }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin.storage.from(bucket).createSignedUrls(paths, expiresIn)
  if (error) return NextResponse.json({ ok:false, message: error.message }, { status: 500 })

  const results: Record<string,string|null> = {}
  data?.forEach((r,i) => { results[paths[i]] = r?.signedUrl ?? null })
  return NextResponse.json({ ok:true, results })
}
