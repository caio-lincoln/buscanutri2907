'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Calendar,
  Clock,
  ArrowLeft,
  Video,
  Star,
  MapPin,
  DollarSign,
  Search,
  Filter,
  Grid,
  List
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { getUserProfile } from '@/lib/auth'
import type { PatientProfile } from '@/lib/supabase'
import { format, parseISO, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { formatNutritionistData } from '@/lib/nutritionist-service'
import { loadStripe } from '@stripe/stripe-js'
import { createSupabaseClient } from '@/lib/supabase'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = stripeKey ? loadStripe(stripeKey) : null

interface NutritionistProfile {
  id: string
  user_id: string
  full_name: string
  profile_image_url: string | null
  bio: string | null
  specialties: string[]
  experience_years: number
  consultation_price: number
  rating: number
  total_reviews: number
  city: string | null
  state: string | null
  online_consultation_available?: boolean
  service_online_available?: boolean
  aceita_cupons?: boolean
}

interface AvailableSlot {
  datetime: string
  date: string
  time: string
  duration: number
  available: boolean
}

// CORREÇÃO URGENTE: Override de segurança para disponibilidade no frontend
// Garante que slots futuros sejam sempre exibidos, ignorando buffers de servidor
const isSlotAvailableOverride = (slotISO: string) => {
  try {
    const timezone = "America/Sao_Paulo"
    const nowLocal = new Date(
      new Date().toLocaleString("en-US", { timeZone: timezone })
    )
    const slotLocal = new Date(
      new Date(slotISO).toLocaleString("en-US", { timeZone: timezone })
    )
    return slotLocal > nowLocal
  } catch (e) {
    return new Date(slotISO) > new Date()
  }
}

function buildLocalIsoWithOffset(slot: AvailableSlot) {
  const [year, month, day] = slot.date.split('-').map(Number)
  const [hour, minute] = slot.time.split(':').map(Number)
  const localDate = new Date(year, month - 1, day, hour, minute, 0, 0)
  const offsetMinutes = localDate.getTimezoneOffset()
  const sign = offsetMinutes > 0 ? '-' : '+'
  const abs = Math.abs(offsetMinutes)
  const offsetHours = String(Math.floor(abs / 60)).padStart(2, '0')
  const offsetMins = String(abs % 60).padStart(2, '0')
  const yyyy = String(year).padStart(4, '0')
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  const hh = String(hour).padStart(2, '0')
  const min = String(minute).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:00${sign}${offsetHours}:${offsetMins}`
}

type PaymentMethod = 'card' | 'boleto'

const BASE_PAYMENT_METHODS: { value: PaymentMethod; label: string; description: string }[] = [
  {
    value: 'card',
    label: 'Cartão de crédito',
    description: 'Pagamento instantâneo, confirmação imediata da consulta.',
  },
  {
    value: 'boleto',
    label: 'Boleto bancário',
    description: 'Consulta confirmada após compensação do boleto.',
  },
]

const PAYMENT_METHODS = BASE_PAYMENT_METHODS

export default function AgendarPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nutritionistId = searchParams.get('nutritionistId')
  const { user, loading: authLoading, patientProfile } = useAuth()

  // Estados para busca de nutricionistas
  const [ nutritionists, setNutritionists ] = useState<NutritionistProfile[]>([])
  const [ searchTerm, setSearchTerm ] = useState('')
  const [ selectedSpecialty, setSelectedSpecialty ] = useState('Todas')
  const [ selectedState, setSelectedState ] = useState('Todas')
  const [ selectedPriceRange, setSelectedPriceRange ] = useState({ min: 0, max: 500 })
  const [ onlineOnly, setOnlineOnly ] = useState(true) // Padrão para teleconsultas
  const [ aceitaCupons, setAceitaCupons ] = useState(false)
  const [ sortBy, setSortBy ] = useState('rating')
  const [ viewMode, setViewMode ] = useState<'grid' | 'list'>('grid')
  const [ loading, setLoading ] = useState(false)
  const [ searchLoading, setSearchLoading ] = useState(false)
  const loadNutritionistsRef = useRef<() => Promise<void>>(() => Promise.resolve())

  const [ selectedNutritionist, setSelectedNutritionist ] = useState<NutritionistProfile | null>(null)
  const [ availableSlots, setAvailableSlots ] = useState<AvailableSlot[]>([])
  const [ selectedSlot, setSelectedSlot ] = useState<AvailableSlot | null>(null)
  const [ profile, setProfile ] = useState<PatientProfile | null>(null)
  const [ booking, setBooking ] = useState(false)
  const [ step, setStep ] = useState<'search' | 'schedule'>('search')
  const [ consultationType, setConsultationType ] = useState<'online' | 'presential'>('online')
  const [ paymentMethod, setPaymentMethod ] = useState<PaymentMethod>('card')
  const [ couponCode, setCouponCode ] = useState('')
  const [ couponStatus, setCouponStatus ] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle')
  const [ couponSummary, setCouponSummary ] = useState<{
    amountOriginal: number
    amountFinal: number
    discountValue: number
  } | null>(null)

  useEffect(() => {
    if (nutritionistId && nutritionists.length > 0) {
      const currentNutritionist = nutritionists.find(nutritionist => nutritionist.id === nutritionistId)

      if (currentNutritionist) {
        const onlineAvailable = Boolean(currentNutritionist.online_consultation_available || currentNutritionist.service_online_available)
        if (!currentNutritionist.consultation_price || currentNutritionist.consultation_price <= 0) {
          toast.warning('Nutricionista sem preço definido. Teleconsulta indisponível.')
        }
        if (!onlineAvailable) {
          toast.warning('Este nutricionista não oferece teleconsulta. Alternando para consulta presencial.')
          setConsultationType('presential')
        }
        handleSelectNutritionist(currentNutritionist)
      }
    }
  }, [ searchParams, nutritionists ])

  const handleApplyCoupon = async () => {
    if (!selectedNutritionist || !selectedNutritionist.consultation_price) {
      toast.error('Selecione um nutricionista com preço definido antes de aplicar o cupom')
      return
    }

    const trimmed = couponCode.trim()
    if (!trimmed) {
      toast.error('Digite um código de cupom')
      return
    }

    try {
      setCouponStatus('validating')

      const res = await fetch('/api/payments/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupon_code: trimmed,
          base_amount_brl: selectedNutritionist.consultation_price,
          currency: 'brl',
        }),
      })

      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e?.message || 'Cupom inválido ou expirado')
      }

      const data = await res.json()

      setCouponSummary({
        amountOriginal: data.amount_original,
        amountFinal: data.amount_final,
        discountValue: data.discount_value,
      })
      setCouponStatus('valid')
      toast.success('Cupom aplicado com sucesso')
    } catch (err: any) {
      console.error(err)
      setCouponSummary(null)
      setCouponStatus('invalid')
      toast.error(err.message || 'Cupom inválido ou expirado')
    }
  }

  const handleRemoveCoupon = () => {
    setCouponCode('')
    setCouponSummary(null)
    setCouponStatus('idle')
  }

  useEffect(() => {
    if ((!authLoading && !user)) {
      router.push('/login')
      return
    }

    if (user) {
      loadProfile()
      if (step === 'search') {
        loadNutritionists()
      }
    }
  }, [ user, authLoading, step, searchTerm, selectedSpecialty, selectedState, selectedPriceRange, onlineOnly, aceitaCupons, sortBy, patientProfile ])

  const loadProfile = async () => {
    try {
      const profileData = await getUserProfile()
      setProfile(profileData)
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    }
  }

  const loadNutritionists = async () => {
    try {
      setSearchLoading(true)
      const params = new URLSearchParams({
        specialty: selectedSpecialty,
        state: selectedState,
        minPrice: selectedPriceRange.min.toString(),
        maxPrice: selectedPriceRange.max.toString(),
        onlineOnly: onlineOnly.toString(),
        sortBy: sortBy,
        limit: '20'
      })

      if (aceitaCupons) {
        params.set('aceitaCupons', 'true')
      }

      const response = await fetch(`/api/nutritionists?${params}`)
      if (!response.ok) {
        throw new Error('Erro ao buscar nutricionistas')
      }

      const data = await response.json()
      const rows: NutritionistProfile[] = data.nutritionists || []
      const filteredByCoupon = aceitaCupons
        ? rows.filter(n => Boolean(n.aceita_cupons))
        : rows
      setNutritionists(filteredByCoupon)
    } catch (error) {
      console.error('Erro ao carregar nutricionistas:', error)
      setNutritionists([])
    } finally {
      setSearchLoading(false)
    }
  }

  useEffect(() => {
    loadNutritionistsRef.current = loadNutritionists
  }, [ searchTerm, selectedSpecialty, selectedState, selectedPriceRange, onlineOnly, aceitaCupons, sortBy ])

  useEffect(() => {
    const sb = createSupabaseClient()
    const channel = sb
      .channel('agendar_nutritionist_profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nutritionist_profiles' }, payload => {
        if (step === 'search') {
          loadNutritionistsRef.current()
        } else if (selectedNutritionist && (payload.new as any)?.id === selectedNutritionist.id) {
          const newRow = payload.new as any
          setSelectedNutritionist(prev => prev ? {
            ...prev,
            rating: typeof newRow.rating === 'number' ? newRow.rating : prev.rating,
            total_reviews: typeof newRow.total_reviews === 'number' ? newRow.total_reviews : prev.total_reviews,
          } : prev)
        }
      })
      .subscribe()

    return () => {
      sb.removeChannel(channel)
    }
  }, [ step, selectedNutritionist?.id ])

  const loadAvailableSlots = async (nutritionistId: string) => {
    try {
      setLoading(true)
      const startDate = format(new Date(), 'yyyy-MM-dd')
      const endDate = format(addDays(new Date(), 14), 'yyyy-MM-dd')

      const response = await fetch(
        `/api/teleconsulta/horarios-disponiveis?nutritionistId=${nutritionistId}&startDate=${startDate}&endDate=${endDate}`
      )

      if (!response.ok) {
        throw new Error('Erro ao carregar horários disponíveis')
      }

      const data = await response.json()
      setAvailableSlots(data.availableSlots || [])
    } catch (error) {
      console.error('Erro ao carregar horários:', error)
      toast.error('Erro ao carregar horários disponíveis')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectNutritionist = (nutritionist: NutritionistProfile) => {
    setSelectedNutritionist(nutritionist)
    setStep('schedule')
    loadAvailableSlots(nutritionist.id)
  }

  const handleBooking = async () => {
    if (!selectedSlot || !profile || !selectedNutritionist) {
      toast.error('Selecione um horário para continuar')
      return
    }

    try {
      setBooking(true)

      const scheduledFor = buildLocalIsoWithOffset(selectedSlot)

      const response = await fetch('/api/teleconsulta/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nutritionist_id: selectedNutritionist.id,
          scheduled_for: scheduledFor,
          duration_minutes: selectedSlot.duration,
          price: selectedNutritionist.consultation_price,
        }),
      })

      const responseText = await response.text()
      let responseJson: any = null
      try {
        responseJson = responseText ? JSON.parse(responseText) : null
      } catch {
        responseJson = null
      }

      console.log('POST /api/teleconsulta/sessions', {
        status: response.status,
        body: responseJson,
      })

      if (!response.ok || !responseJson?.ok) {
        const message =
          typeof responseJson?.error === 'string'
            ? responseJson.error
            : responseJson?.error?.message || 'Erro ao agendar teleconsulta'
        toast.error(message)
        return
      }

      const sessionIdFromResponse =
        responseJson.sessionId ?? responseJson.data?.sessionId

      if (!sessionIdFromResponse) {
        console.error('Teleconsulta sessionId ausente na resposta da API', {
          responseJson,
        })
        toast.error('Erro ao criar sessão de teleconsulta')
        return
      }

      const checkoutRes = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientProfile?.id,
          patient_email: patientProfile?.email ?? user?.email,
          nutritionist_id: selectedNutritionist.id,
          nutritionist_name: selectedNutritionist.full_name,
          scheduled_for: scheduledFor,
          duration_minutes: selectedSlot.duration,
          price_brl: selectedNutritionist.consultation_price,
          teleconsulta_session_id: sessionIdFromResponse,
          payment_method: paymentMethod,
          coupon_code:
            couponStatus === 'valid' && couponCode.trim()
              ? couponCode.trim()
              : undefined,
        }),
      })

      const checkoutText = await checkoutRes.text()
      let checkoutJson: any = null
      try {
        checkoutJson = checkoutText ? JSON.parse(checkoutText) : null
      } catch {
        checkoutJson = null
      }

      console.log('POST /api/payments/create-checkout', {
        status: checkoutRes.status,
        body: checkoutJson,
      })

      if (!checkoutRes.ok || !checkoutJson?.ok) {
        const message =
          typeof checkoutJson?.error === 'string'
            ? checkoutJson.error
            : checkoutJson?.error?.message || 'Falha ao iniciar pagamento'
        toast.error(message)
        return
      }

      const { sessionId } = checkoutJson.data

      if (!stripePromise) {
        toast.error('Erro de configuração: Chave pública do Stripe não encontrada.')
        return
      }
      
      const stripe = await stripePromise
      if (!stripe) {
        toast.error('Erro ao inicializar o Stripe.')
        return
      }
      
      await stripe.redirectToCheckout({ sessionId })
    } catch (err) {
      console.error(err)
      toast.error('Não foi possível iniciar o pagamento')
    } finally {
      setBooking(false)
    }
  }

  const handlePresentialConfirm = () => {
    if (!selectedSlot || !selectedNutritionist) {
      toast.error('Selecione um horário para continuar')
      return
    }
    const dateStr = selectedSlot.date
    const timeStr = selectedSlot.time
    router.push(`/dashboard/paciente/confirmar-presencial/${selectedNutritionist.user_id}?date=${encodeURIComponent(dateStr)}&time=${encodeURIComponent(timeStr)}`)
  }

  const FiltersBar = () => (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Buscar por nome ou especialidade"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-64"
        />
      </div>
      <div className="flex items-center gap-2">
        <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Especialidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas</SelectItem>
            <SelectItem value="Emagrecimento">Emagrecimento</SelectItem>
            <SelectItem value="Esportiva">Esportiva</SelectItem>
            <SelectItem value="Clínica">Clínica</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Select value={selectedState} onValueChange={setSelectedState}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas</SelectItem>
            <SelectItem value="SP">SP</SelectItem>
            <SelectItem value="RJ">RJ</SelectItem>
            <SelectItem value="MG">MG</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={`${selectedPriceRange.min}-${selectedPriceRange.max}`}
          onValueChange={val => {
            const [min, max] = val.split('-').map(Number)
            setSelectedPriceRange({ min, max })
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Preço" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={`0-500`}>Até R$ 500</SelectItem>
            <SelectItem value={`0-150`}>Até R$ 150</SelectItem>
            <SelectItem value={`150-300`}>R$ 150 - R$ 300</SelectItem>
            <SelectItem value={`300-500`}>R$ 300 - R$ 500</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant={onlineOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => setOnlineOnly(v => !v)}
        >
          Teleconsulta
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant={aceitaCupons ? 'default' : 'outline'}
          size="sm"
          onClick={() => setAceitaCupons(v => !v)}
        >
          Aceitam cupom
        </Button>
      </div>
    </div>
  )

  // const handleBooking = async () => {
  //   if (!selectedSlot || !profile || !selectedNutritionist) {
  //     toast.error('Selecione um horário para continuar')
  //     return
  //   }

  //   setBooking(true)
  //   try {
  //     const response = await fetch('/api/teleconsulta/sessions', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         nutritionist_id: selectedNutritionist.id,
  //         scheduled_for: selectedSlot.datetime,
  //         duration_minutes: selectedSlot.duration,
  //         price: selectedNutritionist.consultation_price,
  //       }),
  //     })

  //     if (!response.ok) {
  //       throw new Error('Erro ao agendar teleconsulta')
  //     }

  //     const data = await response.json()
  //     toast.success('Teleconsulta agendada com sucesso!')
  //     router.push('/dashboard/paciente/teleconsultas')
  //   } catch (error) {
  //     console.error('Erro ao agendar:', error)
  //     toast.error('Erro ao agendar teleconsulta')
  //   } finally {
  //     setBooking(false)
  //   }
  // }

  // Agrupar slots por data
  const slotsByDate = availableSlots.reduce((acc, slot) => {
    if (!acc[ slot.date ]) {
      acc[ slot.date ] = []
    }
    acc[ slot.date ].push(slot)
    return acc
  }, {} as Record<string, AvailableSlot[]>)

  if (searchLoading && step === 'search') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (step === 'schedule' && !nutritionistId) {
              setStep('search')
              setSelectedNutritionist(null)
              setSelectedSlot(null)
            } else {
              router.back()
            }
          }}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {step === 'schedule' ? 'Voltar à busca' : 'Voltar'}
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {step === 'search' ? 'Buscar Nutricionista' : consultationType === 'online' ? 'Agendar Teleconsulta' : 'Agendar Consulta Presencial'}
          </h1>
          <p className="text-gray-600">
            {step === 'search'
              ? 'Encontre o nutricionista ideal para sua consulta'
              : consultationType === 'online'
                ? 'Escolha o melhor horário para sua consulta online'
                : 'Escolha o melhor horário para sua consulta presencial'
            }
          </p>
        </div>
      </div>

      {step === 'search' ? (
        // Tela de busca de nutricionistas
        <div className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros de Busca
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Nome ou especialidade..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Especialidade</label>
                  <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todas">Todas</SelectItem>
                      <SelectItem value="Nutrição Clínica">Nutrição Clínica</SelectItem>
                      <SelectItem value="Nutrição Esportiva">Nutrição Esportiva</SelectItem>
                      <SelectItem value="Nutrição Infantil">Nutrição Infantil</SelectItem>
                      <SelectItem value="Nutrição Geriátrica">Nutrição Geriátrica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Estado</label>
                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todas">Todos</SelectItem>
                      <SelectItem value="SP">São Paulo</SelectItem>
                      <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                      <SelectItem value="MG">Minas Gerais</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Ordenar por</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating">Melhor avaliado</SelectItem>
                      <SelectItem value="price_low">Menor preço</SelectItem>
                      <SelectItem value="price_high">Maior preço</SelectItem>
                      <SelectItem value="experience">Mais experiente</SelectItem>
                      <SelectItem value="name">Nome A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Toggles adicionais */}
              <div className="flex items-center gap-2">
                <Button
                  variant={onlineOnly ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOnlineOnly(v => !v)}
                >
                  Teleconsulta
                </Button>
                <Button
                  variant={aceitaCupons ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAceitaCupons(v => !v)}
                >
                  Aceitam cupom
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resultados */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {nutritionists.length} nutricionista(s) encontrado(s)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {nutritionists.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum nutricionista encontrado
                  </h3>
                  <p className="text-gray-600">
                    Tente ajustar os filtros de busca para encontrar mais resultados.
                  </p>
                </div>
              ) : (
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                      : 'space-y-4'
                  }
                >
                  {nutritionists.map(nutritionist => {
                    const formatted = formatNutritionistData(nutritionist)

                    return (
                      <Card key={nutritionist.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-16 w-16">
                              <AvatarImage
                                src={nutritionist.profile_image_url || ''}
                                alt={nutritionist.full_name}
                              />
                              <AvatarFallback>
                                {nutritionist.full_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <Link
                                href={nutritionist.id ? `/nutricionistas/${nutritionist.id}` : '/nutricionistas'}
                                className="font-semibold text-lg truncate cursor-pointer hover:underline"
                              >
                                {nutritionist.full_name}
                              </Link>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span>{(nutritionist.rating ?? 0).toFixed(1)}</span>
                                <span>({nutritionist.total_reviews ?? 0} avaliações)</span>
                              </div>
                              {nutritionist.city && nutritionist.state && (
                                <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{nutritionist.city}, {nutritionist.state}</span>
                                </div>
                              )}
                              {nutritionist.specialties && nutritionist.specialties.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {nutritionist.specialties.slice(0, 2).map((specialty, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {specialty}
                                    </Badge>
                                  ))}
                                  {nutritionist.specialties.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{nutritionist.specialties.length - 2}
                                    </Badge>
                                  )}
                                  {nutritionist.aceita_cupons && (
                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                      Aceita cupom
                                    </Badge>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 font-semibold text-green-600">
                                  <DollarSign className="h-4 w-4" />
                                  R$ {nutritionist.consultation_price.toFixed(2)}
                                </div>
                                <Button
                                  onClick={() => handleSelectNutritionist(nutritionist)}
                                  className="flex items-center gap-2"
                                >
                                  <Video className="h-4 w-4" />
                                  Agendar
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        // Tela de agendamento
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Informações do Nutricionista */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {consultationType === 'online' ? (
                      <Video className="h-5 w-5 text-green-600" />
                    ) : (
                      <MapPin className="h-5 w-5 text-green-600" />
                    )}
                    {consultationType === 'online' ? 'Teleconsulta' : 'Consulta Presencial'}
                  </CardTitle>
                  <div className="flex gap-2">
                    {selectedNutritionist && (
                      <>
                        {/* Teleconsulta disponível? */}
                      </>
                    )}
                    <Button
                      variant={consultationType === 'online' ? 'default' : 'outline'}
                      size="sm"
                      disabled={!(selectedNutritionist?.online_consultation_available || selectedNutritionist?.service_online_available)}
                      title={!(selectedNutritionist?.online_consultation_available || selectedNutritionist?.service_online_available) ? 'Este nutricionista não oferece teleconsulta' : undefined}
                      onClick={() => {
                        if (selectedNutritionist?.online_consultation_available || selectedNutritionist?.service_online_available) {
                          setConsultationType('online')
                        } else {
                          toast.warning('Este nutricionista não oferece teleconsulta')
                        }
                      }}
                    >
                      Teleconsulta
                    </Button>
                    <Button
                      variant={consultationType === 'presential' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setConsultationType('presential')}
                    >
                      Presencial
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedNutritionist && (
                  <>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage
                          src={selectedNutritionist.profile_image_url || ''}
                          alt={selectedNutritionist.full_name}
                        />
                        <AvatarFallback>
                          {selectedNutritionist.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{selectedNutritionist.full_name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{(selectedNutritionist.rating ?? 0).toFixed(1)}</span>
                          <span>({selectedNutritionist.total_reviews ?? 0} avaliações)</span>
                        </div>
                        {selectedNutritionist.city && selectedNutritionist.state && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{selectedNutritionist.city}, {selectedNutritionist.state}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedNutritionist.bio && (
                      <div>
                        <h4 className="font-medium mb-2">Sobre</h4>
                        <p className="text-sm text-gray-600">{selectedNutritionist.bio}</p>
                      </div>
                    )}

                    {selectedNutritionist.specialties && selectedNutritionist.specialties.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Especialidades</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedNutritionist.specialties.map((specialty, index) => (
                            <Badge key={index} variant="secondary">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Valor da consulta:</span>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1 font-semibold text-lg text-green-600">
                            <DollarSign className="h-4 w-4" />
                            {couponSummary && couponStatus === 'valid' ? (
                              <>
                                <span className="text-sm text-gray-500 line-through">
                                  R$ {selectedNutritionist.consultation_price.toFixed(2)}
                                </span>
                                <span>
                                  R$ {couponSummary.amountFinal.toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span>
                                R$ {selectedNutritionist.consultation_price.toFixed(2)}
                              </span>
                            )}
                          </div>
                          {couponSummary && couponStatus === 'valid' && (
                            <span className="text-xs text-green-700">
                              Desconto de R$ {couponSummary.discountValue.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-600">Duração:</span>
                        <span className="font-medium">60 minutos</span>
                      </div>
                      {consultationType === 'online' && !(selectedNutritionist.online_consultation_available || selectedNutritionist.service_online_available) && (
                        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                          Este nutricionista não oferece teleconsulta. Selecione "Presencial" para continuar.
                        </div>
                      )}
                    </div>

                    {selectedSlot && (
                      <>
                        <div className="border-t pt-4">
                          <h4 className="font-medium mb-2">Horário Selecionado</h4>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 text-green-800">
                              <Calendar className="h-4 w-4" />
                              <span className="font-medium">
                                {format(parseISO(selectedSlot.date), "dd 'de' MMMM 'de' yyyy", {
                                  locale: ptBR,
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-green-800 mt-1">
                              <Clock className="h-4 w-4" />
                              <span className="font-medium">
                                {selectedSlot.time}
                              </span>
                            </div>
                          </div>
                          {consultationType === 'online' ? (
                            (selectedNutritionist.online_consultation_available || selectedNutritionist.service_online_available) ? (
                              <Button
                                onClick={handleBooking}
                                disabled={booking}
                                className="w-full mt-4"
                              >
                                {booking ? 'Agendando...' : 'Confirmar Teleconsulta'}
                              </Button>
                            ) : (
                              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                                Teleconsulta indisponível para este nutricionista.
                              </div>
                            )
                          ) : (
                            <Button
                              onClick={handlePresentialConfirm}
                              className="w-full mt-4"
                            >
                              Confirmar Consulta Presencial
                            </Button>
                          )}
                        </div>

                        <div className="border-t pt-4 mt-4 space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Forma de pagamento</h4>
                            <RadioGroup
                              value={paymentMethod}
                              onValueChange={value => setPaymentMethod(value as PaymentMethod)}
                              className="grid grid-cols-1 md:grid-cols-3 gap-3"
                            >
                              {PAYMENT_METHODS.map(method => (
                                <label
                                  key={method.value}
                                  className="flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm hover:border-green-500"
                                >
                                  <RadioGroupItem value={method.value} className="mt-1" />
                                  <div>
                                    <div className="font-medium">{method.label}</div>
                                    <div className="text-xs text-gray-600">
                                      {method.description}
                                    </div>
                                  </div>
                                </label>
                              ))}
                            </RadioGroup>
                            <p className="mt-2 text-xs text-gray-500">
                              Cartão é sempre aceito. Boleto depende da disponibilidade da Stripe no Brasil.
                            </p>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Adicionar cupom</h4>
                            <div className="flex flex-wrap items-center gap-2">
                              <Input
                                value={couponCode}
                                onChange={e => {
                                  setCouponCode(e.target.value)
                                  if (!e.target.value) {
                                    setCouponStatus('idle')
                                    setCouponSummary(null)
                                  }
                                }}
                                placeholder="Digite seu cupom"
                                className="w-full max-w-xs"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleApplyCoupon}
                                disabled={!couponCode.trim() || couponStatus === 'validating'}
                              >
                                {couponStatus === 'validating' ? 'Validando...' : 'Aplicar'}
                              </Button>
                              {couponSummary && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleRemoveCoupon}
                                >
                                  Remover
                                </Button>
                              )}
                            </div>
                            {couponStatus === 'valid' && couponSummary && (
                              <p className="text-xs text-green-700">
                                Cupom aplicado: desconto de R$ {couponSummary.discountValue.toFixed(2)}.
                              </p>
                            )}
                            {couponStatus === 'invalid' && (
                              <p className="text-xs text-red-600">
                                Cupom inválido ou expirado.
                              </p>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Horários Disponíveis */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Horários Disponíveis</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                ) : Object.keys(slotsByDate).length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhum horário disponível
                    </h3>
                    <p className="text-gray-600">
                      Este nutricionista não possui horários disponíveis nas próximas 2 semanas.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(slotsByDate).map(([ date, slots ]) => (
                      <div key={date}>
                        <h3 className="font-medium text-lg mb-3">
                          {format(parseISO(date), "EEEE, dd 'de' MMMM", {
                            locale: ptBR,
                          })}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {slots.map((slot, index) => {
                            const isAvailable = slot.available && isSlotAvailableOverride(slot.datetime)
                            return (
                              <Button
                                key={index}
                                disabled={!isAvailable}
                                variant={selectedSlot?.datetime === slot.datetime ? 'default' : 'outline'}
                                onClick={() => setSelectedSlot(slot)}
                                className={`h-12 flex items-center justify-center ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                <Clock className="h-4 w-4 mr-2" />
                                {slot.time}
                              </Button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
