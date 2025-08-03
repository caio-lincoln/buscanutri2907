'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { uploadBlogImage } from '@/lib/image-upload'

export default function TestUploadDebug() {
  const [session, setSession] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<string>('')

  useEffect(() => {
    const supabase = createSupabaseClient()
    
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !session) return

    setUploading(true)
    setResult('')

    try {
      console.log('Iniciando upload com:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        sessionUserId: session.user.id,
        sessionEmail: session.user.email
      })

      const uploadResult = await uploadBlogImage(file, session.user.id)
      
      console.log('Resultado do upload:', uploadResult)
      
      if (uploadResult.success) {
        setResult(`✅ Upload realizado com sucesso! URL: ${uploadResult.url}`)
      } else {
        setResult(`❌ Erro no upload: ${uploadResult.error}`)
      }
    } catch (error) {
      console.error('Erro no upload:', error)
      setResult(`❌ Erro inesperado: ${error}`)
    } finally {
      setUploading(false)
    }
  }

  if (!session) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Teste de Upload - Debug</h1>
        <p className="text-red-600">Usuário não autenticado. Faça login primeiro.</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Teste de Upload - Debug</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Informações da Sessão:</h2>
        <p><strong>User ID:</strong> {session.user.id}</p>
        <p><strong>Email:</strong> {session.user.email}</p>
        <p><strong>Token presente:</strong> {session.access_token ? '✅ Sim' : '❌ Não'}</p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Selecionar imagem para upload:
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={uploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {uploading && (
        <div className="mb-4 p-4 bg-blue-100 rounded">
          <p>🔄 Fazendo upload...</p>
        </div>
      )}

      {result && (
        <div className="mb-4 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">Resultado:</h3>
          <p className="whitespace-pre-wrap">{result}</p>
        </div>
      )}
    </div>
  )
}