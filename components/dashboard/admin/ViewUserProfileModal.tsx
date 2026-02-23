'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, FileText, Image, ExternalLink } from 'lucide-react'
import type { NutritionistProfile, PatientProfile, CompanyProfile } from '@/lib/supabase'
import { getNutritionistDocuments, type NutritionistDocument } from '@/lib/admin-data-service'
import { createSupabaseClient } from '@/lib/supabase'
import { isImageFile, getDocumentTypeLabel } from '@/lib/storage'

type UserType = 'paciente' | 'nutricionista' | 'empresa' | 'admin'

export type ViewUserProfileData = {
  id: string
  name?: string | null
  email: string
  type: UserType
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: ViewUserProfileData | null
}

export default function ViewUserProfileModal({ open, onOpenChange, user }: Props) {
  const [ loading, setLoading ] = useState(false)
  const [ error, setError ] = useState<string | null>(null)
  const [ profile, setProfile ] = useState<NutritionistProfile | PatientProfile | CompanyProfile | null>(null)
  const [ loadingDocs, setLoadingDocs ] = useState(false)
  const [ docs, setDocs ] = useState<NutritionistDocument[]>([])

  useEffect(() => {
    if (!open) {
      document.body.classList.remove('overflow-hidden', 'modal-open')
      document.body.style.pointerEvents = 'auto'
      document.body.style.overflow = 'auto'
      setTimeout(() => {
        document.body.classList.remove('overflow-hidden', 'modal-open')
        document.body.style.pointerEvents = 'auto'
        document.body.style.overflow = 'auto'
      }, 100)
    }
  }, [open])

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id || !user?.type) return
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set('type', user.type)
        const res = await fetch(`/api/admin/users/${user.id}/profile?${params.toString()}`, { cache: 'no-store' })
        if (!res.ok) {
          const text = await res.text().catch(() => '')
          throw new Error(text || 'Falha ao carregar perfil')
        }
        const { data } = await res.json()
        const apiProfile = (data?.profile ?? null) as any
        if (apiProfile) {
          setProfile(apiProfile)
        } else {
          const sb = createSupabaseClient()
          if (user.type === 'nutricionista') {
            let { data: p } = await (await sb).from('nutritionist_profiles').select('*').eq('user_id', user.id).maybeSingle()
            if (!p) {
              const alt = await (await sb).from('nutritionist_profiles').select('*').eq('id', user.id).maybeSingle()
              p = alt.data || null
            }
            setProfile((p ?? null) as any)
          } else if (user.type === 'paciente') {
            const { data: p } = await (await sb).from('patient_profiles').select('*').eq('user_id', user.id).maybeSingle()
            setProfile((p ?? null) as any)
          } else if (user.type === 'empresa') {
            const { data: p } = await (await sb).from('company_profiles').select('*').eq('user_id', user.id).maybeSingle()
            setProfile((p ?? null) as any)
          } else {
            setProfile(null)
          }
        }
      } catch (err: any) {
        setError(err?.message || 'Falha ao carregar perfil')
      } finally {
        setLoading(false)
      }
    }
    if (open) {
      loadProfile()
    }
  }, [ open, user?.id, user?.type ])

  useEffect(() => {
    const loadDocuments = async () => {
      if (!user?.id || user?.type !== 'nutricionista') return
      try {
        setLoadingDocs(true)
        const documents = await getNutritionistDocuments(user.id)
        setDocs(documents)
      } catch {
        // manter silencioso no modal de visualização
      } finally {
        setLoadingDocs(false)
      }
    }
    if (open) {
      void loadDocuments()
    }
  }, [ open, user?.id, user?.type ])

  const openDocument = (url: string) => {
    if (!url) return
    try {
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {}
  }

  const renderNutritionist = (p: any) => {
    const rawStatus = (p?.verification_status as string | undefined) || ''
    const normalized = rawStatus.toLowerCase()
    let verificationLabel = 'Pendente'
    let verificationVariant: 'default' | 'outline' | 'secondary' | 'destructive' = 'outline'
    if (normalized === 'aprovado' || normalized === 'verificado') {
      verificationLabel = 'Verificado'
      verificationVariant = 'default'
    } else if (normalized === 'reprovado' || normalized === 'rejected') {
      verificationLabel = 'Reprovado'
      verificationVariant = 'destructive'
    } else if (p?.is_verified) {
      verificationLabel = 'Verificado'
      verificationVariant = 'default'
    }

    return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Nome</span>
        <span className="font-medium">{p?.full_name || user?.name || '-'}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">CRN</span>
        <span className="font-medium">{p?.crn || '-'}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Telefone</span>
        <span className="font-medium">{p?.phone || '-'}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Verificação</span>
        <Badge
          variant={verificationVariant}
          className={
            verificationVariant === 'default'
              ? 'bg-green-100 text-green-700'
              : verificationVariant === 'destructive'
              ? 'bg-red-100 text-red-700'
              : 'text-yellow-600 border-yellow-300'
          }
        >
          {verificationLabel}
        </Badge>
      </div>
      <Separator className="my-2" />
      <div className="space-y-1">
        <div className="text-sm text-gray-500">Bio</div>
        <div className="text-sm text-gray-800 whitespace-pre-line">{p?.bio || '-'}</div>
      </div>

      <Separator className="my-4" />
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Documentos</span>
          {loadingDocs && (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Carregando...</span>
            </div>
          )}
        </div>
        {!loadingDocs && docs.length === 0 ? (
          <div className="text-center py-4">
            <FileText className="h-10 w-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Nenhum documento enviado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {docs.map((doc) => (
              <Card key={doc.id} className="bg-white">
                <CardContent className="p-3 space-y-3">
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
                        className="w-full h-24 object-cover rounded-md border border-gray-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const fallback = target.nextElementSibling as HTMLElement
                          if (fallback) fallback.classList.remove('hidden')
                        }}
                      />
                      <div className="hidden w-full h-24 bg-gray-100 rounded-md items-center justify-center">
                        <Image className="h-6 w-6 text-gray-400" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-24 bg-gray-100 rounded-md flex items-center justify-center">
                      <FileText className="h-6 w-6 text-gray-400" />
                    </div>
                  )}

                  <Button size="sm" variant="outline" className="w-full" onClick={() => openDocument(doc.public_url)}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
    )
  }

  const renderPatient = (p: any) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Nome</span>
        <span className="font-medium">{p?.full_name || user?.name || '-'}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Telefone</span>
        <span className="font-medium">{p?.phone || '-'}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Data de nascimento</span>
        <span className="font-medium">{p?.birth_date ? new Date(p.birth_date).toLocaleDateString('pt-BR') : '-'}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Gênero</span>
        <span className="font-medium">{p?.gender || '-'}</span>
      </div>
    </div>
  )

  const renderCompany = (p: any) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Empresa</span>
        <span className="font-medium">{p?.company_name || user?.name || '-'}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">CNPJ</span>
        <span className="font-medium">{p?.cnpj || '-'}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Telefone</span>
        <span className="font-medium">{p?.phone || '-'}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Verificado</span>
        {p?.is_verified ? (
          <Badge className="bg-green-100 text-green-700">Verificado</Badge>
        ) : (
          <Badge variant="outline" className="text-yellow-600 border-yellow-300">Pendente</Badge>
        )}
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Perfil de Usuário</DialogTitle>
          <DialogDescription>
            Visualização somente leitura do perfil do usuário
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="text-sm text-gray-500">Usuário</div>
            <div className="text-sm text-gray-800">{user?.name || '-'}</div>
            <div className="text-xs text-gray-500">{user?.email}</div>
          </div>

          {loading && (
            <div className="text-sm text-gray-500">Carregando perfil...</div>
          )}
          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}

          {!loading && !error && user?.type === 'nutricionista' && renderNutritionist(profile)}
          {!loading && !error && user?.type === 'paciente' && renderPatient(profile)}
          {!loading && !error && user?.type === 'empresa' && renderCompany(profile)}
          {!loading && !error && user?.type === 'admin' && (
            <div className="text-sm text-gray-500">Usuário administrador não possui perfil específico.</div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
