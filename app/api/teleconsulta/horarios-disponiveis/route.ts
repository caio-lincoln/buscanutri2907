import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/api-middleware'
import { validateAuth } from '@/src/lib/middleware/error-handler'
import { addDays } from 'date-fns'
import { z } from 'zod'
import { createClient } from '../../../../lib/supabase/server'

export const dynamic = 'force-dynamic'

const availableTimesQuerySchema = z.object({
  nutritionistId: z.string().uuid('ID do nutricionista inválido'),
  startDate: z.string().optional(),
  endDate: z.string().optional()
})

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

export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  validateAuth(authError ? null : user?.id || null)

  const { searchParams } = new URL(request.url)
  const queryParams = {
    nutritionistId: searchParams.get('nutritionistId'),
    startDate: searchParams.get('startDate'),
    endDate: searchParams.get('endDate')
  }

  const { nutritionistId, startDate, endDate } = availableTimesQuerySchema.parse(queryParams)

  // Parse start/end dates ensuring we get the correct range in America/Sao_Paulo
  // startDate comes as "YYYY-MM-DD" or ISO string. We need YYYY-MM-DD.
  const now = new Date();
  const startYMD = startDate 
    ? startDate.split('T')[0] 
    : formatSaoPauloDate(now)
    
  const endYMD = endDate 
    ? endDate.split('T')[0] 
    : addDays(new Date(), 14).toISOString().split('T')[0]

  // Create range boundaries: Start of day and End of day in SP
  // These are UTC timestamps representing 00:00 SP and 23:59:59 SP
  const start = fromSaoPauloStr(startYMD, '00:00:00')
  const end = fromSaoPauloStr(endYMD, '23:59:59')

  const { data: nutritionist, error: nutritionistError } = await supabase
  .from('nutritionist_profiles')
  .select('id, user_id, default_consultation_duration, min_time_between_appointments')
  .eq('id', nutritionistId)
  .single()

  if (nutritionistError || !nutritionist) {
    throw new Error('Nutricionista não encontrado')
  }

  const { data: availability, error: availabilityError } = await supabase
    .from('nutritionist_availability')
    .select('*')
    .eq('nutritionist_id', nutritionist.id)
    .eq('is_available', true)

  if (availabilityError) {
    throw new Error('Erro ao buscar disponibilidade')
  }

  // DOMAIN RULE: Use teleconsulta_sessions ONLY.
  // Legacy: appointments table is deprecated.
  const { data: bookedSessions, error: sessionsError } = await supabase
    .from('teleconsulta_sessions')
    .select('scheduled_at, duration_minutes')
    .eq('nutritionist_id', nutritionist.id)
    .in('status', ['paid', 'scheduled', 'in_progress', 'completed']) // Valid statuses that block slots
  
  if (sessionsError) {
    console.error('Error fetching teleconsulta_sessions:', sessionsError)
    throw new Error('Erro ao buscar sessões agendadas')
  }

  const availableSlots = generateAvailableSlots(
    availability || [],
    bookedSessions || [],
    start,
    end,
    nutritionist.default_consultation_duration || 60,
    nutritionist.min_time_between_appointments ?? 0
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
const gcd = (a: number, b: number) => {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { const t = b; b = a % b; a = t; }
  return a || 1;
};
function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
}

export function generateAvailableSlots(
  availabilityRows: RawAvailability[],
  bookedSessions: Booked[],
  start: Date,
  end: Date,
  defaultDurationMinutes: number,   
  minGapMinutes: number            
) {
  const availability = (availabilityRows ?? [])
    .filter(r => getField(r, [ 'is_available', 'available' ], true))
    .map(r => {
      const weekdayRaw = getField<number>(r, [ 'weekday', 'day_of_week', 'week_day', 'day' ]);
      let startStr = getField<string>(r, [ 'start_time', 'start', 'from', 'opens_at' ]); // "HH:mm"
      let endStr = getField<string>(r, [ 'end_time', 'end', 'to', 'closes_at' ]);      // "HH:mm"
      const dur = getField<number>(r, [ 'slot_duration_minutes', 'slot_duration', 'duration_minutes' ], defaultDurationMinutes);
      
      if (weekdayRaw == null || !startStr || !endStr) return null;

      // Sanitização de horário: garantir formato HH:mm
      const startParts = startStr.split(':');
      const endParts = endStr.split(':');
      
      if (startParts.length >= 2) {
        startStr = `${startParts[0].padStart(2, '0')}:${startParts[1].padStart(2, '0')}`;
      }
      if (endParts.length >= 2) {
        endStr = `${endParts[0].padStart(2, '0')}:${endParts[1].padStart(2, '0')}`;
      }
      
      return {
        weekday: normWeekday(Number(weekdayRaw)),
        start_time: startStr,
        end_time: endStr,
        slot_duration_minutes: Number(dur) || defaultDurationMinutes || 60,
      };
    })
    .filter(Boolean) as { weekday: number; start_time: string; end_time: string; slot_duration_minutes: number; }[];

  const gapMs = (Number(minGapMinutes) || 0) * 60_000;
  const bookedRanges = (bookedSessions ?? []).map(b => {
    const s = new Date(b.scheduled_at).getTime();
    const e = s + b.duration_minutes * 60_000;
    return [ s, e + gapMs ] as const; 
  });

  const slots: Array<{ datetime: string; date: string; time: string; duration: number; available: boolean }> = [];

  // Convert start/end to "Local" Date objects for iteration
  // We want to iterate by day in SP time
  // startInZone should be a Date object where getDate() returns the SP day
  const startInZone = toSaoPaulo(start);
  const endInZone = toSaoPaulo(end);

  const cursor = new Date(startInZone.getFullYear(), startInZone.getMonth(), startInZone.getDate());
  const endLocal = new Date(endInZone.getFullYear(), endInZone.getMonth(), endInZone.getDate());

  while (cursor <= endLocal) {
    const wd = cursor.getDay(); 
    const rules = availability.filter(a => a.weekday === wd);

    for (const rule of rules) {
      const durationMin = rule.slot_duration_minutes;
      const durationMs = durationMin * 60_000;

      const stepMin = gcd(durationMin, minGapMinutes || durationMin);
      const stepMs = stepMin * 60_000;

      const yyyy = cursor.getFullYear();
      const mm = String(cursor.getMonth() + 1).padStart(2, '0');
      const dd = String(cursor.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      
      // FIX CRITICO: Construção manual do offset para garantir SP (-03:00)
      const isoWithOffset = `${dateStr}T${rule.start_time}:00-03:00`
      const startRuleInSP = new Date(isoWithOffset)
      
      let slotStart = startRuleInSP.getTime();
      const dayEnd = new Date(`${dateStr}T${rule.end_time}:00-03:00`).getTime();

      while (slotStart + durationMs <= dayEnd) {
        const slotEnd = slotStart + durationMs;

        const collides = bookedRanges.some(([ bs, be ]) => overlaps(slotStart, slotEnd, bs, be));
        
        const past = slotStart <= Date.now();

        const dt = new Date(slotStart);
        slots.push({
          datetime: dt.toISOString(), 
          date: formatSaoPauloDate(dt),         
          time: formatSaoPauloTime(dt),          
          duration: durationMin,
          available: !collides, 
          is_past: past,
          has_collision: collides
        } as any);

        slotStart += stepMs;
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return slots.sort((a, b) => a.datetime.localeCompare(b.datetime));
}
