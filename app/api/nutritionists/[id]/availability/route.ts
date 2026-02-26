import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { addMinutes, areIntervalsOverlapping, isBefore, parseISO, addDays, startOfDay, endOfDay } from 'date-fns'

export const dynamic = 'force-dynamic'

// Helper constants and functions for Timezone Handling
// We manually handle 'America/Sao_Paulo' (-03:00) to avoid environment-specific Intl issues
const SP_OFFSET_HOURS = -3;
const SP_OFFSET_MS = SP_OFFSET_HOURS * 60 * 60 * 1000;

/**
 * Returns a Date object shifted by the offset, so that UTC methods return local time components.
 * e.g. 23:00 UTC -> 20:00 UTC (which represents 20:00 SP)
 */
function toSaoPaulo(date: Date): Date {
  return new Date(date.getTime() + SP_OFFSET_MS);
}

/**
 * Parses a date string and time string assuming they are in Sao Paulo time,
 * and returns the corresponding UTC Date.
 * e.g. "2026-02-26", "20:00" -> "2026-02-26T20:00:00-03:00" -> 23:00 UTC
 */
function fromSaoPauloStr(dateStr: string, timeStr: string = '00:00:00'): Date {
  // Ensure strict format YYYY-MM-DD and HH:mm:ss
  // Append fixed offset -03:00
  return new Date(`${dateStr}T${timeStr}-03:00`);
}

function formatSaoPauloDate(date: Date): string {
  // Shift to SP time, then take ISO date part (which is YYYY-MM-DD)
  return toSaoPaulo(date).toISOString().split('T')[0];
}

function formatSaoPauloTime(date: Date): string {
  // Shift to SP time, then take ISO time part HH:mm
  return toSaoPaulo(date).toISOString().split('T')[1].substring(0, 5);
}

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

    // 3. Buscar Agendamentos (Teleconsultas) no intervalo
    // DOMAIN RULE: Use teleconsulta_sessions ONLY.
    // Legacy: appointments table is deprecated.
    // Status que ocupam horário: paid, scheduled, in_progress, completed
    const { data: sessions } = await supabase
      .from('teleconsulta_sessions')
      .select('scheduled_at, duration_minutes, status')
      .eq('nutritionist_id', nutritionist.id)
      .in('status', ['paid', 'scheduled', 'in_progress', 'completed'])
      .gte('scheduled_at', startParam)
      .lte('scheduled_at', endParam)

    debug.steps.push({ step: 'sessions_found', count: sessions?.length || 0 })

    // 3b. Buscar Agendamentos Presenciais (Tabela appointments)
    // RE-ENABLED for Presencial Flow. Must block slots.
    const startDateStr = startParam.split('T')[0]
    const endDateStr = endParam.split('T')[0]
    
    const { data: presencialAppointments } = await supabase
      .from('appointments')
      .select('scheduled_at, duration_minutes, appointment_date, appointment_time, status')
      .eq('nutritionist_id', nutritionist.id)
      .in('status', ['agendado', 'confirmed', 'paid', 'completed', 'scheduled']) // Include all blocking statuses
      .not('status', 'eq', 'cancelled')
      .gte('appointment_date', startDateStr)
      .lte('appointment_date', endDateStr)

    debug.steps.push({ step: 'presencial_found', count: presencialAppointments?.length || 0 })

    // Combine blocked sessions
    const blockedIntervals = [
      ...(sessions || []).map(s => ({
        start: parseISO(s.scheduled_at),
        end: addMinutes(parseISO(s.scheduled_at), s.duration_minutes + (nutritionist.min_time_between_appointments || 0))
      })),
      ...(presencialAppointments || []).map(p => {
        let start: Date;
        if (p.scheduled_at) {
          start = parseISO(p.scheduled_at);
        } else {
          // Construct from date/time if scheduled_at is missing (Legacy fallback)
          start = fromSaoPauloStr(p.appointment_date, p.appointment_time);
        }
        return {
          start,
          end: addMinutes(start, (p.duration_minutes || 60) + (nutritionist.min_time_between_appointments || 0))
        };
      })
    ];

    // 4. Gerar Slots
    const generatedSlots: any[] = []
    const defaultDuration = nutritionist.default_consultation_duration || 60
    const minGap = nutritionist.min_time_between_appointments || 0

    // Converter params para Date objects (Input já é ISO UTC ou local, mas vamos tratar como referência)
    const rangeStart = parseISO(startParam)
    const rangeEnd = parseISO(endParam)

    // Iterar dia a dia dentro do range em FUSO SP
    // rangeStart é o início do range em UTC (ou local do request).
    // Precisamos saber qual o dia correspondente em SP.
    const startZoned = toSaoPaulo(rangeStart)
    const endZoned = toSaoPaulo(rangeEnd)
    
    // Normalizar para o início do dia (00:00:00) para iteração, usando UTC Date components que representam SP
    let currentDayIterator = new Date(Date.UTC(startZoned.getUTCFullYear(), startZoned.getUTCMonth(), startZoned.getUTCDate()))
    const endDayLimit = new Date(Date.UTC(endZoned.getUTCFullYear(), endZoned.getUTCMonth(), endZoned.getUTCDate(), 23, 59, 59))

    debug.steps.push({ 
      step: 'iteration_range', 
      startZoned: startZoned.toISOString(), 
      endZoned: endZoned.toISOString()
    })

    // Loop de dias
    // currentDayIterator é um Date que representa 00:00 UTC do dia que queremos processar.
    // Mas conceitualmente ele é "00:00 SP".
    while (currentDayIterator <= endDayLimit) {
      // Dia da semana (0-6) do dia atual
      const weekDay = currentDayIterator.getUTCDay() // 0=Dom, 1=Seg...
      
      // Encontrar regras para este dia
      const dayRules = rules.filter((r: AvailabilityRule) => {
        // Normalizar day_of_week do banco (se for 1-7 ou 0-6)
        // Assumindo 0-6 compatível com JS. Se banco usar 1=Dom, ok. Se 1=Seg, ajustar.
        // O padrão costuma ser 0=Dom.
        return Number(r.day_of_week) === weekDay
      })

      for (const rule of dayRules) {
        // currentDayIterator é "YYYY-MM-DD 00:00:00 UTC" que mapeia para o dia em questão
        const yyyy = currentDayIterator.getUTCFullYear()
        const mm = String(currentDayIterator.getUTCMonth() + 1).padStart(2, '0')
        const dd = String(currentDayIterator.getUTCDate()).padStart(2, '0')
        const dateStr = `${yyyy}-${mm}-${dd}`
        
        // Criar datas de inicio e fim da REGRA em SP, usando construção manual
        // Isso gera o timestamp UTC correto (ex: 23:00 UTC anterior ou XX:00 UTC atual)
        const slotStartUTC = fromSaoPauloStr(dateStr, rule.start_time)
        const ruleEndUTC = fromSaoPauloStr(dateStr, rule.end_time)
        
        let currentSlotStart = slotStartUTC
        const slotDuration = (rule.slot_duration_minutes || defaultDuration)
        const step = slotDuration + minGap
        const toleranceMinutes = 30 // Allow slots to exceed rule end time by up to 30 mins
        
        // Use a minute counter to generate time strings strictly from rule.start_time
        // This avoids any Date object timezone formatting issues (e.g. 20:00 -> 23:00)
        let minutesFromStart = 0;

        function addMinutesToTimeString(baseTime: string, minutesToAdd: number): string {
          const [hh, mm] = baseTime.split(':').map(Number);
          const totalMinutes = hh * 60 + mm + minutesToAdd;
          const newHH = Math.floor(totalMinutes / 60) % 24;
          const newMM = totalMinutes % 60;
          return `${String(newHH).padStart(2, '0')}:${String(newMM).padStart(2, '0')}`;
        }

        while (addMinutes(currentSlotStart, slotDuration) <= addMinutes(ruleEndUTC, toleranceMinutes)) {
          const slotEndUTC = addMinutes(currentSlotStart, slotDuration)
          
          // Generate strict time string
          const timeString = addMinutesToTimeString(rule.start_time, minutesFromStart);

          // Verificar sobreposição com o range solicitado (apenas para não retornar slots fora do pedido)
          if (areIntervalsOverlapping(
            { start: currentSlotStart, end: slotEndUTC },
            { start: rangeStart, end: rangeEnd }
          )) {
            const isBlocked = blockedIntervals.some(interval => {
              return areIntervalsOverlapping(
                { start: currentSlotStart, end: slotEndUTC },
                interval
              )
            })

            // Debug log for specific slot issues
            if (process.env.NODE_ENV !== 'production' || timeString === '20:00' || timeString === '23:00') {
              console.log(`[SlotGen] RuleStart=${rule.start_time} Mins=${minutesFromStart} -> TimeStr=${timeString} | DateISO=${currentSlotStart.toISOString()}`);
            }

            generatedSlots.push({
              datetime: currentSlotStart.toISOString(),
              date: formatSaoPauloDate(currentSlotStart),
              time: timeString, // Use the strictly calculated string
              duration: slotDuration,
              available: !isBlocked,
              has_collision: isBlocked
            })
          }

          currentSlotStart = addMinutes(currentSlotStart, step)
          minutesFromStart += step
        }
      }

      // Avançar para o próximo dia
      currentDayIterator = addDays(currentDayIterator, 1)
    }

    // Ordenar slots por data/hora
    generatedSlots.sort((a, b) => a.datetime.localeCompare(b.datetime))

    return NextResponse.json({
      ok: true,
      timezone: 'America/Sao_Paulo',
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
