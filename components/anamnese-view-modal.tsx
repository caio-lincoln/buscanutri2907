'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { createSupabaseClient } from '@/lib/supabase'
import { AlertTriangle, Heart, Pill, Target, Utensils } from 'lucide-react'

interface AnamneseViewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId: string | null
}

interface AnamneseData {
  id?: string
  patient_id: string
  nome_completo?: string
  genero?: string
  cidade?: string
  estado?: string
  objetivos_nutricionais?: string[]
  objetivo_nutricional?: string
  comorbidades?: string[]
  alergias_alimentares?: string[]
  suplementacao_atual?: string[] | string
  medicacoes_uso?: string[] | string
  preferencias_alimentares?: string[] | string
  exames_laboratoriais?: any
}

export function AnamneseViewModal({ open, onOpenChange, patientId }: AnamneseViewModalProps) {
  const supabase = createSupabaseClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AnamneseData | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!open || !patientId) return
      setLoading(true)
      setError(null)
      try {
        // Resolver se o patientId é de profile (patient_profiles.id) ou de usuário (auth.users.id)
        let resolvedUserId: string | null = null

        // Tenta carregar perfil pelo ID informado
        const { data: profileRows, error: profileErr } = await supabase
          .from('patient_profiles')
          .select('id, user_id')
          .eq('id', patientId)
          .limit(1)

        if (profileErr) {
          // Se houve erro tentando resolver perfil, não bloqueia a leitura; segue assumindo que já é user_id
          resolvedUserId = patientId
        } else {
          const profile = Array.isArray(profileRows) ? profileRows[0] : (profileRows as any)
          resolvedUserId = profile?.user_id || patientId
        }

        const { data, error } = await supabase
          .from('anamnese_nutricional')
          .select('*')
          .eq('patient_id', resolvedUserId)
          .order('id', { ascending: false })
          .limit(1)
        if (error) throw error
        const row = Array.isArray(data) ? data[0] : (data as any)
        if (!row) {
          setData(null)
          setError('Nenhuma anamnese encontrada para este paciente.')
        } else {
          setData(row as AnamneseData)
        }
      } catch (e: any) {
        setData(null)
        const msg = e?.message || ''
        if (msg.includes('multiple (or no) rows')) {
          setError('Há mais de uma anamnese cadastrada ou nenhuma; exibindo a mais recente quando disponível.')
        } else {
          setError('Anamnese não encontrada ou sem permissão de leitura.')
        }
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [open, patientId])

  const renderList = (items?: string[] | string) => {
    // Normaliza: aceita string ou array; se string, tenta split por ; , ou \n
    let normalized: string[] = []
    if (Array.isArray(items)) {
      normalized = items
    } else if (typeof items === 'string') {
      normalized = items
        .split(/[;,\n]+/)
        .map(s => s.trim())
        .filter(Boolean)
    }

    if (!normalized || normalized.length === 0) {
      return <span className="text-sm text-muted-foreground">Sem informações</span>
    }

    return (
      <div className="flex flex-wrap gap-2">
        {normalized.map((it, idx) => (
          <Badge key={`${it}-${idx}`} variant="secondary" className="capitalize">{it}</Badge>
        ))}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Anamnese do Paciente</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Carregando anamnese...</div>
        ) : error ? (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                Não foi possível carregar a anamnese
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-600">{error}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" /> Objetivos Nutricionais
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderList(data?.objetivos_nutricionais?.length ? data?.objetivos_nutricionais : (data?.objetivo_nutricional ? [data.objetivo_nutricional] : []))}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-4 w-4" /> Comorbidades
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderList(data?.comorbidades)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Alergias Alimentares
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderList(data?.alergias_alimentares)}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-4 w-4" /> Suplementação Atual
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderList(data?.suplementacao_atual)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-4 w-4" /> Medicações em Uso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderList(data?.medicacoes_uso)}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-4 w-4" /> Preferências Alimentares
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderList(data?.preferencias_alimentares)}
              </CardContent>
            </Card>

            {data?.exames_laboratoriais ? (
              <Card>
                <CardHeader>
                  <CardTitle>Exames Laboratoriais</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">{JSON.stringify(data.exames_laboratoriais, null, 2)}</pre>
                </CardContent>
              </Card>
            ) : null}

            <Separator />

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Nome:</span>
                <div className="font-medium">{data?.nome_completo || '-'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Gênero:</span>
                <div className="font-medium capitalize">{data?.genero || '-'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Cidade:</span>
                <div className="font-medium">{data?.cidade || '-'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Estado:</span>
                <div className="font-medium">{data?.estado || '-'}</div>
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AnamneseViewModal
