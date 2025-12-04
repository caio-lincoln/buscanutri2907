import { createSupabaseClient } from '@/lib/supabase'

const supabase = createSupabaseClient()

export type NutritionistDoc = {
  id: string
  nutritionist_id: string
  document_type: string
  title: string | null
  file_name: string   
  storage_path: string
  created_at: string
}

export async function listMyDocs(profileId?: string): Promise<NutritionistDoc[]> {
  // Se profileId não for fornecido, tentar obter o userId atual
  let queryId = profileId
  if (!queryId) {
    const { data: authData } = await supabase.auth.getUser()
    queryId = authData?.user?.id || ''
  }

  const { data, error } = await supabase
    .from('nutritionist_documents')
    .select('id, nutritionist_id, document_type, title, file_name, storage_path, created_at')
    .eq('nutritionist_id', queryId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as any
}

export async function signDocUrls(keys: string[], expiresIn = 300) {
  const res = await fetch('/api/nutritionist/documents/signed-urls', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    // Espera receber storage paths completos
    body: JSON.stringify({ bucket: 'nutritionist-documents', paths: keys, expiresIn })
  })
  const j = await res.json()
  return (j?.results ?? {}) as Record<string,string|null>
}

export async function deleteMyDoc(id: string) {
  const { error } = await supabase.from('nutritionist_documents').delete().eq('id', id)
  if (error) throw error
}
