'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createSupabaseClient } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createSupabaseClient()
      const origin =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001')
      const redirectTo = new URL('/redefinir-senha', origin).toString()

      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      if (error) throw error

      toast({
        title: 'Se o e-mail existir, enviaremos o link.',
        description: 'Verifique sua caixa de entrada e spam.',
      })
      router.push('/login')
    } catch {
      toast({
        title: 'Se o e-mail existir, enviaremos o link.',
        description: 'Verifique sua caixa de entrada e spam.',
      })
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F2E6D8] to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Esqueci minha senha</CardTitle>
          <CardDescription>Informe seu e-mail para receber o link de recuperação</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white" disabled={loading}>
              {loading ? 'Enviando…' : 'Enviar link'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
