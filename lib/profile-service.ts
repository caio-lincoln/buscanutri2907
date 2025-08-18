import { createSupabaseClient } from './supabase'
import { saveNutritionistAvailability } from './availability-service'
import type { DaySchedule } from './availability-service'

// Usar o cliente que mantém a autenticação
const supabase = createSupabaseClient()
import type {
  PatientProfile,
  NutritionistProfile,
  CompanyProfile,
  UserType,
} from './supabase'

export async function updateUserProfile(
  userId: string,
  userType: UserType,
  profileData: Partial<PatientProfile | NutritionistProfile | CompanyProfile>
) {
  let tableName = ''
  switch (userType) {
    case 'paciente':
      tableName = 'patient_profiles'
      break
    case 'nutricionista':
      tableName = 'nutritionist_profiles'
      break
    case 'empresa':
      tableName = 'company_profiles'
      break
    default:
      throw new Error('Tipo de usuário inválido para atualização de perfil.')
  }

  // Remover campos que não devem ser atualizados ou que são gerados automaticamente
  const dataToUpdate: any = { ...profileData }
  delete dataToUpdate.id
  delete dataToUpdate.user_id
  delete dataToUpdate.created_at
  delete dataToUpdate.updated_at
  delete dataToUpdate.email // Email é do auth, não do profile

  // Para nutricionistas, extrair e processar horários de disponibilidade separadamente
  let availabilitySchedule: DaySchedule | null = null
  if (userType === 'nutricionista' && dataToUpdate.available_times) {
    try {
      // Se available_times é uma string JSON, fazer parse
      if (typeof dataToUpdate.available_times === 'string') {
        availabilitySchedule = JSON.parse(dataToUpdate.available_times)
      } else if (typeof dataToUpdate.available_times === 'object') {
        availabilitySchedule = dataToUpdate.available_times
      }

      // Remover available_times do update do perfil, será salvo na tabela específica
      delete dataToUpdate.available_times
    } catch (error) {
      console.error('Erro ao processar horários de disponibilidade:', error)
      delete dataToUpdate.available_times
    }
  }

  // Converter arrays de string para o formato correto se necessário (ex: de string separada por vírgulas)
  if (userType === 'paciente') {
    if (
      dataToUpdate.health_conditions &&
      typeof dataToUpdate.health_conditions === 'string'
    ) {
      dataToUpdate.health_conditions = dataToUpdate.health_conditions
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)
    }
    if (dataToUpdate.allergies && typeof dataToUpdate.allergies === 'string') {
      dataToUpdate.allergies = dataToUpdate.allergies
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)
    }
    if (
      dataToUpdate.dietary_preferences &&
      typeof dataToUpdate.dietary_preferences === 'string'
    ) {
      dataToUpdate.dietary_preferences = dataToUpdate.dietary_preferences
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)
    }
  } else if (userType === 'nutricionista') {
    if (
      dataToUpdate.specialties &&
      typeof dataToUpdate.specialties === 'string'
    ) {
      dataToUpdate.specialties = dataToUpdate.specialties
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)
    }
    if (
      dataToUpdate.available_times &&
      typeof dataToUpdate.available_times === 'string'
    ) {
      dataToUpdate.available_times = dataToUpdate.available_times
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)
    }
    if (dataToUpdate.languages && typeof dataToUpdate.languages === 'string') {
      dataToUpdate.languages = dataToUpdate.languages
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)
    }
    if (
      dataToUpdate.certifications &&
      typeof dataToUpdate.certifications === 'string'
    ) {
      dataToUpdate.certifications = dataToUpdate.certifications
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)
    }
    if (
      dataToUpdate.achievements &&
      typeof dataToUpdate.achievements === 'string'
    ) {
      dataToUpdate.achievements = dataToUpdate.achievements
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)
    }
    // Campos JSON removidos - agora usando campos individuais
    // Os campos services, testimonials, working_hours e social_media foram
    // convertidos para campos individuais para evitar erros de parsing JSON
  }

  const { data, error } = await supabase
    .from(tableName)
    .update(dataToUpdate)
    .eq('user_id', userId)
    .select()
    .single()

  console.log("🚀 ~ updateUserProfile ~ error:", error)
  if (error) {
    throw new Error(`Erro ao atualizar perfil: ${error.message}`)
  }

  // Se é nutricionista e tem horários de disponibilidade, salvar na tabela específica
  if (userType === 'nutricionista' && availabilitySchedule && userId) {
    try {
      await saveNutritionistAvailability(userId, availabilitySchedule)
    } catch (availabilityError) {
      console.error(
        'Erro ao salvar horários de disponibilidade:',
        availabilityError
      )
      // Não falhar a operação inteira por causa dos horários
      // O perfil foi salvo com sucesso, apenas os horários falharam
    }
  }

  return data
}
