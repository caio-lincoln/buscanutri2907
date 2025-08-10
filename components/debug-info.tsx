'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function DebugInfo() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkSupabaseConnection = async () => {
    setLoading(true)
    try {
      // Testar conexão
      const { data: authData } = await supabase.auth.getUser()

      // Testar tabelas
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('count')
        .limit(1)

      const { data: nutritionistData, error: nutritionistError } =
        await supabase.from('nutritionist_profiles').select('count').limit(1)

      const { data: patientData, error: patientError } = await supabase
        .from('patient_profiles')
        .select('count')
        .limit(1)

      const { data: companyData, error: companyError } = await supabase
        .from('company_profiles')
        .select('count')
        .limit(1)

      setDebugInfo({
        auth: {
          user: authData.user,
          connected: true,
        },
        tables: {
          users: { accessible: !usersError, error: usersError?.message },
          nutritionist_profiles: {
            accessible: !nutritionistError,
            error: nutritionistError?.message,
          },
          patient_profiles: {
            accessible: !patientError,
            error: patientError?.message,
          },
          company_profiles: {
            accessible: !companyError,
            error: companyError?.message,
          },
        },
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      setDebugInfo({
        error: error.message,
        timestamp: new Date().toISOString(),
      })
    }
    setLoading(false)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>🔧 Debug do Supabase</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={checkSupabaseConnection} disabled={loading}>
          {loading ? 'Verificando...' : 'Verificar Conexão'}
        </Button>

        {debugInfo && (
          <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}
