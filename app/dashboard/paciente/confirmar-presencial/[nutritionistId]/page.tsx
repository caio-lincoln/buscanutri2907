'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MapPin, Calendar, Clock, ArrowLeft, MessageCircle } from 'lucide-react'
import Loading from '@/components/ui/loading'
import { toast } from 'sonner'
import { ptBR } from 'date-fns/locale'
import { format, parseISO } from 'date-fns'
import { nutritionistAddressService } from '@/lib/nutritionist-address-service'
import { useAuth } from '@/contexts/auth-context'
import { createSupabaseClient } from '@/lib/supabase'

interface NutritionistData {
  id: string // nutritionist_profiles.id
  user_id: string
  full_name: string
  profile_image_url: string | null
  specialties: string[]
  phone?: string | null
  city?: string | null
  state?: string | null
  consultation_fee?: number | null
}

export default function ConfirmarPresencialPage() {
  const params = useParams<{ nutritionistId: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, loading: authLoading, patientProfile } = useAuth()
  const supabase = useMemo(() => createSupabaseClient(), [])

  const nutritionistUserId = params?.nutritionistId
  const dateParam = searchParams.get('date') || ''
  const timeParam = searchParams.get('time') || ''

  const [ loading, setLoading ] = useState(true)
  const [ nutritionist, setNutritionist ] = useState<NutritionistData | null>(null)
  const [ address, setAddress ] = useState<any | null>(null)
  const [ confirming, setConfirming ] = useState(false)

  const scheduledDateTime = useMemo(() => {
    try {
      if (dateParam && timeParam) {
        const iso = `${dateParam}T${timeParam}:00`
        return parseISO(iso)
      }
      return null
    } catch {
      return null
    }
  }, [ dateParam, timeParam ])

  useEffect(() => {
    async function loadData() {
      if (!nutritionistUserId) {
        toast.error('Nutricionista não informado')
        return
      }
      setLoading(true)
      try {
        // Buscar dados do nutricionista pela API
        const res = await fetch(`/api/nutritionists/${nutritionistUserId}`)
        const json = await res.json()
        const n = json?.nutritionist
        if (!res.ok || !n) {
          throw new Error('Erro ao buscar nutricionista')
        }

        const formatted: NutritionistData = {
          id: n.id,
          user_id: n.user_id,
          full_name: n.full_name,
          profile_image_url: n.profile_image_url || null,
          specialties: Array.isArray(n.specialties) ? n.specialties : [],
          phone: n.phone || null,
          city: n.city || null,
          state: n.state || null,
          consultation_fee: typeof n.consultation_fee === 'number' ? n.consultation_fee : null,
        }
        setNutritionist(formatted)

        // Buscar endereço principal presencial (nutritionist_profiles.id)
        if (formatted.id) {
          const mainAddr = await nutritionistAddressService.getMainAddress(formatted.id)
          setAddress(mainAddr)
        }
      } catch (err) {
        console.error(err)
        toast.error('Não foi possível carregar dados do nutricionista')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [ nutritionistUserId ])

  const addressDisplay = useMemo(() => {
    if (address) {
      const parts = [
        address.street && address.number ? `${address.street}, ${address.number}` : address.street || '',
        address.neighborhood || '',
        address.city && address.state ? `${address.city}/${address.state}` : address.city || address.state || '',
        address.zip_code ? `CEP ${address.zip_code}` : ''
      ].filter(Boolean)
      return parts.join(' - ')
    }
    if (nutritionist?.city || nutritionist?.state) {
      return `${nutritionist?.city || ''}${nutritionist?.state ? `/${nutritionist.state}` : ''}`
    }
    return 'Local a combinar'
  }, [ address, nutritionist ])

  function sanitizePhoneForWhatsApp(phone?: string | null): string | null {
    if (!phone) return null
    // Remove tudo que não for dígito
    let digits = phone.replace(/\D/g, '')
    // Garante código do país (Brasil: 55)
    if (!digits.startsWith('55')) {
      digits = `55${digits}`
    }
    return digits
  }

  const whatsappHref = useMemo(() => {
    const digits = sanitizePhoneForWhatsApp(nutritionist?.phone || undefined)
    if (!digits) return null
    const when = scheduledDateTime
      ? `${format(scheduledDateTime, 'dd/MM/yyyy', { locale: ptBR })} às ${format(scheduledDateTime, 'HH:mm')}`
      : `${dateParam} ${timeParam}`
    const text = encodeURIComponent(
      `Olá! Gostaria de confirmar minha consulta presencial em ${when}.`
    )
    return `https://wa.me/${digits}?text=${text}`
  }, [ nutritionist?.phone, scheduledDateTime, dateParam, timeParam ])

  async function handleConfirm() {
    try {
      if (authLoading) return
      if (!user || !patientProfile?.id) {
        toast.error('Você precisa estar autenticado como paciente para confirmar.')
        return
      }
      if (!nutritionist?.id) {
        toast.error('Nutricionista não encontrado para confirmar.')
        return
      }
      if (!scheduledDateTime) {
        toast.error('Data ou horário inválidos.')
        return
      }
      setConfirming(true)

      const payload: any = {
        patient_id: patientProfile.id,
        nutritionist_id: nutritionist.id,
        // O campo no banco é DATE, então gravamos apenas 'yyyy-MM-dd'
        appointment_date: format(scheduledDateTime, 'yyyy-MM-dd'),
        // O campo no banco é TIME, gravamos 'HH:mm:ss'
        appointment_time: format(scheduledDateTime, 'HH:mm:ss'),
        duration_minutes: 60,
        status: 'confirmed',
        type: 'consultation',
        is_online: false,
      }
      if (typeof nutritionist.consultation_fee === 'number') {
        payload.consultation_fee = nutritionist.consultation_fee
      }

      // Inserir na nova tabela dedicada a consultas presenciais
      const { error } = await supabase
        .from('in_person_consultations')
        .insert({
          patient_id: payload.patient_id,
          nutritionist_id: payload.nutritionist_id,
          scheduled_at: parseISO(`${payload.appointment_date}T${payload.appointment_time}`),
          duration_minutes: payload.duration_minutes,
          status: payload.status,
          type: payload.type,
          patient_notes: payload.patient_notes,
        })

      if (error) {
        throw error
      }

      toast.success('Consulta presencial confirmada!')
      router.push('/dashboard/paciente/presenciais')
    } catch (err: any) {
      console.error('Erro ao confirmar consulta presencial:', err)
      toast.error('Não foi possível confirmar a consulta. Tente novamente.')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" className="gap-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Confirmar Consulta Presencial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <Loading message="Carregando informações..." />
          ) : nutritionist ? (
            <>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={nutritionist.profile_image_url || ''} alt={nutritionist.full_name} />
                  <AvatarFallback>{nutritionist.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold">{nutritionist.full_name}</h2>
                  {nutritionist.specialties?.length ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {nutritionist.specialties.slice(0, 2).map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                      {nutritionist.specialties.length > 2 && (
                        <Badge variant="outline" className="text-xs">+{nutritionist.specialties.length - 2}</Badge>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span>{addressDisplay}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <span>
                      {scheduledDateTime
                        ? format(scheduledDateTime, 'dd/MM/yyyy', { locale: ptBR })
                        : dateParam}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="h-4 w-4 text-green-600" />
                    <span>
                      {scheduledDateTime
                        ? format(scheduledDateTime, 'HH:mm')
                        : timeParam}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    asChild
                    disabled={!whatsappHref}
                    className="w-full"
                  >
                    <a href={whatsappHref || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp do nutricionista
                    </a>
                  </Button>
                  {!whatsappHref && (
                    <p className="text-xs text-gray-500">Telefone não disponível para contato via WhatsApp.</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button variant="outline" onClick={() => router.back()} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Alterar horário
                </Button>
                <Button onClick={handleConfirm} disabled={confirming || !scheduledDateTime || !nutritionist?.id}>
                  {confirming ? 'Concluindo...' : 'Concluir'}
                </Button>
              </div>
            </>
          ) : (
            <p>Nutricionista não encontrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}