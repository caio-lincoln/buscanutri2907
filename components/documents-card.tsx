import { listMyDocs, signDocUrls, deleteMyDoc, type NutritionistDoc } from '@/lib/nutritionist-documents-service'
import { createSupabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, Trash2, FileText } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from './ui/use-toast'

type Props = {
  profileId?: string
  debug?: boolean
}

export default function DocumentsCard({ profileId, debug = false }: Props) {
  const [ documents, setDocuments ] = useState<NutritionistDoc[]>([])
  const [ documentUrls, setDocumentUrls ] = useState<Record<string, string | null>>({})
  const [ loadingDocs, setLoadingDocs ] = useState(false)
  const [ uploading, setUploading ] = useState(false)
  const [ certTitle, setCertTitle ] = useState('')
  const fileInputRef = useRef<HTMLInputElement|null>(null)
  const supabase = createSupabaseClient()

  const loadDocuments = async () => {
    setLoadingDocs(true)
    try {
      // Se temos profileId em modo debug, sempre carregar documentos desse perfil via rota debug
      const { data: { user } } = await supabase.auth.getUser()
      let docs: NutritionistDoc[] = []
      let usedDebugFallback = false
      if (debug && profileId) {
        const res = await fetch(`/api/debug/nutritionist/documents/list?userId=${profileId}`)
        const j = await res.json()
        docs = j?.documents ?? []
        usedDebugFallback = true
      } else if (user?.id) {
        // Caso contrário, usar documentos do usuário autenticado
        docs = await listMyDocs(user.id)
      }
      setDocuments(docs)

      if (docs.length > 0) {
        let urls: Record<string,string|null> = {}
        // Usa rota debug para URLs assinadas quando estamos em modo debug
        // ou quando usamos o fallback de debug
        if ((debug && profileId) || usedDebugFallback) {
          const res = await fetch('/api/debug/nutritionist/documents/signed-urls', {
            method: 'POST',
            headers: { 'Content-Type':'application/json' },
            body: JSON.stringify({ bucket: 'nutritionist-documents', paths: docs.map(d => d.storage_path), expiresIn: 300 })
          })
          const j = await res.json()
          urls = j?.results ?? {}
        } else {
          urls = await signDocUrls(docs.map(d => d.storage_path))
        }
        setDocumentUrls(urls)
      }
    } catch (error) {
      console.error('Erro ao carregar documentos:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os documentos.",
        variant: "destructive"
      })
    } finally {
      setLoadingDocs(false)
    }
  }

  // Função para excluir documento
  const handleDeleteDocument = async (doc: NutritionistDoc) => {
    if (!confirm(`Tem certeza que deseja excluir o documento "${doc.title || doc.file_name}"?`)) {
      return
    }

    try {
      await deleteMyDoc(doc.id)
      toast({
        title: "Sucesso",
        description: "Documento excluído com sucesso."
      })
      await loadDocuments() // Recarregar lista
    } catch (error) {
      console.error('Erro ao excluir documento:', error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o documento.",
        variant: "destructive"
      })
    }
  }

  // Função para abrir documento
  const handleOpenDocument = (doc: NutritionistDoc) => {
    const url = documentUrls[ doc.storage_path ]
    if (url) {
      window.open(url, '_blank')
    } else {
      toast({
        title: "Erro",
        description: "URL do documento não disponível.",
        variant: "destructive"
      })
    }
  }

  // const tabs = [
  //   { id: 'personal', label: 'Dados Pessoais' },
  //   { id: 'address', label: 'Endereço' },
  //   ...(user?.user_type === 'nutricionista' ? [
  //     { id: 'professional', label: 'Dados Profissionais' },
  //     { id: 'specialties', label: 'Especialidades' },
  //     { id: 'availability', label: 'Disponibilidade' },
  //     { id: 'corporate', label: 'Planos Corporativos' },
  //     { id: 'addresses', label: 'Endereços de Atendimento' },
  //     { id: 'documents', label: 'Documentos' }
  //   ] : []),
  //   ...(user?.user_type === 'paciente' ? [
  //     { id: 'anamnese', label: 'Anamnese Nutricional' }
  //   ] : [])
  // ]

  const renderDocumentsTab = () => {
    if (loadingDocs) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Carregando documentos...</p>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Lista de documentos */}
        {documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {doc.title || doc.file_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="text-xs text-gray-600">
                      <p><strong>Tipo:</strong> {doc.document_type}</p>
                      <p><strong>Criado em:</strong> {new Date(doc.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDocument(doc)}
                        disabled={!documentUrls[ doc.storage_path ]}
                        className="flex-1"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Abrir
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteDocument(doc)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 space-y-2">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <h3 className="text-lg font-medium text-gray-900">Nenhum documento encontrado</h3>
            <p className="text-sm text-gray-600">Você ainda não possui documentos cadastrados.</p>
          </div>
        )}

        {/* Upload de documento */}
        <div className="max-w-md mx-auto text-left border rounded-md p-4">
          <p className="text-sm font-medium mb-2">Enviar documento (PDF, JPG, PNG, até 5MB)</p>
          <input ref={fileInputRef} type="file" accept=".pdf,image/jpeg,image/jpg,image/png" className="block w-full text-sm" />
          <div className="mt-3">
            <label className="block text-xs text-gray-600 mb-1">Título (apenas para certificado)</label>
            <input value={certTitle} onChange={e=>setCertTitle(e.target.value)} placeholder="Ex.: Pós-graduação em Nutrição" className="w-full border rounded px-2 py-1 text-sm" />
          </div>
          <div className="flex gap-2 mt-4">
            <Button disabled={uploading} onClick={() => handleUpload('crn_proof')} variant="outline" className="flex-1">Enviar Comprovante CRN</Button>
            <Button disabled={uploading || !certTitle.trim()} onClick={() => handleUpload('certificate')} className="flex-1">Enviar Certificado</Button>
          </div>
          {uploading && <p className="text-xs text-gray-500 mt-2">Enviando arquivo...</p>}
        </div>
      </div>
    )
  }

  useEffect(() => {
    loadDocuments()
  }, [profileId, debug])

  const handleUpload = async (documentType: 'crn_proof' | 'certificate') => {
    try {
      const file = fileInputRef.current?.files?.[0]
      if (!file) {
        toast({ title: 'Arquivo obrigatório', description: 'Selecione um arquivo para enviar', variant: 'destructive' })
        return
      }
      const allowed = ['application/pdf','image/jpeg','image/jpg','image/png']
      if (!allowed.includes(file.type)) {
        toast({ title: 'Tipo inválido', description: 'Use PDF, JPG ou PNG.', variant: 'destructive' })
        return
      }
      if (file.size > 5*1024*1024) {
        toast({ title: 'Arquivo muito grande', description: 'Máximo 5MB.', variant: 'destructive' })
        return
      }

      setUploading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id || profileId
      const accessToken = session?.access_token

      if (!accessToken || !userId) {
        toast({ title: 'Faça login para enviar', description: 'Entre na sua conta de nutricionista.', variant: 'destructive' })
        setUploading(false)
        return
      }

      const fd = new FormData()
      fd.append('file', file)
      fd.append('userId', userId)
      fd.append('documentType', documentType)
      if (documentType === 'certificate') fd.append('title', certTitle)
      fd.append('accessToken', accessToken)

      const res = await fetch('/api/upload-nutritionist-document', { method: 'POST', body: fd })
      const j = await res.json()
      if (!res.ok) {
        throw new Error(j?.error || 'Falha no upload')
      }

      toast({ title: 'Sucesso', description: j?.message || 'Documento enviado.' })
      setCertTitle('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      // Atualiza a UI imediatamente com o documento retornado
      const newDoc: NutritionistDoc | undefined = j?.document
      if (newDoc) {
        setDocuments(prev => [newDoc, ...prev])
        // Gerar URL assinada apenas para o novo documento
        try {
          const urls = await signDocUrls([newDoc.storage_path])
          setDocumentUrls(prev => ({ ...prev, [newDoc.storage_path]: urls[newDoc.storage_path] || null }))
        } catch (e) {
          // Se falhar, recarrega toda a lista como fallback
          await loadDocuments()
        }
      } else {
        // Fallback: recarrega documentos se a resposta não trouxe o documento
        await loadDocuments()
      }
    } catch (e:any) {
      console.error(e)
      toast({ title: 'Erro no upload', description: e?.message || 'Tente novamente.', variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  return renderDocumentsTab()

}

