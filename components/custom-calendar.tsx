'use client'

import React from 'react'
import * as ReactAll from 'react'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CustomCalendarProps {
  selectedDate: Date | undefined
  onSelectDate: (date: Date | undefined) => void
  initialMonth?: Date
  disablePastDates?: boolean
  disableWeekends?: boolean
  showAvailabilityIndicator?: boolean
}

export function CustomCalendar({
  selectedDate,
  onSelectDate,
  initialMonth = new Date(),
  disablePastDates = true,
  disableWeekends = false,
  showAvailabilityIndicator = true,
}: CustomCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(initialMonth)
  const [calendarDays, setCalendarDays] = React.useState<Date[]>([])

  React.useEffect(() => {
    generateCalendarDays()
  }, [currentMonth])

  const generateCalendarDays = React.useCallback(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start, end })

    // Adicionar dias do mês anterior para completar a primeira semana
    const startWeekDay = start.getDay() // 0 for Sunday, 1 for Monday, etc.
    const previousMonthDays = []
    for (let i = startWeekDay - 1; i >= 0; i--) {
      const day = new Date(start)
      day.setDate(day.getDate() - (i + 1))
      previousMonthDays.push(day)
    }

    // Adicionar dias do próximo mês para completar a última semana
    const endWeekDay = end.getDay()
    const nextMonthDays = []
    for (let i = 1; i <= 6 - endWeekDay; i++) {
      const day = new Date(end)
      day.setDate(day.getDate() + i)
      nextMonthDays.push(day)
    }

    setCalendarDays([...previousMonthDays, ...days, ...nextMonthDays])
  }, [currentMonth])

  const isDateDisabled = (date: Date) => {
    const today = startOfDay(new Date())
    if (disablePastDates && isBefore(date, today) && !isSameDay(date, today))
      return true
    if (disableWeekends && (date.getDay() === 0 || date.getDay() === 6))
      return true // Domingo (0) e Sábado (6)
    return false
  }

  const isDateAvailable = (date: Date) => {
    // Esta é uma simulação. Em uma aplicação real, você buscaria a disponibilidade do backend.
    // Por exemplo, se o dia da semana for de segunda a sexta.
    const dayOfWeek = date.getDay()
    return dayOfWeek >= 1 && dayOfWeek <= 5 // Segunda a Sexta
  }

  const getDateStatus = (date: Date) => {
    if (isDateDisabled(date)) return 'disabled'
    if (!isSameMonth(date, currentMonth)) return 'outside'
    if (selectedDate && isSameDay(date, selectedDate)) return 'selected'
    if (isToday(date)) return 'today'
    if (showAvailabilityIndicator && isDateAvailable(date)) return 'available'
    return 'unavailable'
  }

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const handleDayClick = (date: Date) => {
    if (getDateStatus(date) === 'disabled' || getDateStatus(date) === 'outside')
      return
    onSelectDate(date)
  }

  return (
    <div className="space-y-4">
      {/* Header do Calendário */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={previousMonth}
            className="text-white hover:bg-white/20 p-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <h3 className="text-lg font-semibold">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h3>

          <Button
            variant="ghost"
            size="sm"
            onClick={nextMonth}
            className="text-white hover:bg-white/20 p-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Dias da Semana */}
      <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-600">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="p-2">
            {day}
          </div>
        ))}
      </div>

      {/* Dias do Calendário */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          const status = getDateStatus(date)
          return (
            <button
              key={index}
              onClick={() => handleDayClick(date)}
              disabled={status === 'disabled' || status === 'outside'}
              className={cn(
                'p-2 text-sm rounded-lg transition-all duration-200 hover:scale-105 relative',
                {
                  // Data selecionada
                  'bg-gradient-to-r from-green-500 to-green-600 text-white font-bold shadow-lg':
                    status === 'selected',

                  // Data de hoje
                  'bg-blue-100 text-blue-700 font-semibold ring-2 ring-blue-300':
                    status === 'today' && status !== 'selected',

                  // Datas disponíveis
                  'hover:bg-green-50 hover:text-green-700 text-gray-700':
                    status === 'available',

                  // Datas indisponíveis
                  'text-gray-400 cursor-not-allowed': status === 'unavailable',

                  // Datas desabilitadas
                  'text-gray-300 cursor-not-allowed': status === 'disabled',

                  // Datas fora do mês
                  'text-gray-300 cursor-not-allowed': status === 'outside',
                }
              )}
            >
              {format(date, 'd')}

              {/* Indicador de disponibilidade */}
              {showAvailabilityIndicator && status === 'available' && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-400 rounded-full"></div>
              )}

              {/* Indicador de hoje */}
              {status === 'today' && status !== 'selected' && (
                <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </button>
          )
        })}
      </div>

      {/* Legenda */}
      {showAvailabilityIndicator && (
        <div className="flex flex-wrap gap-4 text-xs text-gray-600 pt-2 border-t">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-green-600 rounded"></div>
            <span>Selecionado</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-100 rounded"></div>
            <span>Hoje</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-50 border border-green-200 rounded"></div>
            <span>Disponível</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-200 rounded"></div>
            <span>Indisponível</span>
          </div>
        </div>
      )}
    </div>
  )
}
