"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'

export function SupabaseTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const testConnection = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)
    setDebugInfo(null)

    try {
      // Mostrar informações de debug
      setDebugInfo({
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0
      })

      // Teste simples de conexão
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, views')
        .limit(3)

      if (error) {
        setError(`Supabase Error: ${error.message} (Code: ${error.code})`)
      } else {
        setResult(data)
      }
    } catch (err: any) {
      setError(`Network Error: ${err.message || 'Erro desconhecido'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testBlogViews = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      // Teste da tabela blog_post_views
      const { data, error } = await supabase
        .from('blog_post_views')
        .select('*')
        .limit(5)

      if (error) {
        setError(error.message)
      } else {
        setResult(data)
      }
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Teste Supabase</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button 
            onClick={testConnection}
            disabled={isLoading}
            className="w-full"
            size="sm"
          >
            {isLoading ? 'Testando...' : 'Testar Blog Posts'}
          </Button>
          
          <Button 
            onClick={testBlogViews}
            disabled={isLoading}
            variant="outline"
            className="w-full"
            size="sm"
          >
            {isLoading ? 'Testando...' : 'Testar Blog Views'}
          </Button>
        </div>

        {debugInfo && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <Badge variant="secondary" className="mb-2">Debug Info</Badge>
            <pre className="text-xs text-blue-800 overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 rounded-lg">
            <Badge variant="destructive" className="mb-2">Erro</Badge>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {result && (
          <div className="p-3 bg-green-50 rounded-lg">
            <Badge variant="default" className="mb-2">Sucesso</Badge>
            <pre className="text-xs text-green-800 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}