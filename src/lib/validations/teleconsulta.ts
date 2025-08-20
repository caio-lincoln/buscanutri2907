import { z } from 'zod'

// Schema para criação de sessão de teleconsulta
export const createTeleconsultaSessionSchema = z.object({
  nutritionist_id: z.string().uuid('ID do nutricionista deve ser um UUID válido'),
  scheduled_for: z.string().datetime('Data deve estar no formato ISO 8601'),
  duration_minutes: z.number().int().min(15, 'Duração mínima é 15 minutos').max(120, 'Duração máxima é 120 minutos').default(60),
  price: z.number().min(0, 'Preço deve ser maior ou igual a zero'),
  notes: z.string().optional(),
})

// Schema para atualização de status de sessão
export const updateSessionStatusSchema = z.object({
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled'], {
    errorMap: () => ({ message: 'Status deve ser: scheduled, in_progress, completed ou cancelled' })
  }),
  // message: z.string().min(1, 'Mensagem é obrigatória')
})

// Schema para disponibilidade de agenda
export const availabilitySlotSchema = z.object({
  day_of_week: z.number().int().min(0, 'Dia da semana deve ser entre 0 e 6').max(6, 'Dia da semana deve ser entre 0 e 6'),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário de início deve estar no formato HH:MM'),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário de fim deve estar no formato HH:MM'),
}).refine((data) => {
  const start = data.start_time.split(':').map(Number)
  const end = data.end_time.split(':').map(Number)
  const startMinutes = start[0] * 60 + start[1]
  const endMinutes = end[0] * 60 + end[1]
  return startMinutes < endMinutes
}, {
  message: 'Horário de início deve ser anterior ao horário de fim',
  path: ['end_time']
})

// Schema para busca de horários disponíveis
export const availableTimesQuerySchema = z.object({
  nutritionistId: z.string().uuid('ID do nutricionista deve ser um UUID válido'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate)
  }
  return true
}, {
  message: 'Data de início deve ser anterior ou igual à data de fim',
  path: ['endDate']
})

// Schema para parâmetros de ID
export const idParamSchema = z.object({
  id: z.string().uuid('ID deve ser um UUID válido'),
})

// Tipos TypeScript derivados dos schemas
export type CreateTeleconsultaSessionInput = z.infer<typeof createTeleconsultaSessionSchema>
export type UpdateSessionStatusInput = z.infer<typeof updateSessionStatusSchema>
export type AvailabilitySlotInput = z.infer<typeof availabilitySlotSchema>
export type AvailableTimesQuery = z.infer<typeof availableTimesQuerySchema>
export type IdParam = z.infer<typeof idParamSchema>

// Função helper para validar dados
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      return { success: false, error: errorMessage }
    }
    return { success: false, error: 'Erro de validação desconhecido' }
  }
}