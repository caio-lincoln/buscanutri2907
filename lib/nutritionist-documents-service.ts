import { createSupabaseClient } from '@/lib/supabase'

const supabase = createSupabaseClient()

export type NutritionistDoc = {
  id: string
  nutritionist_id: string
  document_type: string
  title: string | null
  file_name: string   
  created_at: string
}

export async function listMyDocs(profileId: string): Promise<NutritionistDoc[]> {
  const { data, error } = await supabase
    .from('nutritionist_documents')
    .select('id, nutritionist_id, document_type, title, file_name, created_at')
    .eq('nutritionist_id', profileId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as any
}

export async function signDocUrls(keys: string[], expiresIn = 300) {
  const res = await fetch('/api/nutritionist/documents/signed-urls', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ bucket: 'nutritionist_documents', paths: keys, expiresIn })
  })
  const j = await res.json()
  return (j?.results ?? {}) as Record<string,string|null>
}

export async function deleteMyDoc(id: string) {
  const { error } = await supabase.from('nutritionist_documents').delete().eq('id', id)
  if (error) throw error
}