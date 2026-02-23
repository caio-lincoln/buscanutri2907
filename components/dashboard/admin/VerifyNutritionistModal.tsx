'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, 
  FileText, 
  Image, 
  ExternalLink, 
  CheckCircle, 
  XCircle,
  ShieldCheck,
  User,
  MapPin,
  Phone,
  GraduationCap
} from 'lucide-react'
import {
  getNutritionistDocuments,
  getNutritionistDetails,
  approveNutritionist,
  rejectNutritionist,
  type NutritionistDocument
} from '@/lib/admin-data-service'
import { validateCRNWithAPI } from '@/lib/crn-validator'
import { isImageFile, getDocumentTypeLabel } from '@/lib/storage'
import { toast } from '../../ui/use-toast'
import { createSupabaseClient } from '@/lib/supabase'

interface VerifyNutritionistModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: {
    id: string
    email: string
    name?: string | null
    type: 'paciente' | 'nutricionista' | 'empresa'
    nutritionistProfileId?: string
  }
  onApproved: () => void
}

export function VerifyNutritionistModal({
  open,
  onOpenChange,
  user,
  onApproved,
}: VerifyNutritionistModalProps) {
  const [loadingData, setLoadingData] = useState(false)
  const [docs, setDocs] = useState<NutritionistDocument[]>([])
  const [details, setDetails] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const [crnValidation, setCrnValidation] = useState<{
    isValid: boolean
    message: string
    region?: string
    number?: string
    checked: boolean
  } | null>(null)
  const [validatingCRN, setValidatingCRN] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Carrega dados quando abrir (para nutricionistas, incluindo documentos)
  useEffect(() => {
    if (open && user?.type === 'nutricionista' && user?.nutritionistProfileId) void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.nutritionistProfileId])

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

  const loadData = async () => {
    try {
      setLoadingData(true)
      if (user.type === 'nutricionista' && user.nutritionistProfileId) {
        const [documents, profileDetails] = await Promise.all([
          getNutritionistDocuments(user.id),
          getNutritionistDetails(user.nutritionistProfileId, user.id)
        ])
        
        setDocs(documents)
        setDetails(profileDetails)
        setCrnValidation(null)
        return
      }

      if (user.type === 'paciente') {
        const sb = createSupabaseClient()
        const supabase = await sb
        const { data: profileData, error } = await supabase
          .from('patient_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!error && profileData) {
          setDetails(profileData)
        } else {
          setDetails(null)
        }
        setDocs([])
        setCrnValidation(null)
        return
      }

      setDocs([])
      setDetails(null)
      setCrnValidation(null)
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do usuário',
        variant: 'destructive'
      })
    } finally {
      setLoadingData(false)
    }
  }

  const handleValidateCRN = async () => {
    if (!details?.crn) {
      toast({ title: 'Erro', description: 'CRN não disponível para validação', variant: 'destructive' })
      return
    }

    try {
      setValidatingCRN(true)
      const result = await validateCRNWithAPI(details.crn)
      setCrnValidation({ ...result, checked: true })
      
      if (result.isValid) {
        toast({ title: 'Sucesso', description: result.message })
      } else {
        toast({ title: 'Atenção', description: result.message, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Erro', description: 'Falha ao validar CRN', variant: 'destructive' })
    } finally {
      setValidatingCRN(false)
    }
  }

  const handleApprove = async () => {
    try {
      setProcessing(true)
      let success = false
      if (user.type === 'nutricionista' && user.nutritionistProfileId) {
        success = await approveNutritionist(user.nutritionistProfileId)
      } else {
        success = true
      }
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
      if (typeof document !== 'undefined' && document.body) {
        document.body.style.overflow = 'auto'
        document.body.style.pointerEvents = 'auto'
      }
    }
  }

  const handleReject = async () => {
    if (!reason.trim()) {
      toast({ title: 'Erro', description: 'Por favor, informe o motivo da rejeição',  })
      return
    }
    try {
      setProcessing(true)
    let success = false
    if (user.type === 'nutricionista' && user.nutritionistProfileId) {
      success = await rejectNutritionist(user.nutritionistProfileId, reason)
    } else {
      success = true
    }
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
      if (typeof document !== 'undefined' && document.body) {
        document.body.style.overflow = 'auto'
        document.body.style.pointerEvents = 'auto'
      }
    }
  }

  const openDocument = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (!open || !mounted) return null

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
            className="w-full max-w-5xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-black/5 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 sticky top-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur z-10 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-[#1E1D40] dark:text-white flex items-center gap-2">
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />
                  {user.type === 'paciente'
                    ? 'Verificação de Paciente'
                    : user.type === 'empresa'
                      ? 'Verificação de Empresa'
                      : 'Verificação de Profissional'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {user.type === 'nutricionista'
                    ? 'Analise os dados e documentos antes de aprovar o cadastro'
                    : 'Visualize e confira os dados cadastrais do usuário'}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <XCircle className="h-6 w-6 text-gray-400 hover:text-gray-600" />
              </Button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {loadingData ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-4" />
                  <p className="text-gray-500">Carregando dados do profissional...</p>
                </div>
              ) : (
                <>
                  {/* Seção de Dados do Profissional */}
                  <div className={`grid grid-cols-1 ${user.type === 'nutricionista' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
                    {/* Coluna Principal - Info Pessoal */}
                    <div className={`${user.type === 'nutricionista' ? 'md:col-span-1' : 'md:col-span-2'} space-y-6`}>
                      <div className="bg-gray-50 dark:bg-neutral-800/50 rounded-xl p-6 border border-gray-100 dark:border-neutral-800">
                        <h3 className="text-lg font-semibold text-[#1E1D40] dark:text-white mb-4 flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Dados Pessoais
                        </h3>
                        
                        <div className="space-y-4">
                          {user.type === 'paciente' ? (
                            <div className="flex items-center gap-4">
                              <Avatar className="h-14 w-14">
                                <AvatarImage src={(details as any)?.avatar_url || (details as any)?.profile_image_url || '/placeholder.svg'} />
                                <AvatarFallback>
                                  {(details as any)?.full_name?.[0]?.toUpperCase() || user.name?.[0]?.toUpperCase() || 'P'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <label className="text-xs font-medium text-gray-500 uppercase">Nome Completo</label>
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                  {(details as any)?.full_name || user.name || 'Não informado'}
                                </p>
                                <p className="text-xs text-gray-500 break-all">{user.email}</p>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <label className="text-xs font-medium text-gray-500 uppercase">Nome Completo</label>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{details?.full_name || user.name || 'Não informado'}</p>
                            </div>
                          )}
                          
                          {user.type !== 'paciente' && (
                            <div>
                              <label className="text-xs font-medium text-gray-500 uppercase">Email</label>
                              <p className="text-gray-900 dark:text-gray-100 break-all">{user.email}</p>
                            </div>
                          )}

                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase">Telefone</label>
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <p className="text-gray-900 dark:text-gray-100">{(details as any)?.phone || 'Não informado'}</p>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase">Localização</label>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <p className="text-gray-900 dark:text-gray-100">{(details as any)?.location || 'Não informado'}</p>
                            </div>
                          </div>

                          {user.type === 'paciente' && (
                            <div>
                              <label className="text-xs font-medium text-gray-500 uppercase">Biografia</label>
                              <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-line">
                                {(details as any)?.bio || 'Não informada'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {user.type === 'nutricionista' && (
                        <div className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl p-6 border border-emerald-100 dark:border-emerald-800/30">
                          <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-400 mb-4 flex items-center gap-2">
                            <GraduationCap className="h-5 w-5" />
                            Registro Profissional
                          </h3>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="text-xs font-medium text-emerald-600/70 uppercase">CRN</label>
                              <div className="flex items-center gap-2">
                                <p className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
                                  {details?.crn || 'Não informado'}
                                </p>
                                {crnValidation?.checked && (
                                  <Badge variant={crnValidation.isValid ? 'default' : 'destructive'} className={crnValidation.isValid ? 'bg-emerald-600' : ''}>
                                    {crnValidation.isValid ? 'Válido' : 'Inválido'}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {details?.crn && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="w-full bg-white dark:bg-neutral-800 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                onClick={handleValidateCRN}
                                disabled={validatingCRN}
                              >
                                {validatingCRN ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                                Verificar CRN no CFN
                              </Button>
                            )}
                            
                            {crnValidation?.checked && (
                              <div className={`text-xs p-3 rounded-lg ${crnValidation.isValid ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                {crnValidation.message}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Coluna Secundária - Documentos e Detalhes */}
                    {user.type === 'nutricionista' && (
                      <div className="md:col-span-2 space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-[#1E1D40] dark:text-white mb-4 flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Documentação Enviada
                          </h3>

                          {docs.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                              <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                              <p className="text-gray-500">Nenhum documento enviado pelo profissional</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {docs.map((doc) => (
                                <Card
                                  key={doc.id}
                                  className="group hover:shadow-md transition-all duration-200 border-gray-200 overflow-hidden"
                                >
                                  <CardContent className="p-0">
                                    <div className="flex h-full">
                                      <div className="w-24 bg-gray-100 flex items-center justify-center border-r border-gray-100">
                                        {isImageFile(doc.file_name) ? (
                                          <img
                                            src={doc.public_url}
                                            alt={doc.title}
                                            className="w-full h-24 object-cover"
                                          />
                                        ) : (
                                          <FileText className="h-8 w-8 text-gray-400" />
                                        )}
                                      </div>
                                      <div className="flex-1 p-3 flex flex-col justify-between">
                                        <div>
                                          <div className="flex justify-between items-start mb-1">
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                                              {getDocumentTypeLabel(doc.document_type)}
                                            </Badge>
                                          </div>
                                          <p className="text-sm font-medium text-gray-900 truncate" title={doc.title || ''}>
                                            {doc.title || 'Sem título'}
                                          </p>
                                          <p className="text-xs text-gray-500 mt-1">
                                            Enviado em {new Date(doc.created_at).toLocaleDateString()}
                                          </p>
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 w-full mt-2 text-xs hover:bg-emerald-50 hover:text-emerald-600 justify-start px-0"
                                          onClick={() => openDocument(doc.public_url)}
                                        >
                                          <ExternalLink className="h-3 w-3 mr-1.5" />
                                          Visualizar Documento
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Info Adicional */}
                        {details && (
                          <div>
                            <h3 className="text-lg font-semibold text-[#1E1D40] dark:text-white mb-4">Informações Adicionais</h3>
                            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-4">
                              <div>
                                <label className="text-xs font-medium text-gray-500 uppercase">Especialidades</label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {(() => {
                                    const specs = Array.isArray(details.specialties) 
                                      ? details.specialties 
                                      : typeof details.specialties === 'string' && details.specialties.startsWith('[') 
                                        ? JSON.parse(details.specialties) 
                                        : details.specialties 
                                          ? [details.specialties] 
                                          : [];
                                    
                                    if (specs.length > 0) {
                                      return specs.map((spec: any, i: number) => (
                                        <Badge key={i} variant="secondary" className="bg-gray-100 text-gray-700">
                                          {typeof spec === 'string' ? spec : spec?.label || JSON.stringify(spec)}
                                        </Badge>
                                      ))
                                    } else {
                                      return <span className="text-sm text-gray-400">Nenhuma especialidade listada</span>
                                    }
                                  })()}
                                </div>
                              </div>
                              
                              {details.academic_background && (
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase">Formação Acadêmica</label>
                                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{details.academic_background}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Área de Rejeição */}
                  {rejecting && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                      <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl">
                        <h4 className="font-semibold text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
                          <XCircle className="h-5 w-5" />
                          Reprovar Cadastro
                        </h4>
                        <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                          Por favor, descreva o motivo da reprovação. O profissional receberá esta mensagem por email.
                        </p>
                        <Textarea
                          placeholder="Ex: Documento ilegível, CRN inválido, falta comprovante de especialidade..."
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          className="min-h-[100px] bg-white border-red-200 focus:border-red-400 focus:ring-red-400"
                        />
                        <div className="flex justify-end gap-3 mt-4">
                           <Button
                            variant="ghost"
                            onClick={() => {
                              setRejecting(false)
                              setReason('')
                            }}
                            disabled={processing}
                            className="text-red-700 hover:text-red-900 hover:bg-red-100"
                          >
                            Cancelar
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={processing}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {processing ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-2" />
                            )}
                            Confirmar Reprovação
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer - Fixed */}
            {!rejecting && user.type === 'nutricionista' && (
              <div className="flex justify-between items-center px-6 py-4 border-t border-black/10 dark:border-white/10 bg-gray-50/50 dark:bg-neutral-900/50 backdrop-blur rounded-b-2xl">
                <div className="text-sm text-gray-500">
                  {docs.length} documento(s) carregado(s)
                </div>
                <div className="flex flex-wrap gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setRejecting(true)}
                    disabled={processing || loadingData}
                    className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                  >
                    Reprovar
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={processing || loadingData}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 shadow-lg shadow-emerald-600/20"
                  >
                    {processing ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Aprovar Verificação
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => onOpenChange(false)}
                    disabled={processing}
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            )}

            {!rejecting && user.type !== 'nutricionista' && (
              <div className="flex justify-end items-center px-6 py-4 border-t border-black/10 dark:border-white/10 bg-gray-50/50 dark:bg-neutral-900/50 backdrop-blur rounded-b-2xl">
                <Button
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  disabled={processing}
                >
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
