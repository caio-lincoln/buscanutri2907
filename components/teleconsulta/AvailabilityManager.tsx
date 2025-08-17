'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Clock, Plus, Trash2, Save, Calendar as CalendarIcon } from 'lucide-react'
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

export interface TimeSlot {
  id?: string
  start_time: string // HH:mm format
  end_time: string // HH:mm format
  is_available: boolean
}

export interface DayAvailability {
  day_of_week: number // 0 = Sunday, 1 = Monday, etc.
  is_available: boolean
  time_slots: TimeSlot[]
}

export interface AvailabilityData {
  id?: string
  nutritionist_id: string
  weekly_schedule: DayAvailability[]
  consultation_duration: number // minutes
  price_per_consultation: number
  break_between_consultations: number // minutes
  max_advance_booking_days: number
  notes?: string
  is_active: boolean
}

export interface AvailabilityManagerProps {
  nutritionistId: string
  initialData?: AvailabilityData
  onSave: (data: AvailabilityData) => Promise<void>
  className?: string
}

const daysOfWeek = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Segunda-feira', short: 'Seg' },
  { value: 2, label: 'Terça-feira', short: 'Ter' },
  { value: 3, label: 'Quarta-feira', short: 'Qua' },
  { value: 4, label: 'Quinta-feira', short: 'Qui' },
  { value: 5, label: 'Sexta-feira', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' }
]

const defaultTimeSlot: TimeSlot = {
  start_time: '09:00',
  end_time: '10:00',
  is_available: true
}

const defaultDayAvailability: DayAvailability = {
  day_of_week: 1,
  is_available: false,
  time_slots: []
}

export function AvailabilityManager({
  nutritionistId,
  initialData,
  onSave,
  className
}: AvailabilityManagerProps) {
  const [availability, setAvailability] = useState<AvailabilityData>(() => {
    if (initialData) return initialData
    
    return {
      nutritionist_id: nutritionistId,
      weekly_schedule: daysOfWeek.map(day => ({
        ...defaultDayAvailability,
        day_of_week: day.value
      })),
      consultation_duration: 60,
      price_per_consultation: 150,
      break_between_consultations: 15,
      max_advance_booking_days: 30,
      notes: '',
      is_active: true
    }
  })

  const [isSaving, setIsSaving] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const updateAvailability = (updates: Partial<AvailabilityData>) => {
    setAvailability(prev => ({ ...prev, ...updates }))
  }

  const updateDayAvailability = (dayOfWeek: number, updates: Partial<DayAvailability>) => {
    setAvailability(prev => ({
      ...prev,
      weekly_schedule: prev.weekly_schedule.map(day =>
        day.day_of_week === dayOfWeek ? { ...day, ...updates } : day
      )
    }))
  }

  const addTimeSlot = (dayOfWeek: number) => {
    const day = availability.weekly_schedule.find(d => d.day_of_week === dayOfWeek)
    if (!day) return

    const lastSlot = day.time_slots[day.time_slots.length - 1]
    const newSlot: TimeSlot = {
      ...defaultTimeSlot,
      start_time: lastSlot ? lastSlot.end_time : '09:00',
      end_time: lastSlot ? 
        format(new Date(`2000-01-01T${lastSlot.end_time}:00`).getTime() + 60 * 60 * 1000, 'HH:mm') :
        '10:00'
    }

    updateDayAvailability(dayOfWeek, {
      time_slots: [...day.time_slots, newSlot]
    })
  }

  const removeTimeSlot = (dayOfWeek: number, slotIndex: number) => {
    const day = availability.weekly_schedule.find(d => d.day_of_week === dayOfWeek)
    if (!day) return

    updateDayAvailability(dayOfWeek, {
      time_slots: day.time_slots.filter((_, index) => index !== slotIndex)
    })
  }

  const updateTimeSlot = (dayOfWeek: number, slotIndex: number, updates: Partial<TimeSlot>) => {
    const day = availability.weekly_schedule.find(d => d.day_of_week === dayOfWeek)
    if (!day) return

    updateDayAvailability(dayOfWeek, {
      time_slots: day.time_slots.map((slot, index) =>
        index === slotIndex ? { ...slot, ...updates } : slot
      )
    })
  }

  const copyScheduleToAllDays = (sourceDayOfWeek: number) => {
    const sourceDay = availability.weekly_schedule.find(d => d.day_of_week === sourceDayOfWeek)
    if (!sourceDay) return

    setAvailability(prev => ({
      ...prev,
      weekly_schedule: prev.weekly_schedule.map(day => ({
        ...day,
        is_available: sourceDay.is_available,
        time_slots: [...sourceDay.time_slots]
      }))
    }))

    toast.success('Horários copiados para todos os dias!')
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(availability)
      toast.success('Disponibilidade salva com sucesso!')
    } catch (error) {
      toast.error('Erro ao salvar disponibilidade')
      console.error('Error saving availability:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Configurações gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Configurações Gerais</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Duração da consulta (min)</Label>
              <Input
                type="number"
                value={availability.consultation_duration}
                onChange={(e) => updateAvailability({ consultation_duration: parseInt(e.target.value) || 60 })}
                min="15"
                max="180"
                step="15"
              />
            </div>
            <div className="space-y-2">
              <Label>Preço por consulta (R$)</Label>
              <Input
                type="number"
                value={availability.price_per_consultation}
                onChange={(e) => updateAvailability({ price_per_consultation: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label>Intervalo entre consultas (min)</Label>
              <Input
                type="number"
                value={availability.break_between_consultations}
                onChange={(e) => updateAvailability({ break_between_consultations: parseInt(e.target.value) || 0 })}
                min="0"
                max="60"
                step="5"
              />
            </div>
            <div className="space-y-2">
              <Label>Agendamento antecipado (dias)</Label>
              <Input
                type="number"
                value={availability.max_advance_booking_days}
                onChange={(e) => updateAvailability({ max_advance_booking_days: parseInt(e.target.value) || 30 })}
                min="1"
                max="365"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Informações adicionais sobre sua disponibilidade..."
              value={availability.notes || ''}
              onChange={(e) => updateAvailability({ notes: e.target.value })}
              rows={3}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              checked={availability.is_active}
              onCheckedChange={(checked) => updateAvailability({ is_active: checked })}
            />
            <Label>Agenda ativa para agendamentos</Label>
          </div>
        </CardContent>
      </Card>

      {/* Horários semanais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5" />
            <span>Horários Semanais</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {daysOfWeek.map((dayInfo) => {
            const daySchedule = availability.weekly_schedule.find(d => d.day_of_week === dayInfo.value)
            if (!daySchedule) return null

            return (
              <div key={dayInfo.value} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={daySchedule.is_available}
                      onCheckedChange={(checked) => updateDayAvailability(dayInfo.value, { is_available: checked })}
                    />
                    <Label className="text-lg font-medium">{dayInfo.label}</Label>
                    {daySchedule.is_available && (
                      <Badge variant="outline">
                        {daySchedule.time_slots.length} horário(s)
                      </Badge>
                    )}
                  </div>
                  
                  {daySchedule.is_available && (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addTimeSlot(dayInfo.value)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar horário
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyScheduleToAllDays(dayInfo.value)}
                      >
                        Copiar para todos
                      </Button>
                    </div>
                  )}
                </div>

                {daySchedule.is_available && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ml-8">
                    {daySchedule.time_slots.map((slot, slotIndex) => (
                      <div key={slotIndex} className="flex items-center space-x-2 p-3 border rounded-lg">
                        <div className="flex-1 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="time"
                              value={slot.start_time}
                              onChange={(e) => updateTimeSlot(dayInfo.value, slotIndex, { start_time: e.target.value })}
                            />
                            <Input
                              type="time"
                              value={slot.end_time}
                              onChange={(e) => updateTimeSlot(dayInfo.value, slotIndex, { end_time: e.target.value })}
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={slot.is_available}
                              onCheckedChange={(checked) => updateTimeSlot(dayInfo.value, slotIndex, { is_available: checked })}
                              size="sm"
                            />
                            <Label className="text-sm">Disponível</Label>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTimeSlot(dayInfo.value, slotIndex)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {dayInfo.value < 6 && <Separator />}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Botão de salvar */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center space-x-2"
        >
          <Save className="h-4 w-4" />
          <span>{isSaving ? 'Salvando...' : 'Salvar Disponibilidade'}</span>
        </Button>
      </div>
    </div>
  )
}

export default AvailabilityManager