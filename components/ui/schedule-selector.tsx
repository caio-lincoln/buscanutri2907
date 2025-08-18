'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Trash2, Plus } from 'lucide-react'

interface TimeSlot {
  start: string
  end: string
}

interface DaySchedule {
  [ key: string ]: TimeSlot[]
}

interface ScheduleSelectorProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
]

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0')
  return { value: `${hour}:00`, label: `${hour}:00` }
})

export function ScheduleSelector({
  value,
  onChange,
  placeholder,
}: ScheduleSelectorProps) {
  const [ schedule, setSchedule ] = useState<DaySchedule>({})
  const isInitializing = useRef(true)

  // Parse do valor inicial apenas uma vez
  useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value)
        setSchedule(parsed)
      } catch {
        // Se não conseguir fazer parse, inicializa vazio
        setSchedule({})
      }
    }
  }, [ value ])

  // Função para atualizar o schedule e notificar o pai
  const updateSchedule = useCallback(
    (newSchedule: DaySchedule) => {
      setSchedule(newSchedule)
      if (!isInitializing.current) {
        onChange(JSON.stringify(newSchedule))
      }
    },
    [ onChange ]
  )

  const addTimeSlot = (dayKey: string) => {
    if ((schedule[ dayKey ]?.length ?? 0) < 2) {
      const newSchedule = {
        ...schedule,
        [ dayKey ]: [ ...(schedule[ dayKey ] || []), { start: '08:00', end: '17:00' } ],
      }
      updateSchedule(newSchedule)
    }

  }

  const removeTimeSlot = (dayKey: string, index: number) => {
    const newSchedule = {
      ...schedule,
      [ dayKey ]: schedule[ dayKey ]?.filter((_, i) => i !== index) || [],
    }
    updateSchedule(newSchedule)
  }

  const updateTimeSlot = (
    dayKey: string,
    index: number,
    field: 'start' | 'end',
    value: string
  ) => {
    const newSchedule = {
      ...schedule,
      [ dayKey ]:
        schedule[ dayKey ]?.map((slot, i) =>
          i === index ? { ...slot, [ field ]: value } : slot
        ) || [],
    }
    updateSchedule(newSchedule)
  }

  const formatScheduleDisplay = () => {
    const activeDays = Object.entries(schedule).filter(
      ([ _, slots ]) => Array.isArray(slots) && slots.length > 0
    )
    if (activeDays.length === 0) return 'Nenhum horário configurado'

    return activeDays
      .map(([ dayKey, slots ]) => {
        const dayLabel =
          DAYS_OF_WEEK.find(d => d.key === dayKey)?.label || dayKey
        const timesText = Array.isArray(slots)
          ? slots.map(slot => `${slot.start}-${slot.end}`).join(', ')
          : ''
        return `${dayLabel}: ${timesText}`
      })
      .join(' | ')
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-md">
        <strong>Horários configurados:</strong> {formatScheduleDisplay()}
      </div>

      <div className="space-y-4">
        {DAYS_OF_WEEK.map(day => (
          <Card key={day.key} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">{day.label}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addTimeSlot(day.key)}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Adicionar Horário
                </Button>
              </div>

              <div className="space-y-2">
                {schedule[ day.key ]?.map((slot, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <Select
                        value={slot.start}
                        onValueChange={value =>
                          updateTimeSlot(day.key, index, 'start', value)
                        }
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HOURS.map(hour => (
                            <SelectItem key={hour.value} value={hour.value}>
                              {hour.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <span className="text-sm text-gray-500">até</span>

                      <Select
                        value={slot.end}
                        onValueChange={value =>
                          updateTimeSlot(day.key, index, 'end', value)
                        }
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HOURS.map(hour => (
                            <SelectItem key={hour.value} value={hour.value}>
                              {hour.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeTimeSlot(day.key, index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )) || (
                    <div className="text-sm text-gray-500 italic">
                      Nenhum horário configurado para este dia
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
