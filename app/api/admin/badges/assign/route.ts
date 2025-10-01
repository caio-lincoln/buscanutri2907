import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin, getCurrentUser } from '@/lib/auth-utils'
import { requireProductionAuth, logProductionOperation, ProductionAuthorizationError } from '@/lib/production-auth'
import { z } from 'zod'

const assignBadgeSchema = z.object({
  badgeId: z.string().uuid('Badge ID deve ser um UUID válido'),
  nutritionistId: z.string().uuid('Nutritionist ID deve ser um UUID válido'),
  adminUserId: z.string().uuid('Admin User ID deve ser um UUID válido')
})

const removeBadgeSchema = z.object({
  badgeId: z.string().uuid('Badge ID deve ser um UUID válido'),
  nutritionistId: z.string().uuid('Nutritionist ID deve ser um UUID válido')
})

// POST - Atribuir badge a nutricionista
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()
    const supabase = createAdminClient()
    
    const body = await request.json()
    
    // Verificar autorização de produção para operações críticas
    requireProductionAuth(request, body, 'atribuição de badge')
    
    const { badgeId, nutritionistId, adminUserId } = assignBadgeSchema.parse(body)
    
    // Verificar se o usuário é admin
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('id, user_type')
      .eq('id', adminUserId)
      .single()

    if (adminError) {
      console.error('Error fetching admin user:', adminError)
      return NextResponse.json({ error: 'Erro ao verificar usuário admin' }, { status: 500 })
    }

    if (!adminUser || adminUser.user_type !== 'admin') {
      return NextResponse.json({ error: 'Usuário não é administrador' }, { status: 403 })
    }

    // Verificar se a atribuição já existe
    const { data: existingAssignment, error: checkError } = await supabase
      .from('nutritionist_badges')
      .select('id')
      .eq('nutritionist_id', nutritionistId)
      .eq('badge_id', badgeId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing assignment:', checkError)
      return NextResponse.json({ error: 'Erro ao verificar atribuição existente' }, { status: 500 })
    }

    if (existingAssignment) {
      return NextResponse.json({ error: 'Badge já atribuída a este nutricionista' }, { status: 400 })
    }

    // Criar a atribuição
    const { data, error } = await supabase
      .from('nutritionist_badges')
      .insert({
        nutritionist_id: nutritionistId,
        badge_id: badgeId,
        awarded_by: adminUserId,
        awarded_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error assigning badge:', error)
      return NextResponse.json({ error: 'Erro ao atribuir badge' }, { status: 500 })
    }

    // Log da operação em produção
    logProductionOperation('ASSIGN_BADGE', `${badgeId}-${nutritionistId}`, user.id)

    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    if (error instanceof ProductionAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error in POST /api/admin/badges/assign:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Remover badge de nutricionista
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAdmin()
    const supabase = createAdminClient()
    
    const body = await request.json()
    
    // Verificar autorização de produção para operações críticas
    requireProductionAuth(request, body, 'remoção de badge')
    
    const { badgeId, nutritionistId } = removeBadgeSchema.parse(body)
    
    const { error } = await supabase
      .from('nutritionist_badges')
      .delete()
      .eq('nutritionist_id', nutritionistId)
      .eq('badge_id', badgeId)

    if (error) {
      console.error('Error removing badge:', error)
      return NextResponse.json({ error: 'Erro ao remover badge' }, { status: 500 })
    }

    // Log da operação em produção
    logProductionOperation('REMOVE_BADGE', `${badgeId}-${nutritionistId}`, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    if (error instanceof ProductionAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error in DELETE /api/admin/badges/assign:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}