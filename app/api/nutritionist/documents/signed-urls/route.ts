import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '../../../../../lib/supabase/server';

export async function POST(req: Request) {
  const body = await req.json()
  const { paths, expiresIn = 300, bucket = 'documentos-nutricionistas' } = body as { paths: string[]; expiresIn?: number; bucket?: string }

  const supa = await createClient()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return NextResponse.json({ ok:false }, { status: 401 })

  const { data: profile } = await supa
    .from('nutritionist_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!profile) return NextResponse.json({ ok:false }, { status: 403 })

  const owned = (paths || []).every(p => typeof p === 'string' && p.startsWith(`${profile.id}/`))
  if (!owned) return NextResponse.json({ ok:false }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin.storage.from(bucket).createSignedUrls(paths, expiresIn)
  if (error) return NextResponse.json({ ok:false, message: error.message }, { status: 500 })

  const results: Record<string,string|null> = {}
  data?.forEach((r,i) => { results[paths[i]] = r?.signedUrl ?? null })
  return NextResponse.json({ ok:true, results })
}