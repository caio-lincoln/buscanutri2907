import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-utils'
import { z } from 'zod'

const createBadgeSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  icon_url: z.string().url('URL do ícone deve ser válida')
})

const updateBadgeSchema = z.object({
  id: z.string().uuid('ID deve ser um UUID válido'),
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  icon_url: z.string().url('URL do ícone deve ser válida')
})

// GET - Buscar todas as badges
export async function GET() {
  try {
    await requireAdmin()
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) {
      console.error('Error fetching badges:', error)
      return NextResponse.json({ error: 'Erro ao buscar badges' }, { status: 500 })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/admin/badges:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Criar nova badge
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = createAdminClient()
    
    const body = await request.json()
    const { name, description, icon_url } = createBadgeSchema.parse(body)
    
    const { data, error } = await supabase
      .from('badges')
      .insert({ name, description, icon_url })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating badge:', error)
      return NextResponse.json({ error: 'Erro ao criar badge' }, { status: 500 })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error in POST /api/admin/badges:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT - Atualizar badge
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = createAdminClient()
    
    const body = await request.json()
    const { id, name, description, icon_url } = updateBadgeSchema.parse(body)
    
    const { data, error } = await supabase
      .from('badges')
      .update({ name, description, icon_url })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating badge:', error)
      return NextResponse.json({ error: 'Erro ao atualizar badge' }, { status: 500 })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error in PUT /api/admin/badges:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Deletar badge
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = createAdminClient()
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('badges')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting badge:', error)
      return NextResponse.json({ error: 'Erro ao deletar badge' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/badges:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}