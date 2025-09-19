import { createSupabaseClient } from '@/lib/supabase'

export type CorporateFlags = {
  accepts_corporate_plans?: boolean
  aceita_cupons?: boolean
}

const supabase = createSupabaseClient()

export async function getMyNutritionistProfileMinimal() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('nutritionist_profiles')
    .select('id, user_id, full_name, accepts_corporate_plans, aceita_cupons')
    .eq('user_id', user.id)
    .maybeSingle()
  return data
}

export async function updateMyCorporateFlags(patch: CorporateFlags) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('not-authenticated')
  const { error } = await supabase
    .from('nutritionist_profiles')
    .update(patch)
    .eq('user_id', user.id)

  if (error) throw error
}
