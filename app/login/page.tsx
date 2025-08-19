'use client'

import type React from 'react'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { signIn, signInAdmin, getCurrentUser } from '@/lib/auth'
import { toast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { User } from '@supabase/supabase-js'
import { useAuthSync } from '../../hooks/use-auth-sync'

export default function LoginPage() {
  const [ showPassword, setShowPassword ] = useState(false)
  const [ loading, setLoading ] = useState(false)
  const [ error, setError ] = useState('')
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const {broadcastAuthChange} = useAuthSync()

  // Redirect if user is already logged in
  useEffect(() => {
    if (!authLoading && user && user.user_metadata['user_type']) {
      const redirectPath = getRedirectPath(user.user_metadata['user_type'])
      router.replace(redirectPath)
    }
  }, [ user, authLoading, router ])

  const getRedirectPath = (userType: string) => {
    switch (userType) {
      case 'admin':
        return '/dashboard/admin'
      case 'nutricionista':
        return '/dashboard/nutricionistas'
      case 'empresa':
        return '/dashboard/empresa'
      case 'paciente':
        return '/dashboard/paciente'
      default:
        return '/dashboard/paciente'
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const email = formData.get('email') as string
      const password = formData.get('password') as string

      if (!email || !password) {
        throw new Error('Email e senha sao obrigatorios')
      }

      let result
      // Special login for admin
      if (email === 'iris@buscanutri.com') {
        result = await signInAdmin(email, password)
      } else {
        result = await signIn(email, password)
      }

      if (result.error) {
        throw new Error(result.error)
      }
      // Update auth context
      // await refreshUser(result.data.user as User)

      // Wait a bit to ensure context is updated
      // await new Promise(resolve => setTimeout(resolve, 1000))

      // Get updated user data
      // const updatedUser = await getCurrentUser()
      // console.log('🔍 Usuário após login:', updatedUser)

      if (result && result.data?.user) {
        broadcastAuthChange('SIGN_IN')
        const redirectPath = getRedirectPath(result.data?.user?.user_metadata['user_type'])

        toast({
          title: 'Login realizado com sucesso!',
          description: 'Bem-vindo(a) de volta!',
        })

        // Use replace to avoid back button issues
        console.log("redirecionado", redirectPath)
        router.replace(redirectPath)
        return // Exit early to prevent further execution
      } else {
        console.error('❌ Usuário ou tipo de usuário não encontrado após login')
        toast({
          title: 'Erro no redirecionamento',
          description: 'Tente fazer login novamente.',
          variant: 'destructive',
        })
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro desconhecido. Tente novamente.'
      setError(errorMessage)
      toast({
        title: 'Erro no login',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F2E6D8] to-white flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-500 mx-auto"></div>
          <p className="text-[#1E1D40]/70 font-medium">Verificando sessao...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F2E6D8] to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <Image
              src="/logo-busca-nutri.png"
              alt="Busca Nutri"
              width={180}
              height={36}
              unoptimized
              priority
              className="h-8 w-auto mx-auto"
            />
          </Link>
          <h1 className="text-2xl font-bold text-[#1E1D40] mb-2">
            Faca seu login
          </h1>
          <p className="text-[#1E1D40]/70">Acesse sua conta no Busca Nutri</p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center text-[#1E1D40]">
              Login
            </CardTitle>
            <CardDescription className="text-center">
              Entre com suas credenciais
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Sua senha"
                    className="h-11 pr-10"
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
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-[#1E1D40]/70">
                Nao tem uma conta?{' '}
                <Link
                  href="/cadastro"
                  className="text-[#4AB0D9] hover:underline font-medium"
                >
                  Cadastre-se aqui
                </Link>
              </p>
            </div>

            <div className="mt-4 text-center">
              <Link href="#" className="text-sm text-[#4AB0D9] hover:underline">
                Esqueci minha senha
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
