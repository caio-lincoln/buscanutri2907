import { createSupabaseClient } from './supabase'

const supabase = createSupabaseClient()

export interface TimeSlot {
  start: string
  end: string
}

export interface DaySchedule {
  [key: string]: TimeSlot[]
}

export interface AvailabilitySlot {
  id?: string
  nutritionist_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
}

const DAY_MAPPING: { [key: string]: number } = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 0,
}

/**
 * Converte o objeto de horários do ScheduleSelector para slots de disponibilidade
 */
export function convertScheduleToAvailability(
  schedule: DaySchedule,
  nutritionistId: string
): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = []

  Object.entries(schedule).forEach(([dayKey, timeSlots]) => {
    const dayOfWeek = DAY_MAPPING[dayKey]
    if (dayOfWeek !== undefined && Array.isArray(timeSlots)) {
      timeSlots.forEach(slot => {
        if (slot.start && slot.end) {
          slots.push({
            nutritionist_id: nutritionistId,
            day_of_week: dayOfWeek,
            start_time: slot.start,
            end_time: slot.end,
            is_available: true,
          })
        }
      })
    }
  })

  return slots
}

/**
 * Salva os horários de disponibilidade do nutricionista
 */
export async function saveNutritionistAvailability(
  nutritionistId: string,
  schedule: DaySchedule
): Promise<void> {
  try {
    console.log("🚀 ~ saveNutritionistAvailability ~ schedule:", schedule)
    // Primeiro, remove todos os horários existentes do nutricionista
    const { error: deleteError } = await supabase
      .from('nutritionist_availability')
      .delete()
      .eq('nutritionist_id', nutritionistId)

    console.log("🚀 ~ saveNutritionistAvailability ~ deleteError:", deleteError)
    if (deleteError) {
      throw new Error(
        `Erro ao limpar horários existentes: ${deleteError.message}`
      )
    }

    // Converte o schedule para slots de disponibilidade
    const availabilitySlots = convertScheduleToAvailability(
      schedule,
      nutritionistId
    )

    // Se há slots para inserir, insere todos de uma vez
    if (availabilitySlots.length > 0) {
      const { error: insertError } = await supabase
        .from('nutritionist_availability')
        .insert(availabilitySlots)

      console.log("🚀 ~ saveNutritionistAvailability ~ insertError:", insertError)
      if (insertError) {
        throw new Error(`Erro ao salvar novos horários: ${insertError.message}`)
      }
    }
  } catch (error) {
    console.error('Erro ao salvar disponibilidade do nutricionista:', error)
    throw error
  }
}

/**
 * Busca os horários de disponibilidade do nutricionista
 */
export async function getNutritionistAvailability(
  nutritionistId: string
): Promise<DaySchedule> {
  try {
    const { data, error } = await supabase
    .from('nutritionist_availability')
    .select('*')
    .eq('nutritionist_id', nutritionistId)
    .eq('is_available', true)
    .order('day_of_week')
    .order('start_time')

    if (error) {
      throw new Error(`Erro ao buscar horários: ${error.message}`)
    }

    // Converte os dados do banco para o formato do ScheduleSelector
    const schedule: DaySchedule = {}
    const reverseDayMapping: { [key: number]: string } = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday',
    }

    data?.forEach(slot => {
      const dayKey = reverseDayMapping[slot.day_of_week]
      if (dayKey) {
        if (!schedule[dayKey]) {
          schedule[dayKey] = []
        }
        schedule[dayKey].push({
          start: slot.start_time.split(":").length > 2 ? slot.start_time.slice(0, -3) : slot.start_time,
          end: slot.end_time.split(":").length > 2 ? slot.end_time.slice(0, -3) : slot.end_time ,
        })
      }
    })

    return schedule
  } catch (error) {
    console.error('Erro ao buscar disponibilidade do nutricionista:', error)
    return {}
  }
}
