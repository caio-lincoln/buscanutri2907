import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const WINDOW_MS = 60_000 // 1 minuto
const MAX_REQ = 5
const bucket = new Map<string, { count: number; ts: number }>()

function rateLimit(ip: string) {
  const now = Date.now()
  const node = bucket.get(ip)
  if (!node || now - node.ts > WINDOW_MS) {
    bucket.set(ip, { count: 1, ts: now })
    return false
  }
  node.count++
  return node.count > MAX_REQ
}

const schema = z.object({ email: z.string().email() })

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  if (rateLimit(ip)) {
    await new Promise(r => setTimeout(r, 500))
    return NextResponse.json({ ok: true })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    await new Promise(r => setTimeout(r, 300))
    return NextResponse.json({ ok: true })
  }

  const supabase = await createClient()
  const origin =
    process.env['NEXT_PUBLIC_SITE_URL'] ||
    req.headers.get('origin') ||
    'http://localhost:3000'

  const redirectTo = new URL('/redefinir-senha', origin).toString()

  await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo })

  await new Promise(r => setTimeout(r, 300))
  return NextResponse.json({ ok: true })
}
