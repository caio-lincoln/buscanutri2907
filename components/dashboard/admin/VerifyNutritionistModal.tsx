'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, FileText, Image, ExternalLink, CheckCircle, XCircle } from 'lucide-react'
import {
  getNutritionistDocuments,
  approveNutritionist,
  rejectNutritionist,
  type NutritionistDocument
} from '@/lib/admin-data-service'
import { isImageFile, getDocumentTypeLabel } from '@/lib/storage'
import { toast } from '../../ui/use-toast'

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
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [docs, setDocs] = useState<NutritionistDocument[]>([])
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [processing, setProcessing] = useState(false)

  // Carrega docs quando abrir
  useEffect(() => {
    if (open && user?.id) void loadDocuments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.id])

  // Bloqueia scroll e adiciona ESC para fechar
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onOpenChange])

  const loadDocuments = async () => {
    try {
      setLoadingDocs(true)
      const documents = await getNutritionistDocuments(user.nutritionistProfileId)
      setDocs(documents)
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os documentos',
        variant: 'destructive'
      })
    } finally {
      setLoadingDocs(false)
    }
  }

  const handleApprove = async () => {
    try {
      setProcessing(true)
      const success = await approveNutritionist(user.nutritionistProfileId)
      if (success) {
        toast({ title: 'Sucesso', description: 'Nutricionista verificado com sucesso!' })
        onApproved()
        onOpenChange(false)
      } else {
        toast({ title: 'Erro', description: 'Não foi possível aprovar o nutricionista', variant: 'destructive' })
      }
    } catch {
      toast({ type: '', description: 'Ocorreu um erro ao aprovar o nutricionista', variant: 'destructive' })
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!reason.trim()) {
      toast({ title: 'Erro', description: 'Por favor, informe o motivo da rejeição',  })
      return
    }
    try {
      setProcessing(true)
    const success = await rejectNutritionist(user.nutritionistProfileId, reason)
      if (success) {
        toast({ title: 'Informação', description: 'Rejeição registrada com sucesso' })
        setRejecting(false)
        setReason('')
        onOpenChange(false)
      } else {
        toast({ title: 'Erro', description: 'Não foi possível registrar a rejeição', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Erro', description: 'Ocorreu um erro ao registrar a rejeição', variant: 'destructive' })
    } finally {
      setProcessing(false)
    }
  }

  const openDocument = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[70] pointer-events-none">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      {/* Container do conteúdo */}
      <div className="pointer-events-auto fixed inset-0 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Verificação de Nutricionista"
            className="w-full max-w-4xl bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-black/5"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 sticky top-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur">
              <h2 className="text-xl font-semibold text-[#1E1D40] dark:text-white">
                Verificação de Nutricionista
              </h2>
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                <p><strong>Nome:</strong> {user.name || 'Não informado'}</p>
                <p><strong>Email:</strong> {user.email}</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
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
                                  if (fallback) fallback.classList.remove('hidden')
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
                <div className="space-y-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <h4 className="font-medium text-red-800 dark:text-red-300">Motivo da Rejeição</h4>
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

            {/* Footer */}
            {!rejecting && (
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-black/10 dark:border-white/10">
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
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Fechar
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
