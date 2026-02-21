import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandling, createApiResponse, createErrorResponse } from '@/lib/api-middleware'
import { requireAdmin } from '@/lib/auth-utils'
import { createAdminClient } from '@/lib/supabase/server'

export const DELETE = withErrorHandling(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  // 1. Validation (Admin check)
  // requireAdmin validates the session via cookies usually.
  await requireAdmin()

  const admin = createAdminClient()
  const rawId = (await params).id
  let targetUuid = rawId

  // Resolve numeric ID if necessary
  if (/^\d+$/.test(rawId)) {
    const { data: row } = await admin
      .from('users')
      .select('id')
      .eq('ID', Number(rawId)) // Assuming column "ID" exists and is numeric
      .maybeSingle()
    
    if (!row) {
      return createErrorResponse('Usuário não encontrado', 404)
    }
    targetUuid = row.id
  }

  const timestamp = new Date().toISOString()

  let rowsAffected = 0

  const markSoftDelete = async (table: string, column: string, value: string) => {
    const { error, count } = await admin
      .from(table)
      .update({ is_deleted: true, deleted_at: timestamp })
      .eq(column, value)
      .select('id', { count: 'exact' })

    if (error) {
      throw error
    }

    return count || 0
  }

  try {
    rowsAffected += await markSoftDelete('users', 'id', targetUuid)
    rowsAffected += await markSoftDelete('nutritionist_profiles', 'user_id', targetUuid)
    rowsAffected += await markSoftDelete('patient_profiles', 'user_id', targetUuid)
    rowsAffected += await markSoftDelete('user_subscriptions', 'user_id', targetUuid)

    rowsAffected += await markSoftDelete('anamnese_nutricional', 'patient_id', targetUuid)
    rowsAffected += await markSoftDelete('payments', 'patient_id', targetUuid)
    rowsAffected += await markSoftDelete('payments', 'nutritionist_id', targetUuid)

    rowsAffected += await markSoftDelete('chat_messages', 'sender_id', targetUuid)
    rowsAffected += await markSoftDelete('consultation_messages', 'sender_id', targetUuid)

    const { data: patProfile } = await admin.from('patient_profiles').select('id').eq('user_id', targetUuid).single()
    if (patProfile) {
      rowsAffected += await markSoftDelete('appointments', 'patient_id', patProfile.id)
      rowsAffected += await markSoftDelete('consultations', 'patient_id', patProfile.id)
      rowsAffected += await markSoftDelete('consultation_reviews', 'patient_id', patProfile.id)
      rowsAffected += await markSoftDelete('chat_conversations', 'patient_id', patProfile.id)
    }

    const { data: nutProfile } = await admin.from('nutritionist_profiles').select('id').eq('user_id', targetUuid).single()
    if (nutProfile) {
      rowsAffected += await markSoftDelete('appointments', 'nutritionist_id', nutProfile.id)
      rowsAffected += await markSoftDelete('consultations', 'nutritionist_id', nutProfile.id)
      rowsAffected += await markSoftDelete('posts', 'nutritionist_id', nutProfile.id)
      rowsAffected += await markSoftDelete('consultation_reviews', 'nutritionist_id', nutProfile.id)
      rowsAffected += await markSoftDelete('chat_conversations', 'nutritionist_id', nutProfile.id)
    }
  } catch (e: any) {
    console.error('[SOFT DELETE ERROR]', e)
    return createApiResponse(
      {
        ok: false,
        edited: false,
        rowsAffected,
        success: false,
        db: 'error',
        details: { db: e.message },
      },
      500
    )
  }

  // 3. Auth Delete
  try {
    const { error } = await admin.auth.admin.deleteUser(targetUuid)
    if (error) {
        // If user not found, it means it's already deleted from Auth, which is fine for our goal.
        if (error.code === 'user_not_found' || error.message?.includes('User not found') || error.status === 404) {
             console.log('[AUTH DELETE INFO] User already deleted from Auth. Continuing...')
        } else {
            console.error('[AUTH DELETE ERROR]', error)
            // Soft delete succeeded, but auth delete failed.
            // We return error 500 but with details that DB is cleaned.
            return createApiResponse(
              {
                ok: false,
                edited: rowsAffected > 0,
                rowsAffected,
                success: false,
                auth: 'error',
                db: 'deleted',
                details: { auth: error.message, db: 'Soft deleted successfully' },
              },
              500
            )
        }
    }
  } catch (e: any) {
    // If user not found, it means it's already deleted from Auth.
    // Check various properties where the error code might be
    const isUserNotFound = 
        e.code === 'user_not_found' || 
        e.message?.includes('User not found') || 
        e.status === 404 ||
        e.code === 404 ||
        (e.error && e.error.code === 'user_not_found');

    if (isUserNotFound) {
        console.log('[AUTH DELETE INFO] User already deleted from Auth (exception). Continuing...')
    } else {
        console.error('[AUTH DELETE EXCEPTION]', e)
        return createApiResponse(
          {
            ok: false,
            edited: rowsAffected > 0,
            rowsAffected,
            success: false,
            auth: 'error',
            db: 'deleted',
            details: { auth: e.message },
          },
          500
        )
    }
  }

  // 4. Audit Log
  let deletedBy = null
  try {
      // Try to get user from Authorization header if present, or assume cookie session user from requireAdmin
      const authHeader = req.headers.get('Authorization')
      if (authHeader) {
         const token = authHeader.replace('Bearer ', '')
         const { data: { user } } = await admin.auth.getUser(token)
         deletedBy = user?.id
      } else {
         // Fallback: try to get user from Supabase auth helper (cookies)
         // We reuse the admin client which is service role, so it won't have session.
         // We would need a client with cookies.
         // But requireAdmin() already validated it.
         // For now, we leave deleted_by null if not found in header.
      }
  } catch (e) {
      console.warn('Failed to resolve deleted_by user', e)
  }

  await admin.from('deletion_logs').insert({
    deleted_user_id: targetUuid,
    deleted_by: deletedBy,
    deleted_at: timestamp,
    metadata: { 
        source: 'api_route_legacy',
        original_id: rawId,
        status: 'success'
    }
  })

  return createApiResponse({
    ok: true,
    edited: rowsAffected > 0,
    rowsAffected,
    success: true,
    auth: 'deleted',
    db: 'deleted',
    details: { message: 'User soft deleted and auth removed' },
  })
})
