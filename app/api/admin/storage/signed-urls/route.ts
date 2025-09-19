import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '../../../../../lib/auth-utils'
import { createAdminClient } from '../../../../../lib/supabase/server'

const bodySchema = z.object({
  bucket: z.string().default('nutritionist_documents'),
  paths: z.array(z.string().min(1)).min(1),
  expiresIn: z.number().int().positive().max(60 * 60).default(60 * 5) 
})

export async function POST(req: Request) {
  await requireAdmin()
  const supabaseAdmin = createAdminClient()

  const json = await req.json().catch(() => ({}))
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: 'payload inválido' }, { status: 400 })
  }
  const { bucket, paths, expiresIn } = parsed.data

  const { data, error } = await supabaseAdmin
  .storage
  .from(bucket)
  .createSignedUrls(paths, expiresIn)
  
  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  }

  const results: Record<string, string> = {}
  data.forEach((item, i) => {
    if (item?.signedUrl) results[ paths[ i ] ] = item.signedUrl
  })

  return NextResponse.json({ ok: true, results })
}
