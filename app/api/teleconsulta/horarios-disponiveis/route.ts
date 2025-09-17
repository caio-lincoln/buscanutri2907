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
    .in('status', [ 'scheduled', 'in_progress' ])
  // .gte('scheduled_at', start.toISOString())
  // .lte('scheduled_at', end.toISOString())

  if (sessionsError) {
    throw new Error('Erro ao buscar sessões agendadas')
  }

  const availableSlots = generateAvailableSlots(
    availability || [],
    bookedSessions || [],
    start,
    end
  )

  return NextResponse.json({ availableSlots })
})

type RawAvailability = Record<string, any>;
type Booked = { scheduled_at: string; duration_minutes: number };

function getField<T = any>(obj: any, keys: string[], def?: T): T {
  for (const k of keys) if (k in obj) return obj[ k ];
  return def as T;
}
function normWeekday(v: number) {
  if (v >= 1 && v <= 7) return v % 7;
  if (v >= 0 && v <= 6) return v;
  throw new Error(`weekday inválido: ${v}`);
}

export function generateAvailableSlots(
  availabilityRows: RawAvailability[],
  bookedSessions: Booked[],
  start: Date,
  end: Date
) {
  const availability = (availabilityRows ?? [])
    .filter(r => getField(r, [ 'is_available', 'available' ], true))
    .map(r => {
      const weekdayRaw = getField<number>(r, [ 'weekday', 'day_of_week', 'week_day', 'day' ]);
      const startStr = getField<string>(r, [ 'start_time', 'start', 'from', 'opens_at' ]);
      const endStr = getField<string>(r, [ 'end_time', 'end', 'to', 'closes_at' ]);
      const dur = getField<number>(r, [ 'slot_duration_minutes', 'slot_duration', 'duration_minutes' ], 60);
      if (weekdayRaw == null || !startStr || !endStr) return null;
      return {
        weekday: normWeekday(Number(weekdayRaw)),
        start_time: startStr,
        end_time: endStr,
        slot_duration_minutes: Number(dur),
      };
    })
    .filter(Boolean) as { weekday: number; start_time: string; end_time: string; slot_duration_minutes: number; }[];

  const bookedRanges = (bookedSessions ?? []).map(b => {
    const s = new Date(b.scheduled_at).getTime();
    const e = s + b.duration_minutes * 60_000;
    return [ s, e ] as const;
  });

  const pad2 = (n: number) => n.toString().padStart(2, '0');
  const ymdLocal = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const hmLocal = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

  const slots: Array<{ datetime: string; date: string; time: string; duration: number; available: boolean }> = [];

  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());       
  const endLocal = new Date(end.getFullYear(), end.getMonth(), end.getDate());          

  while (cursor <= endLocal) {
    const wd = cursor.getDay(); 
    const rules = availability.filter(a => a.weekday === wd);

    for (const rule of rules) {
      const [ sh, sm ] = rule.start_time.split(':').map(Number);
      const [ eh, em ] = rule.end_time.split(':').map(Number);
      const slotMs = rule.slot_duration_minutes * 60_000;

      let slotStart = new Date(
        cursor.getFullYear(),
        cursor.getMonth(),
        cursor.getDate(),
        sh, sm, 0, 0
      ).getTime();

      const dayEnd = new Date(
        cursor.getFullYear(),
        cursor.getMonth(),
        cursor.getDate(),
        eh, em, 0, 0
      ).getTime();

      while (slotStart + slotMs <= dayEnd) {
        const slotEnd = slotStart + slotMs;

        const busy = bookedRanges.some(([ bs, be ]) => Math.max(slotStart, bs) < Math.min(slotEnd, be));
        const past = slotStart < Date.now();

        const dt = new Date(slotStart);
        slots.push({
          datetime: dt.toISOString(), 
          date: ymdLocal(dt),         
          time: hmLocal(dt),          
          duration: rule.slot_duration_minutes,
          available: !busy && !past,
        });

        slotStart += slotMs;
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return slots.sort((a, b) => a.datetime.localeCompare(b.datetime));
}

