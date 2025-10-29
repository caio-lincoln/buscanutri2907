'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { MapPin, Calendar, Clock, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import AnamneseViewModal from '@/components/anamnese-view-modal'

interface PresencialAppointment {
  id: string
  appointment_date: string
  duration_minutes?: number
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  type: 'consultation' | 'follow_up' | 'emergency'
  notes?: string | null
  price?: number | null
  nutritionist_id?: string
  patient_id?: string
  patient?: {
    id: string
    full_name: string
    profile_image_url?: string
  }
  nutritionist?: {
    id: string
    full_name: string
    profile_image_url?: string
    address?: string
  }
}

interface NutritionistPresenciaisTabProps {
  nutritionistId: string
}

export default function NutritionistPresenciaisTab({ nutritionistId }: NutritionistPresenciaisTabProps) {
  const supabase = useMemo(() => createSupabaseClient(), [])
  const [appointments, setAppointments] = useState<PresencialAppointment[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [showUpcomingOnly, setShowUpcomingOnly] = useState<boolean>(true)
  const [anamnesisPatientId, setAnamnesisPatientId] = useState<string | null>(null)
  const [isAnamnesisOpen, setIsAnamnesisOpen] = useState<boolean>(false)

  const loadAppointments = useCallback(async () => {
    if (!nutritionistId) return
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(
          `
          id, appointment_date, duration_minutes, status, type, is_online, patient_notes, consultation_fee, nutritionist_id, patient_id,
          nutritionist:nutritionist_profiles ( id, full_name, profile_image_url, address ),
          patient:patient_profiles ( id, full_name, profile_image_url )
        `
        )
        .eq('nutritionist_id', nutritionistId)
        .eq('is_online', false)
        .order('appointment_date', { ascending: false })

      if (error) throw error
      const mapped: PresencialAppointment[] = (data as any[])?.map((row: any) => ({
        id: row.id,
        appointment_date: row.appointment_date,
        duration_minutes: row.duration_minutes,
        status: row.status,
        type: row.type,
        notes: row.patient_notes,
        price: row.consultation_fee,
        nutritionist_id: row.nutritionist_id,
        patient_id: row.patient_id,
        patient: row.patient,
        nutritionist: row.nutritionist,
      })) || []

      setAppointments(mapped)
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar consultas presenciais.')
    } finally {
      setLoading(false)
    }
  }, [supabase, nutritionistId])

  useEffect(() => {
    loadAppointments()
  }, [loadAppointments])

  const filteredAppointments = useMemo(() => {
    let list = appointments
    const now = new Date()
    if (showUpcomingOnly) {
      list = list.filter(a => new Date(a.appointment_date) >= now)
    }
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase()
      list = list.filter(a => a.patient?.full_name?.toLowerCase().includes(term))
    }
    return list
  }, [appointments, showUpcomingOnly, searchTerm])

  const statusVariant = (status: PresencialAppointment['status']) => {
    switch (status) {
      case 'scheduled':
      case 'confirmed':
        return 'default' as const
      case 'completed':
        return 'secondary' as const
      case 'cancelled':
      case 'no_show':
        return 'destructive' as const
      default:
        return 'outline' as const
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-2xl backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-[#1E1D40]">Consultas Presenciais</CardTitle>
          <p className="text-gray-600">Integração com consultas agendadas pelos pacientes</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome do paciente"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Mostrar apenas futuras</label>
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={showUpcomingOnly}
                onChange={e => setShowUpcomingOnly(e.target.checked)}
              />
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#4AB0D9]" />
            </div>
          ) : error ? (
            <div className="py-12 text-center text-red-600">
              {error}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="py-12 text-center text-gray-600">
              Nenhuma consulta presencial encontrada.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredAppointments.map(appt => {
                const dateObj = new Date(appt.appointment_date)
                const dateStr = format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                const timeStr = format(dateObj, 'HH:mm', { locale: ptBR })
                return (
                  <Card key={appt.id} className="border border-blue-100 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={appt.patient?.profile_image_url || '/placeholder.svg'} />
                            <AvatarFallback>
                              {appt.patient?.full_name?.[0]?.toUpperCase() || 'P'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[#1E1D40]">{appt.patient?.full_name || 'Paciente'}</span>
                              <Badge variant={statusVariant(appt.status)}>
                                {appt.status === 'scheduled' ? 'Agendada' :
                                 appt.status === 'confirmed' ? 'Confirmada' :
                                 appt.status === 'completed' ? 'Concluída' :
                                 appt.status === 'cancelled' ? 'Cancelada' :
                                 appt.status === 'no_show' ? 'Faltou' :
                                 appt.status}
                              </Badge>
                            </div>
                            <div className="mt-1 text-sm text-gray-600 flex items-center gap-3">
                              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {dateStr}</span>
                              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {timeStr}{appt.duration_minutes ? ` • ${appt.duration_minutes}min` : ''}</span>
                            </div>
                            {appt.nutritionist?.address && (
                              <div className="mt-1 text-sm text-gray-600 flex items-center gap-1">
                                <MapPin className="h-4 w-4" /> {appt.nutritionist.address}
                              </div>
                            )}
                  </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-700">
                            {appt.type === 'consultation' ? 'Consulta' : appt.type === 'follow_up' ? 'Retorno' : 'Emergência'}
                          </div>
                          {typeof appt.price === 'number' && (
                            <div className="mt-1 font-semibold text-[#1E1D40]">
                              R$ {appt.price.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        {appt.notes && (
                          <div className="text-sm text-gray-700">
                            Observações: {appt.notes}
                          </div>
                        )}
                        {appt.patient_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setAnamnesisPatientId(appt.patient_id!); setIsAnamnesisOpen(true) }}
                          >
                            Ver Anamnese
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
      <AnamneseViewModal
        open={isAnamnesisOpen}
        onOpenChange={setIsAnamnesisOpen}
        patientId={anamnesisPatientId}
      />
    </div>
  )
}
