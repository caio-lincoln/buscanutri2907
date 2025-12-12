import { redirect } from 'next/navigation'
import AdminDashboard from './_client'
import { createClient } from '../../../lib/supabase/server'

export default async function AdminPage() {

  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  // Dev-only bypass to ease local testing of admin UI
  const devBypass = process.env['DEV_ADMIN_BYPASS'] === 'true'

  // Sem sessão → manda pro login (com next param opcional)
  if (!user && !devBypass) {
    redirect('/login?next=/dashboard/admin')
  }

  // Checa role (ajuste o campo conforme seu JWT/user_metadata)
  const role = user
    ? (user.user_metadata && user.user_metadata.user_type) ||
      (user.app_metadata && (user.app_metadata as any).user_type)
    : 'admin'

  if (role !== 'admin') {
    // usuário autenticado mas não-admin
    redirect('/')
  }

  // OK: renderiza a UI client
  const initialUser = user
    ? { id: user.id, email: user.email!, user_metadata: user.user_metadata, app_metadata: user.app_metadata }
    : { id: 'dev-admin', email: 'dev-admin@example.com', user_metadata: { user_type: 'admin' }, app_metadata: { user_type: 'admin' } as any }
  return <AdminDashboard initialUser={initialUser} />
}
