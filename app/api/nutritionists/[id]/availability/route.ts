import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { addMinutes, areIntervalsOverlapping, isBefore, parseISO, addDays, startOfDay, endOfDay } from 'date-fns'
import { fromZonedTime, toZonedTime, format as formatTz } from 'date-fns-tz'

export const dynamic = 'force-dynamic'

const TIMEZONE = 'America/Sao_Paulo'

interface AvailabilityRule {
  id: string
  day_of_week: number
  start_time: string // "08:00"
  end_time: string   // "17:00"
  slot_duration_minutes?: number
  is_available: boolean
}

interface Appointment {
  scheduled_at: string
  duration_minutes: number
  status: string
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  const nutritionistId = params.id
  const { searchParams } = new URL(request.url)
  const startParam = searchParams.get('start')
  const endParam = searchParams.get('end')

  // Debug collector
  const debug: any = {
    params: { nutritionistId, startParam, endParam },
    steps: []
  }

  try {
    if (!nutritionistId || !startParam || !endParam) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Identificar Nutricionista
    // Tenta primeiro por user_id (padrão do sistema)
    let { data: nutritionist, error: nutError } = await supabase
      .from('nutritionist_profiles')
      .select('id, user_id, default_consultation_duration, min_time_between_appointments')
      .eq('user_id', nutritionistId)
      .single()

    // Fallback: tenta pelo ID da tabela
    if (!nutritionist) {
      const { data: altNut } = await supabase
        .from('nutritionist_profiles')
        .select('id, user_id, default_consultation_duration, min_time_between_appointments')
        .eq('id', nutritionistId)
        .single()
      nutritionist = altNut
    }

    if (!nutritionist) {
      return NextResponse.json({ error: 'Nutritionist not found' }, { status: 404 })
    }

    debug.steps.push({ step: 'nutritionist_found', id: nutritionist.id })

    // 2. Buscar Regras de Disponibilidade
    const { data: rules } = await supabase
      .from('nutritionist_availability')
      .select('*')
      .eq('nutritionist_id', nutritionist.id)
      .eq('is_available', true)

    if (!rules || rules.length === 0) {
      return NextResponse.json({ slots: [], debug: process.env.NODE_ENV !== 'production' ? debug : undefined })
    }

    debug.steps.push({ step: 'rules_found', count: rules.length })

    // 3. Buscar Agendamentos (Appointments) no intervalo
    // Status que ocupam horário: paid, scheduled, in_progress, pending_payment
    const { data: appointments } = await supabase
      .from('appointments')
      .select('scheduled_at, duration_minutes, status')
      .eq('nutritionist_id', nutritionist.id)
      .in('status', ['paid', 'scheduled', 'in_progress', 'pending_payment'])
      .gte('scheduled_at', startParam)
      .lte('scheduled_at', endParam)
      .is('is_deleted', false) // Excluir deletados logicamente

    debug.steps.push({ step: 'appointments_found', count: appointments?.length || 0 })

    // 4. Gerar Slots
    const generatedSlots: any[] = []
    const defaultDuration = nutritionist.default_consultation_duration || 60
    const minGap = nutritionist.min_time_between_appointments || 0

    // Converter params para Date objects
    const rangeStart = parseISO(startParam)
    const rangeEnd = parseISO(endParam)

    // Iterar dia a dia dentro do range
    // Para garantir cobertura correta, vamos iterar sobre os dias no fuso SP
    // Converter rangeStart para SP para saber o dia inicial
    const startZoned = toZonedTime(rangeStart, TIMEZONE)
    const endZoned = toZonedTime(rangeEnd, TIMEZONE)
    
    // Normalizar para o início do dia para iteração
    let currentDayIterator = startOfDay(startZoned)
    const endDayLimit = endOfDay(endZoned)

    debug.steps.push({ 
      step: 'iteration_range', 
      startZoned: formatTz(startZoned, 'yyyy-MM-dd HH:mm', { timeZone: TIMEZONE }), 
      endZoned: formatTz(endZoned, 'yyyy-MM-dd HH:mm', { timeZone: TIMEZONE })
    })

    while (currentDayIterator <= endDayLimit) {
      // Dia da semana (0-6)
      const weekDay = currentDayIterator.getDay() // 0=Dom, 1=Seg...
      
      // Encontrar regras para este dia
      const dayRules = rules.filter((r: AvailabilityRule) => {
        // Normalizar day_of_week do banco (se for 1-7 ou 0-6)
        // Assumindo 0-6 compatível com JS. Se banco usar 1=Dom, ok. Se 1=Seg, ajustar.
        // O padrão costuma ser 0=Dom.
        return Number(r.day_of_week) === weekDay
      })

      for (const rule of dayRules) {
        const [startHour, startMinute] = rule.start_time.split(':').map(Number)
        const [endHour, endMinute] = rule.end_time.split(':').map(Number)
        
        // Construir data base para o slot no fuso SP
        // currentDayIterator já está "ancorado" no dia correto (mas cuidado com horas)
        // Use toISOString() to extract YYYY-MM-DD from the shifted date
        // formatTz would shift it again, causing wrong date
        const dateStr = currentDayIterator.toISOString().split('T')[0]
        
        // Criar datas de inicio e fim da REGRA em SP
        // date-fns-tz fromZonedTime converte "2023-10-27 08:00" (SP) -> UTC
        const ruleStartUTC = fromZonedTime(`${dateStr} ${rule.start_time}`, TIMEZONE)
        const ruleEndUTC = fromZonedTime(`${dateStr} ${rule.end_time}`, TIMEZONE)
        
        let slotStartUTC = ruleStartUTC
        const slotDuration = (rule.slot_duration_minutes || defaultDuration)
        const step = slotDuration + minGap
        const toleranceMinutes = 30 // Allow slots to exceed rule end time by up to 30 mins

        while (addMinutes(slotStartUTC, slotDuration) <= addMinutes(ruleEndUTC, toleranceMinutes)) {
          const slotEndUTC = addMinutes(slotStartUTC, slotDuration)

          if (areIntervalsOverlapping(
            { start: slotStartUTC, end: slotEndUTC },
            { start: rangeStart, end: rangeEnd }
          )) {
            const isBlocked = appointments?.some(app => {
              const appStart = parseISO(app.scheduled_at)
              const appEnd = addMinutes(appStart, app.duration_minutes + minGap)
              return areIntervalsOverlapping(
                { start: slotStartUTC, end: slotEndUTC },
                { start: appStart, end: appEnd }
              )
            })

            generatedSlots.push({
              datetime: slotStartUTC.toISOString(),
              date: dateStr,
              time: formatTz(slotStartUTC, 'HH:mm', { timeZone: TIMEZONE }),
              duration: slotDuration,
              available: !isBlocked,
              has_collision: isBlocked
            })
          }

          slotStartUTC = addMinutes(slotStartUTC, step)
        }
      }

      // Avançar para o próximo dia
      currentDayIterator = addDays(currentDayIterator, 1)
    }

    // Ordenar slots por data/hora
    generatedSlots.sort((a, b) => a.datetime.localeCompare(b.datetime))

    return NextResponse.json({
      ok: true,
      timezone: TIMEZONE,
      range: { start: startParam, end: endParam },
      slots: generatedSlots,
      debug: process.env.NODE_ENV !== 'production' ? debug : undefined
    })

  } catch (error: any) {
    console.error('Error fetching availability:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    )
  }
}
