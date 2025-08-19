import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { withErrorHandling } from '@/lib/api-middleware'
import { validateAuth } from '@/src/lib/middleware/error-handler'
import { addDays, format, parseISO, isAfter, isBefore, addMinutes } from 'date-fns'
import { z } from 'zod'
import { createClient } from '../../../../lib/supabase/server'

// Schema de validação
const availableTimesQuerySchema = z.object({
  nutritionistId: z.string().uuid('ID do nutricionista inválido'),
  startDate: z.string().optional(),
  endDate: z.string().optional()
})

// GET /api/teleconsulta/horarios-disponiveis - Buscar horários disponíveis
export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = await createClient()
  
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
  .eq('id', nutritionistId)
  .single()
  
  if (nutritionistError || !nutritionist) {
    throw new Error('Nutricionista não encontrado')
  }

  // Buscar disponibilidade do nutricionista
  const { data: availability, error: availabilityError } = await supabase
  .from('nutritionist_availability')
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
    // .gte('scheduled_at', start.toISOString())
  // .lte('scheduled_at', end.toISOString())

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
  console.log("🚀 ~ availableSlots:", availableSlots)

  return NextResponse.json({ availableSlots })
})

type RawAvailability = Record<string, any>;
type Booked = { scheduled_at: string; duration_minutes: number };

function getField<T=any>(obj: any, keys: string[], def?: T): T {
  for (const k of keys) if (k in obj) return obj[k];
  return def as T;
}
function normWeekday(v: number) {
  // aceita 0..6 (dom..sáb) ou 1..7 (seg..dom)
  if (v >= 1 && v <= 7) return v % 7;      // 7 -> 0
  if (v >= 0 && v <= 6) return v;
  throw new Error(`weekday inválido: ${v}`);
}
function parseHM(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return { h, m };
}
function setUTCYMD(date: Date, h: number, m: number) {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    h, m, 0, 0
  ));
}
function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return Math.max(aStart, bStart) < Math.min(aEnd, bEnd); // [start,end)
}

export function generateAvailableSlots(
  availabilityRows: RawAvailability[],
  bookedSessions: Booked[],
  start: Date,
  end: Date
) {
  // 1) normaliza disponibilidade
  const availability = (availabilityRows ?? [])
    .filter(r => getField(r, ['is_available', 'available'], true))
    .map(r => {
      const weekdayRaw = getField<number>(r, ['weekday', 'day_of_week', 'week_day', 'day']);
      const startStr = getField<string>(r, ['start_time', 'start', 'from', 'opens_at']);
      const endStr   = getField<string>(r, ['end_time', 'end', 'to', 'closes_at']);
      const dur      = getField<number>(r, ['slot_duration_minutes', 'slot_duration', 'duration_minutes'], 60);
      if (weekdayRaw == null || !startStr || !endStr) return null;
      return {
        weekday: normWeekday(Number(weekdayRaw)),
        start_time: startStr,
        end_time: endStr,
        slot_duration_minutes: Number(dur),
      };
    })
    .filter(Boolean) as { weekday: number; start_time: string; end_time: string; slot_duration_minutes: number; }[];

  // 2) normaliza agendamentos [start,end) em ms UTC
  const bookedRanges = (bookedSessions ?? []).map(b => {
    const s = new Date(b.scheduled_at).getTime();
    const e = s + b.duration_minutes * 60_000;
    return [s, e] as const;
  });

  const slots: Array<{ datetime: string; date: string; time: string; duration: number; available: boolean }> = [];

  // percorre dia a dia em UTC
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const endUTC = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

  while (cursor <= endUTC) {
    const wd = cursor.getUTCDay(); // 0..6 (dom..sáb)
    const rules = availability.filter(a => a.weekday === wd);

    for (const rule of rules) {
      const { h: sh, m: sm } = parseHM(rule.start_time);
      const { h: eh, m: em } = parseHM(rule.end_time);
      const slotMs = rule.slot_duration_minutes * 60_000;

      let slotStart = setUTCYMD(cursor, sh, sm).getTime();
      const dayEnd  = setUTCYMD(cursor, eh, em).getTime();

      while (slotStart + slotMs <= dayEnd) {
        const slotEnd = slotStart + slotMs;
        const busy = bookedRanges.some(([bs, be]) => overlaps(slotStart, slotEnd, bs, be));
        const past = slotStart < Date.now();

        const dt = new Date(slotStart);
        slots.push({
          datetime: dt.toISOString(),                 // UTC
          date: dt.toISOString().slice(0, 10),        // YYYY-MM-DD
          time: dt.toISOString().slice(11, 16),       // HH:mm (UTC -> formate no front p/ fuso do usuário)
          duration: rule.slot_duration_minutes,
          available: !busy && !past,
        });

        slotStart += slotMs;
      }
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return slots.sort((a, b) => a.datetime.localeCompare(b.datetime));
}