import { supabase } from "./supabase"
import type { PatientProfile, NutritionistProfile, CompanyProfile, UserType } from "./supabase"

export async function updateUserProfile(
  userId: string,
  userType: UserType,
  profileData: Partial<PatientProfile | NutritionistProfile | CompanyProfile>,
) {
  let tableName = ""
  switch (userType) {
    case "paciente":
      tableName = "patient_profiles"
      break
    case "nutricionista":
      tableName = "nutritionist_profiles"
      break
    case "empresa":
      tableName = "company_profiles"
      break
    default:
      throw new Error("Tipo de usuário inválido para atualização de perfil.")
  }

  // Remover campos que não devem ser atualizados ou que são gerados automaticamente
  const dataToUpdate: any = { ...profileData }
  delete dataToUpdate.id
  delete dataToUpdate.user_id
  delete dataToUpdate.created_at
  delete dataToUpdate.updated_at
  delete dataToUpdate.email // Email é do auth, não do profile

  // Converter arrays de string para o formato correto se necessário (ex: de string separada por vírgulas)
  if (userType === "paciente") {
    if (dataToUpdate.health_conditions && typeof dataToUpdate.health_conditions === "string") {
      dataToUpdate.health_conditions = dataToUpdate.health_conditions
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)
    }
    if (dataToUpdate.allergies && typeof dataToUpdate.allergies === "string") {
      dataToUpdate.allergies = dataToUpdate.allergies
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)
    }
    if (dataToUpdate.dietary_preferences && typeof dataToUpdate.dietary_preferences === "string") {
      dataToUpdate.dietary_preferences = dataToUpdate.dietary_preferences
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)
    }
  } else if (userType === "nutricionista") {
    if (dataToUpdate.specialties && typeof dataToUpdate.specialties === "string") {
      dataToUpdate.specialties = dataToUpdate.specialties
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)
    }
    if (dataToUpdate.available_times && typeof dataToUpdate.available_times === "string") {
      dataToUpdate.available_times = dataToUpdate.available_times
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)
    }
    if (dataToUpdate.languages && typeof dataToUpdate.languages === "string") {
      dataToUpdate.languages = dataToUpdate.languages
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)
    }
    if (dataToUpdate.certifications && typeof dataToUpdate.certifications === "string") {
      dataToUpdate.certifications = dataToUpdate.certifications
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)
    }
    if (dataToUpdate.achievements && typeof dataToUpdate.achievements === "string") {
      dataToUpdate.achievements = dataToUpdate.achievements
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)
    }
    // Para campos JSON como services, testimonials, working_hours, social_media
    try {
      if (dataToUpdate.services && typeof dataToUpdate.services === "string") {
        dataToUpdate.services = JSON.parse(dataToUpdate.services)
      }
      if (dataToUpdate.testimonials && typeof dataToUpdate.testimonials === "string") {
        dataToUpdate.testimonials = JSON.parse(dataToUpdate.testimonials)
      }
      if (dataToUpdate.working_hours && typeof dataToUpdate.working_hours === "string") {
        dataToUpdate.working_hours = JSON.parse(dataToUpdate.working_hours)
      }
      if (dataToUpdate.social_media && typeof dataToUpdate.social_media === "string") {
        dataToUpdate.social_media = JSON.parse(dataToUpdate.social_media)
      }
    } catch (e) {
      console.error("Erro ao parsear campo JSON:", e)
      throw new Error("Formato JSON inválido para um dos campos.")
    }
  }

  const { data, error } = await supabase.from(tableName).update(dataToUpdate).eq("user_id", userId).select().single()

  if (error) {
    console.error(`Erro ao atualizar perfil de ${userType}:`, error)
    throw error
  }

  return data
}
