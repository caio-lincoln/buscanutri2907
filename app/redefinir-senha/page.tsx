'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleRecoveryRedirect = async () => {
      const supabase = createSupabaseClient()

      try {
        // Tentar estabelecer sessão a partir dos tokens na URL (hash) ou código (query)
        const currentUrl = new URL(window.location.href)
        const hashParams = new URLSearchParams(currentUrl.hash.replace('#', ''))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const code = currentUrl.searchParams.get('code')

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          // Limpar tokens da URL
          router.replace('/redefinir-senha')
        } else if (code) {
          // Fluxo PKCE: troca código por sessão, se aplicável
          await supabase.auth.exchangeCodeForSession(code)
          router.replace('/redefinir-senha')
        }
      } catch (e) {
        // Ignorar falhas de troca de sessão; trataremos abaixo
      }

      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        toast({
          title: 'Link inválido ou expirado',
          description: 'Por favor, solicite um novo link de recuperação.',
          variant: 'destructive',
        })
        router.push('/esqueci-senha')
        return
      }

      setIsAuthenticated(true)
    }

    handleRecoveryRedirect()
  }, [])

  useEffect(() => {
    const supabase = createSupabaseClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsAuthenticated(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const validatePassword = () => {
    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres')
      return false
    }
    if (!/[A-Z]/.test(password)) {
      setError('A senha deve conter pelo menos uma letra maiúscula')
      return false
    }
    if (!/[a-z]/.test(password)) {
      setError('A senha deve conter pelo menos uma letra minúscula')
      return false
    }
    if (!/[0-9]/.test(password)) {
      setError('A senha deve conter pelo menos um número')
      return false
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return false
    }
    setError('')
    return true
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validatePassword()) return
    
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || 'Erro ao redefinir senha')
      }
      
      toast({
        title: 'Senha redefinida com sucesso',
        description: 'Você já pode fazer login com sua nova senha.',
      })
      
      router.push('/login')
    } catch (err) {
      toast({
        title: 'Erro ao redefinir senha',
        description: err instanceof Error ? err.message : 'Tente novamente mais tarde',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F2E6D8] to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle>Verificando...</CardTitle>
            <CardDescription>Aguarde enquanto verificamos seu link de recuperação</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F2E6D8] to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Redefinir senha</CardTitle>
          <CardDescription>Crie uma nova senha para sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 p-3 rounded-md flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                A senha deve ter no mínimo 8 caracteres, incluindo uma letra maiúscula, uma minúscula e um número.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar senha</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <Button type="submit" className="w-full bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white" disabled={loading}>
              {loading ? 'Redefinindo...' : 'Redefinir senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
