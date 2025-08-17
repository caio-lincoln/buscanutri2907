import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { withErrorHandling } from '@/lib/api-middleware'
import { validateAuth } from '@/src/lib/middleware/error-handler'
import { addDays, format, parseISO, isAfter, isBefore, addMinutes } from 'date-fns'
import { z } from 'zod'

// Schema de validação
const availableTimesQuerySchema = z.object({
  nutritionistId: z.string().uuid('ID do nutricionista inválido'),
  startDate: z.string().optional(),
  endDate: z.string().optional()
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
    nutritionistId: searchParams.get('nutritionistId'),
    startDate: searchParams.get('startDate'),
    endDate: searchParams.get('endDate')
  }

  // Validar parâmetros de query
  const { nutritionistId, startDate, endDate } = availableTimesQuerySchema.parse(queryParams)
  
  // Definir datas padrão se não fornecidas
  const start = startDate ? parseISO(startDate) : new Date()
  const end = endDate ? parseISO(endDate) : addDays(new Date(), 14)

  // Buscar perfil do nutricionista
  const { data: nutritionist, error: nutritionistError } = await supabase
    .from('nutritionist_profiles')
    .select('id, user_id')
    .eq('user_id', nutritionistId)
    .single()

  if (nutritionistError || !nutritionist) {
    throw new Error('Nutricionista não encontrado')
  }

  // Buscar disponibilidade do nutricionista
  const { data: availability, error: availabilityError } = await supabase
    .from('agenda_availability')
    .select('*')
    .eq('nutritionist_id', nutritionist.id)
    .eq('is_available', true)

  if (availabilityError) {
    throw new Error('Erro ao buscar disponibilidade')
  }

  // Buscar teleconsultas já agendadas no período
  const { data: bookedSessions, error: sessionsError } = await supabase
    .from('teleconsulta_sessions')
    .select('scheduled_at, duration_minutes')
    .eq('nutritionist_id', nutritionist.id)
    .in('status', ['scheduled', 'in_progress'])
    .gte('scheduled_at', start.toISOString())
    .lte('scheduled_at', end.toISOString())

  if (sessionsError) {
    throw new Error('Erro ao buscar sessões agendadas')
  }

  // Gerar horários disponíveis
  const availableSlots = generateAvailableSlots(
    availability || [],
    bookedSessions || [],
    start,
    end
  )

  return NextResponse.json({ availableSlots })
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