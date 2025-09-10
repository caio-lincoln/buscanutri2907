import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '../../../../lib/email/send-email'

function mapRole(raw?: string) {
  const r = (raw || '').toUpperCase()
  if (['NUTRITIONIST','NUTRICIONISTA'].includes(r)) return 'NUTRITIONIST'
  if (['COMPANY','EMPRESA'].includes(r)) return 'COMPANY'
  return 'PATIENT'
}

export async function POST(req: NextRequest) {
  console.log(req.headers)
  // if (req.headers.get('authorization') !== `Bearer ${process.env['WEBHOOK_TOKEN']}`) {
  //   return NextResponse.json({ ok: false }, { status: 401 })
  // }

  const body = await req.json()
  console.log("🚀 ~ POST ~ body:", body)
  const rec = body?.record ?? body?.user ?? body

  const email = rec?.email
  const name = rec?.raw_user_meta_data?.name ?? rec?.user_metadata?.name ?? undefined
  const role = mapRole(rec?.raw_user_meta_data?.user_type ?? rec?.user_metadata?.user_type)

  if (!email) return NextResponse.json({ ok: false, error: 'no email' }, { status: 400 })

  await sendWelcomeEmail({ to: email, name, role })
  return NextResponse.json({ ok: true })
}
