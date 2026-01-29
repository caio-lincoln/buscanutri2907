import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-utils'
import { requireProductionAuth, logProductionOperation, ProductionAuthorizationError } from '@/lib/production-auth'
import { z } from 'zod'

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  duration_hours: z.number().min(0).optional(),
  thumbnail_url: z.string().url().optional(),
  redirect_url: z.string().url().optional(),
  is_published: z.boolean().optional(),
  category: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  instructor_name: z.string().optional(),
  instructor_bio: z.string().optional(),
  level: z.string().optional(),
  certificate_available: z.boolean().optional(),
})

// PATCH - atualizar curso
export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const user = await requireAdmin()
    const supabase = createAdminClient()

    const body = await request.json()
    requireProductionAuth(request, body, 'atualização de curso')

    const parsed = updateSchema.parse(body)

    const updates: Record<string, any> = {}
    for (const [key, value] of Object.entries(parsed)) {
      updates[key] = value ?? null
    }

    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', params.id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating course:', error)
      return NextResponse.json({ error: 'Erro ao atualizar curso' }, { status: 500 })
    }

    logProductionOperation('UPDATE_COURSE', params.id, user.id)
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    if (error instanceof ProductionAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error in PATCH /api/admin/courses/[id]:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - excluir curso
export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const user = await requireAdmin()
    const supabase = createAdminClient()

    const body = await request.json().catch(() => ({}))
    requireProductionAuth(request, body, 'exclusão de curso')

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting course:', error)
      return NextResponse.json({ error: 'Erro ao excluir curso' }, { status: 500 })
    }

    logProductionOperation('DELETE_COURSE', params.id, user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof ProductionAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error in DELETE /api/admin/courses/[id]:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
