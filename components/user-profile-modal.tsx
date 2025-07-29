"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar" // Import Avatar components
import { User, Clock, CheckCircle, AlertCircle, Loader2, Camera, FileText, BadgeIcon as IdCard } from "lucide-react" // Add Camera, FileText, IdCard icons
import { toast } from "@/hooks/use-toast"
import type { PatientProfile, NutritionistProfile, CompanyProfile, UserType } from "@/lib/supabase"
import { updateUserProfile } from "@/lib/profile-service"
import { validateCRNFormat, validateCRNWithAPI, formatCRN } from "@/lib/crn-validator"
import { validateCNPJFormat, validateCNPJWithAPI, formatCNPJ } from "@/lib/cnpj-validator"

/* ---------- TYPES ---------- */
interface UserProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userType: UserType
  initialProfileData: PatientProfile | NutritionistProfile | CompanyProfile | null
  onProfileUpdate: () => void
  userId: string
}

/* ---------- COMPONENT ---------- */
export function UserProfileModal({
  open,
  onOpenChange,
  userType,
  initialProfileData,
  onProfileUpdate,
  userId,
}: UserProfileModalProps) {
  /* ---- STATE ---- */
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [error, setError] = useState<string | null>(null)

  /* ---- CRN ---- */
  const [crnValue, setCrnValue] = useState("")
  const [crnValidation, setCrnValidation] = useState<{
    status: "idle" | "validating" | "valid" | "invalid"
    message: string
  }>({ status: "idle", message: "" })

  /* ---- CNPJ ---- */
  const [cnpjValue, setCnpjValue] = useState("")
  const [cnpjValidation, setCnpjValidation] = useState<{
    status: "idle" | "validating" | "valid" | "invalid"
    message: string
    companyData?: any
  }>({ status: "idle", message: "" })

  /* ---- LOAD INITIAL DATA ---- */
  useEffect(() => {
    if (!initialProfileData) return

    const initialData: Record<string, any> = { ...initialProfileData }

    if (userType === "paciente") {
      initialData.health_conditions = Array.isArray(initialData.health_conditions)
        ? initialData.health_conditions.join(", ")
        : initialData.health_conditions || ""
      initialData.allergies = Array.isArray(initialData.allergies)
        ? initialData.allergies.join(", ")
        : initialData.allergies || ""
      initialData.dietary_preferences = Array.isArray(initialData.dietary_preferences)
        ? initialData.dietary_preferences.join(", ")
        : initialData.dietary_preferences || ""
    }

    if (userType === "nutricionista") {
      initialData.specialties = Array.isArray(initialData.specialties)
        ? initialData.specialties.join(", ")
        : initialData.specialties || ""
      initialData.available_times = Array.isArray(initialData.available_times)
        ? initialData.available_times.join(", ")
        : initialData.available_times || ""
      initialData.languages = Array.isArray(initialData.languages)
        ? initialData.languages.join(", ")
        : initialData.languages || ""
      initialData.certifications = Array.isArray(initialData.certifications)
        ? initialData.certifications.join(", ")
        : initialData.certifications || ""
      initialData.achievements = Array.isArray(initialData.achievements)
        ? initialData.achievements.join(", ")
        : initialData.achievements || ""

      // Handle JSON fields
      initialData.services =
        initialData.services && typeof initialData.services === "object"
          ? JSON.stringify(initialData.services, null, 2)
          : initialData.services || ""
      initialData.testimonials =
        initialData.testimonials && typeof initialData.testimonials === "object"
          ? JSON.stringify(initialData.testimonials, null, 2)
          : initialData.testimonials || ""
      initialData.working_hours =
        initialData.working_hours && typeof initialData.working_hours === "object"
          ? JSON.stringify(initialData.working_hours, null, 2)
          : initialData.working_hours || ""

      // Handle social media
      initialData.social_media_instagram = initialData.social_media?.instagram || ""
      initialData.social_media_linkedin = initialData.social_media?.linkedin || ""

      // Campos de URL de documentos
      initialData.crn_document_url = initialData.crn_document_url || ""
      initialData.identity_document_url = initialData.identity_document_url || ""

      // Novos campos de configuração
      initialData.online_only_consultation = initialData.online_only_consultation || false
      initialData.default_consultation_duration = initialData.default_consultation_duration || 60
      initialData.min_time_between_appointments = initialData.min_time_between_appointments || 15
      initialData.cancellation_policy = initialData.cancellation_policy || ""
    }

    setFormData(initialData)

    if (userType === "nutricionista" && initialData.crn) {
      setCrnValue(initialData.crn)
      setCrnValidation({ status: "valid", message: "CRN válido" })
    }
    if (userType === "empresa" && initialData.cnpj) {
      setCnpjValue(initialData.cnpj)
      setCnpjValidation({ status: "valid", message: "CNPJ válido" })
    }
  }, [initialProfileData, userType])

  /* ---- HANDLERS ---- */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type, checked } = e.target as HTMLInputElement
    setFormData((prev) => ({ ...prev, [id]: type === "checkbox" ? checked : value }))
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleCRNChange = async (value: string) => {
    const formatted = formatCRN(value)
    setCrnValue(formatted)
    setFormData((prev) => ({ ...prev, crn: formatted }))

    if (!formatted || formatted.length < 6) {
      setCrnValidation({ status: "idle", message: "" })
      return
    }

    const formatValidation = validateCRNFormat(formatted)
    if (!formatValidation.isValid) {
      setCrnValidation({ status: "invalid", message: formatValidation.message })
      return
    }

    setCrnValidation({ status: "validating", message: "Validando CRN..." })
    try {
      const apiValidation = await validateCRNWithAPI(formatted)
      setCrnValidation({
        status: apiValidation.isValid ? "valid" : "invalid",
        message: apiValidation.message,
      })
    } catch {
      setCrnValidation({
        status: "invalid",
        message: "Erro ao validar CRN. Tente novamente.",
      })
    }
  }

  const handleCNPJChange = async (value: string) => {
    const formatted = formatCNPJ(value)
    setCnpjValue(formatted)
    setFormData((prev) => ({ ...prev, cnpj: formatted }))

    if (!formatted || formatted.replace(/\D/g, "").length < 14) {
      setCnpjValidation({ status: "idle", message: "" })
      return
    }

    const formatValidation = validateCNPJFormat(formatted)
    if (!formatValidation.isValid) {
      setCnpjValidation({ status: "invalid", message: formatValidation.message })
      return
    }

    setCnpjValidation({ status: "validating", message: "Consultando Receita Federal..." })
    try {
      const apiValidation = await validateCNPJWithAPI(formatted)
      setCnpjValidation({
        status: apiValidation.isValid ? "valid" : "invalid",
        message: apiValidation.message,
        companyData: apiValidation.companyData,
      })
    } catch {
      setCnpjValidation({
        status: "invalid",
        message: "Erro ao validar CNPJ. Tente novamente.",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const dataToSubmit = { ...formData }

      // Handle array fields for patient
      if (userType === "paciente") {
        if (typeof dataToSubmit.health_conditions === "string") {
          dataToSubmit.health_conditions = dataToSubmit.health_conditions
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        }
        if (typeof dataToSubmit.allergies === "string") {
          dataToSubmit.allergies = dataToSubmit.allergies
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        }
        if (typeof dataToSubmit.dietary_preferences === "string") {
          dataToSubmit.dietary_preferences = dataToSubmit.dietary_preferences
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        }
      }

      // Handle array and JSON fields for nutritionist
      if (userType === "nutricionista") {
        if (typeof dataToSubmit.specialties === "string") {
          dataToSubmit.specialties = dataToSubmit.specialties
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        }
        if (typeof dataToSubmit.available_times === "string") {
          dataToSubmit.available_times = dataToSubmit.available_times
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        }
        if (typeof dataToSubmit.languages === "string") {
          dataToSubmit.languages = dataToSubmit.languages
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        }
        if (typeof dataToSubmit.certifications === "string") {
          dataToSubmit.certifications = dataToSubmit.certifications
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        }
        if (typeof dataToSubmit.achievements === "string") {
          dataToSubmit.achievements = dataToSubmit.achievements
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        }
        dataToSubmit.social_media = {
          instagram: formData.social_media_instagram,
          linkedin: formData.social_media_linkedin,
        }
        delete dataToSubmit.social_media_instagram
        delete dataToSubmit.social_media_linkedin

        try {
          if (dataToSubmit.services && typeof dataToSubmit.services === "string") {
            dataToSubmit.services = JSON.parse(dataToSubmit.services)
          }
          if (dataToSubmit.testimonials && typeof dataToSubmit.testimonials === "string") {
            dataToSubmit.testimonials = JSON.parse(dataToSubmit.testimonials)
          }
          if (dataToSubmit.working_hours && typeof dataToSubmit.working_hours === "string") {
            dataToSubmit.working_hours = JSON.parse(dataToSubmit.working_hours)
          }
        } catch (e) {
          console.error("Erro ao parsear campo JSON:", e)
          throw new Error("Formato JSON inválido para um dos campos.")
        }
      }

      await updateUserProfile(userId, userType, dataToSubmit)

      toast({
        title: "✅ Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      })
      onProfileUpdate()
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || "Erro ao salvar perfil.")
      toast({
        title: "❌ Erro ao atualizar perfil",
        description: err.message || "Ocorreu um erro ao salvar suas informações.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  /* ---- ICON HELPERS ---- */
  const renderCRNValidationIcon = () => {
    switch (crnValidation.status) {
      case "validating":
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />
      case "valid":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "invalid":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const renderCNPJValidationIcon = () => {
    switch (cnpjValidation.status) {
      case "validating":
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />
      case "valid":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "invalid":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  /* ---- RENDER ---- */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Editar Perfil (
            {userType === "paciente" ? "Paciente" : userType === "nutricionista" ? "Nutricionista" : "Empresa"})
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* ---------- FORM ---------- */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Image Section */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={
                  userType === "empresa"
                    ? formData.logo_url || "/placeholder.svg?height=96&width=96&query=company logo"
                    : formData.profile_image_url || "/placeholder.svg?height=96&width=96&query=user profile"
                }
                alt={formData.full_name || formData.company_name || "Profile Image"}
              />
              <AvatarFallback className="bg-gray-200 text-gray-600 text-2xl font-semibold">
                {(formData.full_name || formData.company_name)?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="w-full max-w-xs">
              <Label htmlFor="profile_image_url" className="sr-only">
                URL da Imagem de Perfil
              </Label>
              <div className="relative">
                <Input
                  id={userType === "empresa" ? "logo_url" : "profile_image_url"}
                  value={userType === "empresa" ? formData.logo_url || "" : formData.profile_image_url || ""}
                  onChange={handleChange}
                  placeholder="URL da imagem (ex: https://exemplo.com/foto.jpg)"
                  className="pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Camera className="h-4 w-4" />
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {userType === "empresa" ? "Cole a URL do logo da sua empresa." : "Cole a URL da sua foto de perfil."}
              </p>
            </div>
          </div>

          {/* Shared Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input id="full_name" value={formData.full_name || ""} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={formData.phone || ""} onChange={handleChange} placeholder="(XX) XXXXX-XXXX" />
            </div>
          </div>

          {/* Patient & Nutritionist Specific Fields (CPF/RG) */}
          {(userType === "paciente" || userType === "nutricionista") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cpf">CPF (mockado)</Label>
                <Input id="cpf" value={formData.cpf || ""} onChange={handleChange} placeholder="XXX.XXX.XXX-XX" />
              </div>
              <div>
                <Label htmlFor="rg">RG (mockado)</Label>
                <Input id="rg" value={formData.rg || ""} onChange={handleChange} placeholder="XX.XXX.XXX-X" />
              </div>
            </div>
          )}

          {/* Patient Specific Fields */}
          {userType === "paciente" && (
            <>
              <div>
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input id="birth_date" type="date" value={formData.birth_date || ""} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="health_conditions">Condições de Saúde (separar por vírgula)</Label>
                <Textarea
                  id="health_conditions"
                  value={formData.health_conditions || ""}
                  onChange={handleChange}
                  placeholder="Diabetes, Hipertensão, Doença Celíaca"
                />
              </div>
              <div>
                <Label htmlFor="allergies">Alergias (separar por vírgula)</Label>
                <Textarea
                  id="allergies"
                  value={formData.allergies || ""}
                  onChange={handleChange}
                  placeholder="Glúten, Lactose, Amendoim"
                />
              </div>
              <div>
                <Label htmlFor="dietary_preferences">Preferências Alimentares (separar por vírgula)</Label>
                <Textarea
                  id="dietary_preferences"
                  value={formData.dietary_preferences || ""}
                  onChange={handleChange}
                  placeholder="Vegetariano, Vegano, Low Carb"
                />
              </div>
            </>
          )}

          {/* Nutritionist Specific Fields */}
          {userType === "nutricionista" && (
            <>
              <div>
                <Label htmlFor="crn">CRN</Label>
                <div className="relative">
                  <Input
                    id="crn"
                    value={crnValue}
                    onChange={(e) => handleCRNChange(e.target.value)}
                    required
                    className={
                      crnValidation.status === "invalid"
                        ? "border-red-500 focus-visible:ring-red-500"
                        : crnValidation.status === "valid"
                          ? "border-green-500 focus-visible:ring-green-500"
                          : ""
                    }
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">{renderCRNValidationIcon()}</div>
                </div>
                {crnValidation.message && (
                  <p
                    className={`text-sm mt-1 ${crnValidation.status === "invalid" ? "text-red-500" : "text-green-500"}`}
                  >
                    {crnValidation.message}
                  </p>
                )}
              </div>
              {/* Campos para upload de documentos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="crn_document_url">URL do Documento CRN</Label>
                  <div className="relative">
                    <Input
                      id="crn_document_url"
                      value={formData.crn_document_url || ""}
                      onChange={handleChange}
                      placeholder="Link para seu documento CRN"
                      className="pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <FileText className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Cole a URL do seu documento CRN (ex: Google Drive, Dropbox).
                  </p>
                </div>
                <div>
                  <Label htmlFor="identity_document_url">URL do Documento de Identidade</Label>
                  <div className="relative">
                    <Input
                      id="identity_document_url"
                      value={formData.identity_document_url || ""}
                      onChange={handleChange}
                      placeholder="Link para seu documento de identidade"
                      className="pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <IdCard className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Cole a URL do seu documento de identidade (ex: RG, CNH).</p>
                </div>
              </div>
              <div>
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  value={formData.bio || ""}
                  onChange={handleChange}
                  placeholder="Fale um pouco sobre você e sua abordagem..."
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="specialties">Especialidades (separar por vírgula)</Label>
                <Textarea
                  id="specialties"
                  value={formData.specialties || ""}
                  onChange={handleChange}
                  placeholder="Nutrição Clínica, Esportiva, Materno-Infantil"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="experience_years">Anos de Experiência</Label>
                  <Input
                    id="experience_years"
                    type="number"
                    value={formData.experience_years || ""}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="consultation_price">Preço da Consulta (R$)</Label>
                  <Input
                    id="consultation_price"
                    type="number"
                    step="0.01"
                    value={formData.consultation_price || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="online_consultation"
                  checked={formData.online_consultation || false}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, online_consultation: checked }))}
                />
                <Label htmlFor="online_consultation">Atendimento Online Disponível</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="online_only_consultation"
                  checked={formData.online_only_consultation || false}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, online_only_consultation: checked }))}
                />
                <Label htmlFor="online_only_consultation">Somente Atendimento Online (Teleconsulta)</Label>
              </div>
              <div>
                <Label htmlFor="default_consultation_duration">Duração Padrão das Consultas (minutos)</Label>
                <Input
                  id="default_consultation_duration"
                  type="number"
                  value={formData.default_consultation_duration || ""}
                  onChange={handleChange}
                  min="15"
                  step="15"
                />
              </div>
              <div>
                <Label htmlFor="min_time_between_appointments">Tempo Mínimo Entre Agendamentos (minutos)</Label>
                <Input
                  id="min_time_between_appointments"
                  type="number"
                  value={formData.min_time_between_appointments || ""}
                  onChange={handleChange}
                  min="0"
                  step="5"
                />
              </div>
              <div>
                <Label htmlFor="address">Endereço do Consultório</Label>
                <Input
                  id="address"
                  value={formData.address || ""}
                  onChange={handleChange}
                  placeholder="Rua Exemplo, 123, Cidade - UF"
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website || ""}
                  onChange={handleChange}
                  placeholder="https://www.seusite.com"
                />
              </div>
              <div>
                <Label htmlFor="education">Formação Acadêmica</Label>
                <Textarea
                  id="education"
                  value={formData.education || ""}
                  onChange={handleChange}
                  placeholder="Universidade X - Nutrição (2010-2014)"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="services">Serviços (JSON Array)</Label>
                <Textarea
                  id="services"
                  value={formData.services || ""}
                  onChange={handleChange}
                  placeholder={`[{"name": "Consulta Inicial", "price": 200, "duration": "60min"}]`}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="available_times">Horários Disponíveis (separar por vírgula)</Label>
                <Textarea
                  id="available_times"
                  value={formData.available_times || ""}
                  onChange={handleChange}
                  placeholder="Seg 09-18, Ter 09-12"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="languages">Idiomas (separar por vírgula)</Label>
                <Input
                  id="languages"
                  value={formData.languages || ""}
                  onChange={handleChange}
                  placeholder="Português, Inglês"
                />
              </div>
              <div>
                <Label htmlFor="certifications">Certificações (separar por vírgula)</Label>
                <Textarea
                  id="certifications"
                  value={formData.certifications || ""}
                  onChange={handleChange}
                  placeholder="Certificação em Nutrição Esportiva"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="achievements">Conquistas (separar por vírgula)</Label>
                <Textarea
                  id="achievements"
                  value={formData.achievements || ""}
                  onChange={handleChange}
                  placeholder="Palestrante no Congresso X"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="testimonials">Depoimentos (JSON Array)</Label>
                <Textarea
                  id="testimonials"
                  value={formData.testimonials || ""}
                  onChange={handleChange}
                  placeholder={`[{"name": "Cliente A", "rating": 5, "comment": "Excelente profissional"}]`}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="working_hours">Horário de Trabalho (JSON Object)</Label>
                <Textarea
                  id="working_hours"
                  value={formData.working_hours || ""}
                  onChange={handleChange}
                  placeholder={`{"Segunda": "09:00-18:00", "Terça": "09:00-18:00"}`}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="social_media_instagram">Instagram (apenas username)</Label>
                  <Input
                    id="social_media_instagram"
                    value={formData.social_media_instagram || ""}
                    onChange={handleChange}
                    placeholder="seunome.nutri"
                  />
                </div>
                <div>
                  <Label htmlFor="social_media_linkedin">LinkedIn (apenas username)</Label>
                  <Input
                    id="social_media_linkedin"
                    value={formData.social_media_linkedin || ""}
                    onChange={handleChange}
                    placeholder="seunome-nutricionista"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="cancellation_policy">Política de Cancelamento</Label>
                <Textarea
                  id="cancellation_policy"
                  value={formData.cancellation_policy || ""}
                  onChange={handleChange}
                  placeholder="Descreva sua política de cancelamento de consultas..."
                  rows={3}
                />
              </div>
            </>
          )}

          {/* Company Specific Fields */}
          {userType === "empresa" && (
            <>
              <div>
                <Label htmlFor="company_name">Nome da Empresa</Label>
                <Input id="company_name" value={formData.company_name || ""} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <div className="relative">
                  <Input
                    id="cnpj"
                    value={cnpjValue}
                    onChange={(e) => handleCNPJChange(e.target.value)}
                    required
                    className={
                      cnpjValidation.status === "invalid"
                        ? "border-red-500 focus-visible:ring-red-500"
                        : cnpjValidation.status === "valid"
                          ? "border-green-500 focus-visible:ring-green-500"
                          : ""
                    }
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">{renderCNPJValidationIcon()}</div>
                </div>
                {cnpjValidation.message && (
                  <p
                    className={`text-sm mt-1 ${
                      cnpjValidation.status === "invalid" ? "text-red-500" : "text-green-500"
                    }`}
                  >
                    {cnpjValidation.message}
                  </p>
                )}
                {cnpjValidation.companyData && cnpjValidation.status === "valid" && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
                    <p>
                      <strong>Razão Social:</strong> {cnpjValidation.companyData.razao_social}
                    </p>
                    <p>
                      <strong>Nome Fantasia:</strong> {cnpjValidation.companyData.nome_fantasia || "Não informado"}
                    </p>
                    <p>
                      <strong>Endereço:</strong> {cnpjValidation.companyData.logradouro},{" "}
                      {cnpjValidation.companyData.numero} - {cnpjValidation.companyData.municipio}/
                      {cnpjValidation.companyData.uf}
                    </p>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="description">Descrição da Empresa</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={handleChange}
                  placeholder="Descreva sua empresa e seus valores..."
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="industry">Setor</Label>
                <Input
                  id="industry"
                  value={formData.industry || ""}
                  onChange={handleChange}
                  placeholder="Saúde, Tecnologia, Educação"
                />
              </div>
              <div>
                <Label htmlFor="company_size">Tamanho da Empresa</Label>
                <Select
                  value={formData.company_size || ""}
                  onValueChange={(value) => handleSelectChange("company_size", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tamanho da empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 funcionários</SelectItem>
                    <SelectItem value="11-50">11-50 funcionários</SelectItem>
                    <SelectItem value="51-200">51-200 funcionários</SelectItem>
                    <SelectItem value="201-500">201-500 funcionários</SelectItem>
                    <SelectItem value="500+">500+ funcionários</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website || ""}
                  onChange={handleChange}
                  placeholder="https://www.suaempresa.com"
                />
              </div>
              <div>
                <Label htmlFor="address">Endereço da Empresa</Label>
                <Input
                  id="address"
                  value={formData.address || ""}
                  onChange={handleChange}
                  placeholder="Rua da Empresa, 456, Cidade - UF"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="responsible_name">Nome do Responsável</Label>
                  <Input
                    id="responsible_name"
                    value={formData.responsible_name || ""}
                    onChange={handleChange}
                    placeholder="Nome do contato principal"
                  />
                </div>
                <div>
                  <Label htmlFor="responsible_position">Cargo do Responsável</Label>
                  <Input
                    id="responsible_position"
                    value={formData.responsible_position || ""}
                    onChange={handleChange}
                    placeholder="Gerente de RH, CEO"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="responsible_cpf">CPF do Responsável (mockado)</Label>
                <Input
                  id="responsible_cpf"
                  value={formData.responsible_cpf || ""}
                  onChange={handleChange}
                  placeholder="XXX.XXX.XXX-XX"
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ---------- DEFAULT EXPORT (opcional) ---------- */
export default UserProfileModal
