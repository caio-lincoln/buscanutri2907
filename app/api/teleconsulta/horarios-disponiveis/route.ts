import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { withErrorHandling } from '@/lib/api-middleware'
import { requireAuth } from '@/lib/auth-utils'
import { ValidationError } from '@/lib/errors'
import { addDays, format, startOfWeek, endOfWeek, parseISO, isAfter, isBefore, addMinutes } from 'date-fns'
import { z } from 'zod'

// Schema de validação
const availableTimesQuerySchema = z.object({
  nutritionist_id: z.string().uuid('ID do nutricionista inválido'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  duration: z.string().transform(val => parseInt(val)).pipe(z.number().min(15).max(180)).optional()
})

// GET /api/teleconsulta/horarios-disponiveis - Buscar horários disponíveis
export const GET = withErrorHandling(async (request: NextRequest) => {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  validateAuth(authError ? null : user?.id || null)

  const { searchParams } = new URL(request.url)
  const queryParams = {
    nutritionist_id: searchParams.get('nutritionist_id'),
    date: searchParams.get('date')
  }

  // Validar parâmetros de query
  const { nutritionist_id, date } = availableTimesQuerySchema.parse(queryParams)

  // Buscar disponibilidade do nutricionista para o dia
  const dayOfWeek = new Date(date).getDay()
  const { data: availability, error: availabilityError } = await supabase
    .from('nutritionist_availability')
    .select('*')
    .eq('nutritionist_id', nutritionist_id)
    .eq('day_of_week', dayOfWeek)
    .eq('is_available', true)

  if (availabilityError) {
    throw new Error('Erro ao buscar disponibilidade')
  }

  // Buscar teleconsultas já agendadas para o dia
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const { data: bookedSessions, error: sessionsError } = await supabase
    .from('teleconsulta_sessions')
    .select('scheduled_for, duration_minutes')
    .eq('nutritionist_id', nutritionist_id)
    .eq('current_status', 'scheduled')
    .gte('scheduled_for', startOfDay.toISOString())
    .lte('scheduled_for', endOfDay.toISOString())

  if (sessionsError) {
    throw new Error('Erro ao buscar sessões agendadas')
  }

  // Calcular horários disponíveis
  const availableSlots = []
  
  for (const slot of availability) {
    const startTime = new Date(`${date}T${slot.start_time}`)
    const endTime = new Date(`${date}T${slot.end_time}`)
    
    // Gerar slots de 30 em 30 minutos
    let currentTime = new Date(startTime)
    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime.getTime() + 30 * 60000) // 30 minutos
      
      // Verificar se o slot não conflita com sessões agendadas
      const isBooked = bookedSessions.some(session => {
        const sessionStart = new Date(session.scheduled_for)
        const sessionEnd = new Date(sessionStart.getTime() + session.duration_minutes * 60000)
        
        return (
          (currentTime >= sessionStart && currentTime < sessionEnd) ||
          (slotEnd > sessionStart && slotEnd <= sessionEnd) ||
          (currentTime <= sessionStart && slotEnd >= sessionEnd)
        )
      })
      
      if (!isBooked && slotEnd <= endTime) {
        availableSlots.push({
          start_time: currentTime.toISOString(),
          end_time: slotEnd.toISOString()
        })
      }
      
      currentTime = new Date(currentTime.getTime() + 30 * 60000)
    }
  }

  return NextResponse.json({ available_slots: availableSlots })
})

function generateAvailableSlots(
  availability: any[],
  bookedSessions: any[],
  startDate: Date,
  endDate: Date
) {
  const slots: any[] = []
  const slotDuration = 60 // 60 minutos por slot
  
  // Converter sessões agendadas para array de períodos ocupados
  const bookedPeriods = bookedSessions.map(session => ({
    start: parseISO(session.scheduled_at),
    end: addMinutes(parseISO(session.scheduled_at), session.duration_minutes)
  }))

  // Iterar por cada dia no período
  let currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay()
    
    // Buscar disponibilidade para este dia da semana
    const dayAvailability = availability.filter(av => av.day_of_week === dayOfWeek)
    
    dayAvailability.forEach(av => {
      // Converter horários de string para Date
      const [startHour, startMinute] = av.start_time.split(':').map(Number)
      const [endHour, endMinute] = av.end_time.split(':').map(Number)
      
      const slotStart = new Date(currentDate)
      slotStart.setHours(startHour, startMinute, 0, 0)
      
      const slotEnd = new Date(currentDate)
      slotEnd.setHours(endHour, endMinute, 0, 0)
      
      // Gerar slots de 60 minutos dentro do período disponível
      let currentSlot = new Date(slotStart)
      while (addMinutes(currentSlot, slotDuration) <= slotEnd) {
        const slotEndTime = addMinutes(currentSlot, slotDuration)
        
        // Verificar se não está no passado
        if (isAfter(currentSlot, new Date())) {
          // Verificar se não conflita com sessões agendadas
          const isBooked = bookedPeriods.some(period => 
            (isAfter(currentSlot, period.start) && isBefore(currentSlot, period.end)) ||
            (isAfter(slotEndTime, period.start) && isBefore(slotEndTime, period.end)) ||
            (isBefore(currentSlot, period.start) && isAfter(slotEndTime, period.end))
          )
          
          if (!isBooked) {
            slots.push({
              datetime: currentSlot.toISOString(),
              date: format(currentSlot, 'yyyy-MM-dd'),
              time: format(currentSlot, 'HH:mm'),
              duration: slotDuration,
              available: true
            })
          }
        }
        
        currentSlot = addMinutes(currentSlot, slotDuration)
      }
    })
    
    currentDate = addDays(currentDate, 1)
  }
  
  return slots.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
}