'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, FileText, Image, ExternalLink, CheckCircle, XCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import {
  getNutritionistDocuments,
  approveNutritionist,
  rejectNutritionist,
  type NutritionistDocument
} from '@/lib/admin-data-service'
import { isImageFile, getDocumentTypeLabel } from '@/lib/storage'

interface VerifyNutritionistModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: {
    id: string
    email: string
    name?: string | null
    nutritionistProfileId: string
  }
  onApproved: () => void
}

export function VerifyNutritionistModal({
  open,
  onOpenChange,
  user,
  onApproved
}: VerifyNutritionistModalProps) {
  const [ loadingDocs, setLoadingDocs ] = useState(false)
  const [ docs, setDocs ] = useState<NutritionistDocument[]>([])
  const [ rejecting, setRejecting ] = useState(false)
  const [ reason, setReason ] = useState('')
  const [ processing, setProcessing ] = useState(false)

  useEffect(() => {
    if (open && user.nutritionistProfileId) {
      loadDocuments()
    }
  }, [ open, user.nutritionistProfileId ])

  const loadDocuments = async () => {
    try {
      setLoadingDocs(true)
      const documents = await getNutritionistDocuments(user.nutritionistProfileId)
      setDocs(documents)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os documentos",
        variant: "destructive"
      })
    } finally {
      setLoadingDocs(false)
    }
  }

  const handleApprove = async () => {
    try {
      setProcessing(true)
      const success = await approveNutritionist(user.id, user.nutritionistProfileId)

      if (success) {
        toast({
          title: "Sucesso",
          description: "Nutricionista verificado com sucesso!",
        })
        onApproved()
        onOpenChange(false)
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível aprovar o nutricionista",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao aprovar o nutricionista",
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!reason.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe o motivo da rejeição",
        variant: "destructive"
      })
      return
    }

    try {
      setProcessing(true)
      const success = await rejectNutritionist()

      if (success) {
        toast({
          title: "Informação",
          description: "Rejeição registrada com sucesso",
        })
        setRejecting(false)
        setReason('')
        onOpenChange(false)
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível registrar a rejeição",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao registrar a rejeição",
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
    }
  }

  const openDocument = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#1E1D40]">
            Verificação de Nutricionista
          </DialogTitle>
          <div className="text-sm text-gray-600">
            <p><strong>Nome:</strong> {user.name || 'Não informado'}</p>
            <p><strong>Email:</strong> {user.email}</p>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {loadingDocs ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Carregando documentos...
              </div>
            </div>
          ) : docs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum documento enviado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {docs.map((doc) => (
                <Card
                  key={doc.id}
                  className="group hover:shadow-lg transition-all duration-200 hover:scale-[1.01] bg-white/5 backdrop-blur border-white/10"
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {getDocumentTypeLabel(doc.document_type)}
                        </Badge>
                        {doc.title && (
                          <span className="text-xs text-gray-500 truncate max-w-[120px]">
                            {doc.title}
                          </span>
                        )}
                      </div>

                      {isImageFile(doc.file_name) ? (
                        <div className="relative">
                          <img
                            src={doc.public_url}
                            alt={doc.title || doc.document_type}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              const fallback = target.nextElementSibling as HTMLElement
                              if (fallback) {
                                fallback.classList.remove('hidden')
                              }
                            }}
                          />
                          <div className="hidden w-full h-32 bg-gray-100 rounded-lg items-center justify-center">
                            <Image className="h-8 w-8 text-gray-400" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-8 w-8 text-gray-400" />
                        </div>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => openDocument(doc.public_url)}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Abrir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {rejecting && (
            <div className="space-y-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800">Motivo da Rejeição</h4>
              <Textarea
                placeholder="Descreva o motivo da rejeição..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleReject}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Confirmar Rejeição
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setRejecting(false)
                    setReason('')
                  }}
                  disabled={processing}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>

        {!rejecting && (
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setRejecting(true)}
              disabled={processing}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rejeitar
            </Button>
            <Button
              onClick={handleApprove}
              disabled={processing || docs.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Aprovar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
