import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-utils'
import { requireProductionAuth, logProductionOperation, ProductionAuthorizationError } from '@/lib/production-auth'
import { z } from 'zod'

const createSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  duration_hours: z.number().min(0).optional(),
  thumbnail_url: z.string().url().optional(),
  redirect_url: z.string().url().optional(),
  is_published: z.boolean().optional(),
  category: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional().default('draft'),
  instructor_name: z.string().optional(),
  instructor_bio: z.string().optional(),
  level: z.string().optional(),
  certificate_available: z.boolean().optional(),
})

// GET - listar cursos
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = createAdminClient()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as 'draft' | 'published' | 'archived' | null

    let query = supabase.from('courses').select('*').order('created_at', { ascending: false })
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar cursos' }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/admin/courses:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - criar curso
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()
    const supabase = createAdminClient()

    const body = await request.json()
    requireProductionAuth(request, body, 'criação de curso')

    const parsed = createSchema.parse(body)

    const { data, error } = await supabase
      .from('courses')
      .insert({
        title: parsed.title,
        description: parsed.description ?? null,
        price: parsed.price ?? null,
        duration_hours: parsed.duration_hours ?? null,
        thumbnail_url: parsed.thumbnail_url ?? null,
        redirect_url: parsed.redirect_url ?? null,
        is_published: parsed.is_published ?? false,
        category: parsed.category ?? null,
        status: parsed.status ?? 'draft',
        instructor_name: parsed.instructor_name ?? null,
        instructor_bio: parsed.instructor_bio ?? null,
        level: parsed.level ?? null,
        certificate_available: parsed.certificate_available ?? false,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating course:', error)
      return NextResponse.json({ error: 'Erro ao criar curso' }, { status: 500 })
    }

    logProductionOperation('CREATE_COURSE', data.id, user.id)
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    if (error instanceof ProductionAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error in POST /api/admin/courses:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
