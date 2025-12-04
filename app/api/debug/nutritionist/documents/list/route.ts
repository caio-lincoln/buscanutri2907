import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const userId = url.searchParams.get('userId')
  if (!userId) return NextResponse.json({ ok: false, message: 'userId required' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('nutritionist_documents')
    .select('id, nutritionist_id, document_type, title, file_name, storage_path, created_at')
    .eq('nutritionist_id', userId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, documents: data })
}
