import { listMyDocs, signDocUrls, deleteMyDoc, type NutritionistDoc } from '@/lib/nutritionist-documents-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, Trash2, FileText } from 'lucide-react'
import { useState } from 'react'
import { toast } from './ui/use-toast'

export default function DocumentsCard() {
  const [ documents, setDocuments ] = useState<NutritionistDoc[]>([])
  const [ documentUrls, setDocumentUrls ] = useState<Record<string, string | null>>({})
  const [ loadingDocs, setLoadingDocs ] = useState(false)

  const loadDocuments = async () => {
    if (!safeFormData.nutritionist_profile?.id) return

    setLoadingDocs(true)
    try {
      const docs = await listMyDocs(safeFormData.nutritionist_profile.id)
      setDocuments(docs)

      if (docs.length > 0) {
        const urls = await signDocUrls(docs.map(d => d.file_name))
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
    const url = documentUrls[ doc.file_name ]
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

    if (documents.length === 0) {
      return (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum documento encontrado</h3>
          <p className="text-sm text-gray-600">Você ainda não possui documentos cadastrados.</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
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
                      disabled={!documentUrls[ doc.file_name ]}
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
      </div>
    )
  }

  return renderDocumentsTab()

}

