import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { NutritionistProfile, Specialty } from '@/lib/supabase'
import { getNutritionistRatingStats } from '@/lib/rating-service'
import NutricionistasClient from './_client'

export default async function NutricionistasPage() {
  const supabase = await createClient()

  // Verificação de Admin e Usuários de Teste
  const { data: { user: authUser } } = await supabase.auth.getUser()
  let isAdmin = false
  if (authUser) {
    const { data: userProfile } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', authUser.id)
      .single()
    if (userProfile?.user_type === 'admin') isAdmin = true
  }

  let blockedIds: string[] = []
  if (!isAdmin) {
    const adminSupabase = createAdminClient()
    const TEST_EMAILS = [ 'nutricionista@buscanutri.com', 'paciente@buscanutri.com', 'empresa@buscanutri.com' ]
    const { data: blockedUsers } = await adminSupabase
      .from('users')
      .select('id')
      .in('email', TEST_EMAILS)

    if (blockedUsers) {
      blockedIds = blockedUsers.map(u => u.id)
    }
  }

  const { data } = await supabase.rpc('get_nutritionists_safe', {
    p_limit: 1000,
    p_offset: 0,
  })

  let base = (data || []) as NutritionistProfile[]

  if (blockedIds.length > 0) {
    base = base.filter(n => !blockedIds.includes(n.user_id))
  }

  const nutritionists = await Promise.all(
    base.map(async n => {
      const ratingVal = Number(n.rating || 0)
      const reviewsVal = Number(n.total_reviews || 0)
      if (ratingVal > 0 || reviewsVal > 0 || !n.user_id) return n
      try {
        const stats = await getNutritionistRatingStats(n.user_id)
        return {
          ...n,
          rating: stats.averageRating,
          total_reviews: stats.totalReviews,
        }
      } catch {
        return n
      }
    })
  )

  const ids = nutritionists.map(n => n.id).filter(Boolean) as string[]

  const { data: addresses } = await supabase
    .from('nutritionist_addresses')
    .select('nutritionist_id, state, city, neighborhood, is_main, status')
    .in('nutritionist_id', ids)
    .eq('is_main', true)
    .eq('status', 'active')

  const formattedMap: Record<string, string> = {}
  ;(addresses || []).forEach((addr: any) => {
    const display = [addr.state, addr.city, addr.neighborhood]
      .filter(Boolean)
      .join(' / ')
    formattedMap[addr.nutritionist_id] = display
  })

  const { data: specialties } = await supabase
    .from('specialties')
    .select('*')
    .order('name', { ascending: true })

  return (
    <NutricionistasClient
      initialNutritionists={nutritionists}
      initialSpecialties={(specialties || []) as Specialty[]}
      initialMainAddresses={formattedMap}
      blockedIds={blockedIds}
    />
  )
}
