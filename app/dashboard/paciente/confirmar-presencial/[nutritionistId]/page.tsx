'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MapPin, Calendar, Clock, ArrowLeft, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { ptBR } from 'date-fns/locale'
import { format, parseISO } from 'date-fns'
import { nutritionistAddressService } from '@/lib/nutritionist-address-service'

interface NutritionistData {
  id: string // nutritionist_profiles.id
  user_id: string
  full_name: string
  profile_image_url: string | null
  specialties: string[]
  phone?: string | null
  city?: string | null
  state?: string | null
}

export default function ConfirmarPresencialPage() {
  const params = useParams<{ nutritionistId: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()

  const nutritionistUserId = params?.nutritionistId
  const dateParam = searchParams.get('date') || ''
  const timeParam = searchParams.get('time') || ''

  const [ loading, setLoading ] = useState(true)
  const [ nutritionist, setNutritionist ] = useState<NutritionistData | null>(null)
  const [ address, setAddress ] = useState<any | null>(null)

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
            <p>Carregando...</p>
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
                <Button onClick={() => toast.success('Consulta presencial confirmada!')}>
                  Confirmar Presencial
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