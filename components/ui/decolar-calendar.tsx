'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface DecolarCalendarProps {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

export function DecolarCalendar({ 
  selected, 
  onSelect, 
  placeholder = "Selecione uma data",
  className 
}: DecolarCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selected || new Date())
  const [isOpen, setIsOpen] = useState(false)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const handleDateSelect = (date: Date) => {
    onSelect?.(date)
    setIsOpen(false)
  }

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  // Calcular os dias vazios no início do mês
  const firstDayOfWeek = monthStart.getDay()
  const emptyDays = Array.from({ length: firstDayOfWeek }, (_, i) => i)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-white border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 rounded-xl shadow-sm",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-3 h-5 w-5 text-blue-500" />
          {selected ? (
            <span className="text-gray-800 font-medium">
              {format(selected, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 shadow-xl border-0" align="start">
        <Card className="border-0 shadow-2xl rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            {/* Header do calendário */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevMonth}
                  className="text-white hover:bg-white/20 rounded-full p-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-lg font-semibold">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNextMonth}
                  className="text-white hover:bg-white/20 rounded-full p-2"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Calendário */}
            <div className="p-4 bg-white">
              {/* Dias da semana */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-gray-500 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Dias do mês */}
              <div className="grid grid-cols-7 gap-1">
                {/* Dias vazios no início */}
                {emptyDays.map((_, index) => (
                  <div key={`empty-${index}`} className="h-10" />
                ))}
                
                {/* Dias do mês */}
                {days.map((day) => {
                  const isSelectedDay = selected && isSameDay(day, selected)
                  const isTodayDay = isToday(day)
                  const isCurrentMonth = isSameMonth(day, currentMonth)

                  return (
                    <Button
                      key={day.toISOString()}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDateSelect(day)}
                      className={cn(
                        "h-10 w-10 p-0 font-normal rounded-full transition-all duration-200",
                        isCurrentMonth ? "text-gray-900" : "text-gray-400",
                        isSelectedDay && "bg-blue-500 text-white hover:bg-blue-600 shadow-lg",
                        !isSelectedDay && isTodayDay && "bg-blue-100 text-blue-600 font-semibold",
                        !isSelectedDay && !isTodayDay && "hover:bg-gray-100",
                        !isCurrentMonth && "opacity-50"
                      )}
                    >
                      {format(day, 'd')}
                    </Button>
                  )
                })}
              </div>

              {/* Footer com botão de hoje */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDateSelect(new Date())}
                  className="w-full text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
                >
                  Hoje
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
