'use client'

import { useState, useMemo } from 'react'
import { format, addDays, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, isBefore, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { useAvailability, type AvailableSlot } from '@/hooks/useAvailability'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { CalendarIcon, Clock, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { getDayRangeInUTC } from '@/lib/date-utils'

interface CalendarSelectorProps {
  nutritionistId: string
  onSelectSlot: (slot: AvailableSlot) => void
  selectedSlot?: AvailableSlot | null
}

export function CalendarSelector({ nutritionistId, onSelectSlot, selectedSlot }: CalendarSelectorProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }))
  
  // Fetch next 30 days availability to be safe
  // Use timezone-safe range calculation
  const startDate = useMemo(() => getDayRangeInUTC(new Date()).start, [])
  const endDate = useMemo(() => getDayRangeInUTC(addDays(new Date(), 30)).end, [])
  
  const { slots, loading, error, refetch } = useAvailability({ 
    nutritionistId, 
    startDate, 
    endDate 
  })

  // Dev Panel Data
  const devStats = useMemo(() => {
    if (process.env.NODE_ENV === 'production') return null
    
    const totalSlots = slots.length
    const daySlotsCount = slots.filter(s => isSameDay(new Date(s.datetime), selectedDate)).length
    const blockedCount = slots.filter(s => !s.available).length
    
    return {
      totalSlots,
      daySlotsCount,
      blockedCount,
      rangeStart: startDate,
      rangeEnd: endDate,
      selectedDate: selectedDate.toISOString()
    }
  }, [slots, selectedDate, startDate, endDate])

  // Generate days for the current view (Weekly)
  const weekDays = useMemo(() => {
    return eachDayOfInterval({
      start: weekStart,
      end: endOfWeek(weekStart, { weekStartsOn: 0 })
    })
  }, [weekStart])

  // Filter slots for the selected date
  const daySlots = useMemo(() => {
    return slots.filter(slot => {
      const slotDate = new Date(slot.datetime)
      return isSameDay(slotDate, selectedDate) && slot.available
    }).sort((a, b) => a.time.localeCompare(b.time))
  }, [slots, selectedDate])

  // Navigation handlers
  const nextWeek = () => setWeekStart(addDays(weekStart, 7))
  const prevWeek = () => {
    const newDate = addDays(weekStart, -7)
    if (!isBefore(newDate, startOfWeek(new Date(), { weekStartsOn: 0 }))) {
      setWeekStart(newDate)
    }
  }

  // Helper to check if a date has available slots
  const hasSlots = (date: Date) => {
    return slots.some(slot => isSameDay(new Date(slot.datetime), date) && slot.available)
  }

  return (
    <div className="flex flex-col gap-6 bg-card rounded-xl border shadow-sm p-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Selecione a Data
          </h2>
          <p className="text-sm text-muted-foreground">
            {format(weekStart, "MMMM yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={prevWeek} disabled={isBefore(weekStart, startOfWeek(new Date(), { weekStartsOn: 0 }))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Week Calendar */}
      <div className="grid grid-cols-7 gap-2 text-center">
        {weekDays.map((date) => {
          const isSelected = isSameDay(date, selectedDate)
          const isToday = isSameDay(date, new Date())
          const isPast = isBefore(date, startOfDay(new Date()))
          const hasAvailability = hasSlots(date)

          return (
            <button
              key={date.toISOString()}
              disabled={isPast}
              onClick={() => setSelectedDate(date)}
              className={cn(
                "flex flex-col items-center justify-center py-3 rounded-lg transition-all relative group",
                isSelected 
                  ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary ring-offset-2" 
                  : "hover:bg-accent hover:text-accent-foreground",
                isToday && !isSelected && "bg-primary/5 text-primary font-bold",
                isPast && "opacity-30 cursor-not-allowed hover:bg-transparent",
                !isPast && !hasAvailability && !isSelected && "opacity-60 grayscale"
              )}
            >
              <span className="text-[10px] uppercase font-medium mb-1 opacity-80">
                {format(date, 'EEE', { locale: ptBR }).slice(0, 3)}
              </span>
              <span className={cn("text-lg font-bold", isSelected ? "scale-110" : "")}>
                {format(date, 'd')}
              </span>
              
              {/* Availability Dot */}
              {!isPast && hasAvailability && !isSelected && (
                <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-green-500" />
              )}
            </button>
          )
        })}
      </div>

      {/* Slots Section */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Horários disponíveis
          </h3>
          <span className="text-xs text-muted-foreground capitalize">
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </span>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription className="flex justify-between items-center">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        ) : loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : daySlots.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {daySlots.map((slot) => {
              const isSelected = selectedSlot?.datetime === slot.datetime
              return (
                <button
                  key={slot.datetime}
                  onClick={() => onSelectSlot(slot)}
                  className={cn(
                    "relative flex flex-col items-center justify-center py-2.5 px-2 rounded-md border text-sm font-medium transition-all",
                    isSelected 
                      ? "bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary ring-offset-1" 
                      : "bg-background hover:border-primary/50 hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  {slot.time}
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 bg-background text-primary rounded-full p-0.5 shadow-sm border border-primary/20">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
            <Clock className="h-10 w-10 mb-3 opacity-20" />
            <p className="font-medium">Sem horários livres</p>
            <p className="text-xs opacity-70">Tente selecionar outra data acima</p>
          </div>
        )}
      </div>
      {/* Dev Panel */}
      {process.env.NODE_ENV !== 'production' && devStats && (
        <div className="mt-6 p-4 bg-black/5 rounded-lg text-xs font-mono space-y-1 border border-black/10">
          <p className="font-bold text-black/70 mb-2">DEV PANEL (Debug)</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span>Selected Date:</span>
            <span className="text-right">{format(new Date(devStats.selectedDate), 'yyyy-MM-dd HH:mm')}</span>
            
            <span>Range Start:</span>
            <span className="text-right">{format(new Date(devStats.rangeStart), 'yyyy-MM-dd HH:mm')}</span>
            
            <span>Range End:</span>
            <span className="text-right">{format(new Date(devStats.rangeEnd), 'yyyy-MM-dd HH:mm')}</span>
            
            <span>Total Slots Loaded:</span>
            <span className="text-right">{devStats.totalSlots}</span>
            
            <span>Slots for Date:</span>
            <span className="text-right">{devStats.daySlotsCount}</span>
            
            <span>Blocked/Past:</span>
            <span className="text-right">{devStats.blockedCount}</span>
          </div>
        </div>
      )}
    </div>
  )
}
