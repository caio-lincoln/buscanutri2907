"use client"

import { useEffect, useState } from "react"
import { getCurrentUser } from "@/lib/auth"
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestNotificationsPage() {
  const [user, setUser] = useState<any>(null)
  const [userLoading, setUserLoading] = useState(true)
  const { notifications, unreadCount, loading } = useRealtimeNotifications()

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        console.log("Usuário carregado:", currentUser)
        setUser(currentUser)
      } catch (error) {
        console.error("Erro ao carregar usuário:", error)
      } finally {
        setUserLoading(false)
      }
    }

    loadUser()
  }, [])

  const loginTestUser = async () => {
    // Simular login do usuário de teste
    if (typeof window !== "undefined") {
      localStorage.setItem("test_user_session", "2d424c6f-ff36-41d5-b65f-62b284d1ceb4")
      window.location.reload()
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Teste de Notificações</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Status do Usuário</CardTitle>
        </CardHeader>
        <CardContent>
          {userLoading ? (
            <p>Carregando usuário...</p>
          ) : user ? (
            <div>
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Tipo:</strong> {user.user_type}</p>
            </div>
          ) : (
            <div>
              <p>Nenhum usuário logado</p>
              <Button onClick={loginTestUser} className="mt-2">
                Login como Usuário de Teste
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status das Notificações</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Carregando notificações...</p>
          ) : (
            <div>
              <p><strong>Total de notificações:</strong> {notifications.length}</p>
              <p><strong>Não lidas:</strong> {unreadCount}</p>
              
              {notifications.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Últimas notificações:</h3>
                  {notifications.slice(0, 3).map((notification) => (
                    <div key={notification.id} className="border p-2 mb-2 rounded">
                      <p><strong>{notification.title}</strong></p>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                      <p className="text-xs text-gray-500">
                        Tipo: {notification.originalType} | 
                        Status: {notification.read ? "Lida" : "Não lida"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
