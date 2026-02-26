
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarSelector } from '@/components/agendar/components/CalendarSelector'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { MapPin, Calendar as CalendarIcon, Clock, User } from 'lucide-react'
import Image from 'next/image'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Address {
  id: string
  full_address: string
  neighborhood: string
  city: string
  state: string
  zip_code: string
  is_main: boolean
}

interface Nutritionist {
  id: string
  full_name: string
  specialties: string
  profile_image_url?: string | null
  addresses: Address[]
}

interface BookingFormProps {
  nutritionist: Nutritionist
  patientId: string
}

export function BookingForm({ nutritionist, patientId }: BookingFormProps) {
  const router = useRouter()
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    nutritionist.addresses.find(a => a.is_main)?.id || nutritionist.addresses[0]?.id || ''
  )
  const [loading, setLoading] = useState(false)

  const handleBooking = async () => {
    if (!selectedSlot || !selectedAddressId) {
      toast.error('Selecione um horário e um local de atendimento.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/appointments/presencial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patient_id: patientId,
          professional_id: nutritionist.id,
          date: selectedSlot.date, // YYYY-MM-DD
          time: selectedSlot.time, // HH:mm
          appointment_type: 'presencial',
          address_id: selectedAddressId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao agendar consulta')
      }

      toast.success('Consulta presencial agendada com sucesso.')
      router.push('/dashboard/paciente?activeTab=presenciais')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedAddress = nutritionist.addresses.find(a => a.id === selectedAddressId)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Coluna Principal: Informações */}
      <div className="md:col-span-1 space-y-6">
        {/* Card do Profissional */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profissional</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center space-y-4">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100">
              {nutritionist.profile_image_url ? (
                <Image
                  src={nutritionist.profile_image_url}
                  alt={nutritionist.full_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-gray-400 m-auto mt-6" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{nutritionist.full_name}</h3>
              <p className="text-sm text-muted-foreground">{nutritionist.specialties}</p>
            </div>
          </CardContent>
        </Card>

        {/* Local de Atendimento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Local de Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nutritionist.addresses.length > 0 ? (
              <div className="space-y-4">
                {nutritionist.addresses.map((address) => (
                  <div
                    key={address.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedAddressId === address.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedAddressId(address.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedAddressId === address.id ? 'border-primary' : 'border-gray-400'
                      }`}>
                        {selectedAddressId === address.id && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{address.full_address}</p>
                        <p className="text-gray-500">
                          {address.neighborhood}, {address.city} - {address.state}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">{address.zip_code}</p>
                        {address.is_main && (
                          <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            Principal
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-destructive">
                Este profissional não possui endereço cadastrado para atendimento presencial.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Coluna do Calendário */}
      <div className="md:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Selecione o Horário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CalendarSelector
              nutritionistId={nutritionist.id}
              onSelectSlot={setSelectedSlot}
              selectedSlot={selectedSlot}
            />
          </CardContent>
        </Card>

        {/* Resumo e Confirmação */}
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 text-slate-800">Resumo do Agendamento</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Tipo:</span>
                <span className="font-medium text-slate-900">Presencial</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Profissional:</span>
                <span className="font-medium text-slate-900">{nutritionist.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Data:</span>
                <span className="font-medium text-slate-900">
                  {selectedSlot
                    ? format(new Date(selectedSlot.datetime), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Horário:</span>
                <span className="font-medium text-slate-900">
                  {selectedSlot ? selectedSlot.time : '-'}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-500">Local:</span>
                <span className="font-medium text-slate-900 text-right max-w-[200px]">
                  {selectedAddress ? `${selectedAddress.full_address}, ${selectedAddress.city}` : '-'}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                className="w-full"
                size="lg"
                onClick={handleBooking}
                disabled={!selectedSlot || !selectedAddressId || loading || nutritionist.addresses.length === 0}
              >
                {loading ? 'Confirmando...' : 'Confirmar Agendamento Presencial'}
              </Button>
              <p className="text-xs text-center text-slate-500 mt-2">
                Ao confirmar, você concorda com os termos de agendamento presencial.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
