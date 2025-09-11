import { redirect } from 'next/navigation'
import AdminDashboard from './_client'
import { createClient } from '../../../lib/supabase/server'

export default async function AdminPage() {

  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  console.log("🚀 ~ AdminPage ~ data:", data)
  const user = data?.user ?? null

  // Sem sessão → manda pro login (com next param opcional)
  if (!user) {
    redirect('/login?next=/dashboard/admin')
  }

  // Checa role (ajuste o campo conforme seu JWT/user_metadata)
  const role =
    (user.user_metadata && user.user_metadata.user_type) ||
    (user.app_metadata && (user.app_metadata as any).user_type)

  if (role !== 'admin') {
    // usuário autenticado mas não-admin
    redirect('/')
  }

  // OK: renderiza a UI client
  return <AdminDashboard initialUser={{ id: user.id, email: user.email!, user_metadata: user.user_metadata, app_metadata: user.app_metadata }} />
}
