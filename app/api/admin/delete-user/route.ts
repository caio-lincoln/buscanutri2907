import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // 1. Verificar permissão de admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: requester }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !requester) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar role
    let isAdmin = false
    if (requester.user_metadata?.role === 'admin' || requester.app_metadata?.role === 'admin') {
        isAdmin = true
    } else {
        const { data: requesterData } = await supabaseAdmin
        .from('users')
        .select('role, user_type')
        .eq('id', requester.id)
        .single()
        
        if (requesterData?.role === 'admin' || requesterData?.user_type === 'admin') {
            isAdmin = true
        }
    }

    if (!isAdmin) {
       return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const timestamp = new Date().toISOString()

    // 2. Soft Delete por User ID
    // Executando updates independentes para garantir que falha em um não pare os outros (embora promise.all fosse melhor, sequencial é mais seguro para depurar)
    
    await supabaseAdmin.from('users').update({ is_deleted: true, deleted_at: timestamp }).eq('id', userId)
    await supabaseAdmin.from('nutritionist_profiles').update({ is_deleted: true, deleted_at: timestamp }).eq('user_id', userId)
    await supabaseAdmin.from('patient_profiles').update({ is_deleted: true, deleted_at: timestamp }).eq('user_id', userId)
    await supabaseAdmin.from('user_subscriptions').update({ is_deleted: true, deleted_at: timestamp }).eq('user_id', userId)
    
    // Tabelas onde user_id pode estar sob outro nome
    await supabaseAdmin.from('anamnese_nutricional').update({ is_deleted: true, deleted_at: timestamp }).eq('patient_id', userId)
    await supabaseAdmin.from('payments').update({ is_deleted: true, deleted_at: timestamp }).eq('patient_id', userId)
    await supabaseAdmin.from('payments').update({ is_deleted: true, deleted_at: timestamp }).eq('nutritionist_id', userId)
    
    // Mensagens
    await supabaseAdmin.from('chat_messages').update({ is_deleted: true, deleted_at: timestamp }).eq('sender_id', userId)
    await supabaseAdmin.from('consultation_messages').update({ is_deleted: true, deleted_at: timestamp }).eq('sender_id', userId)

    // 3. Soft Delete por Profile IDs
    const { data: patProfile } = await supabaseAdmin.from('patient_profiles').select('id').eq('user_id', userId).single()
    if (patProfile) {
        await supabaseAdmin.from('appointments').update({ is_deleted: true, deleted_at: timestamp }).eq('patient_id', patProfile.id)
        await supabaseAdmin.from('consultations').update({ is_deleted: true, deleted_at: timestamp }).eq('patient_id', patProfile.id)
        await supabaseAdmin.from('consultation_reviews').update({ is_deleted: true, deleted_at: timestamp }).eq('patient_id', patProfile.id)
        await supabaseAdmin.from('chat_conversations').update({ is_deleted: true, deleted_at: timestamp }).eq('patient_id', patProfile.id)
    }
    
    const { data: nutProfile } = await supabaseAdmin.from('nutritionist_profiles').select('id').eq('user_id', userId).single()
    if (nutProfile) {
        await supabaseAdmin.from('appointments').update({ is_deleted: true, deleted_at: timestamp }).eq('nutritionist_id', nutProfile.id)
        await supabaseAdmin.from('consultations').update({ is_deleted: true, deleted_at: timestamp }).eq('nutritionist_id', nutProfile.id)
        await supabaseAdmin.from('posts').update({ is_deleted: true, deleted_at: timestamp }).eq('nutritionist_id', nutProfile.id)
        await supabaseAdmin.from('consultation_reviews').update({ is_deleted: true, deleted_at: timestamp }).eq('nutritionist_id', nutProfile.id)
        await supabaseAdmin.from('chat_conversations').update({ is_deleted: true, deleted_at: timestamp }).eq('nutritionist_id', nutProfile.id)
    }

    // 4. Deletar do Auth
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
    if (deleteAuthError) {
        console.error('Failed to delete from Auth:', deleteAuthError)
        // Não lançamos erro aqui para garantir que o log seja escrito e o soft delete persista
    }

    // 5. Log de Auditoria
    await supabaseAdmin.from('deletion_logs').insert({
        deleted_user_id: userId,
        deleted_by: requester.id,
        deleted_at: timestamp,
        metadata: { 
            status: 'success', 
            details: 'Full soft delete + Auth delete',
            auth_deleted: !deleteAuthError,
            error: deleteAuthError ? deleteAuthError.message : null
        }
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
