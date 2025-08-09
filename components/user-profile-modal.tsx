"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultiSelect, type Option } from "@/components/ui/multi-select"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ImageUpload } from "@/components/ui/image-upload"
import { User, Clock, CheckCircle, AlertCircle, Loader2, Camera, FileText, BadgeIcon as IdCard, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import type { PatientProfile, NutritionistProfile, CompanyProfile, UserType } from "@/lib/supabase"
import { supabase } from "@/lib/supabase"
import { updateUserProfile } from "@/lib/profile-service"
import { validateCRNFormat, validateCRNWithAPI, formatCRN } from "@/lib/crn-validator"
import { validateCNPJFormat, validateCNPJWithAPI, formatCNPJ } from "@/lib/cnpj-validator"
import { validateCPF, formatCPF, validateCPFFormat } from "@/lib/cpf-validator"
import { validateRG, formatRG, validateRGFormat } from "@/lib/rg-validator"
import { ScheduleSelector } from "@/components/ui/schedule-selector"

// Specialty options for nutritionists
const SPECIALTY_OPTIONS: Option[] = [
  { label: "Nutricao Clinica", value: "nutricao_clinica" },
  { label: "Nutricao Esportiva", value: "nutricao_esportiva" },
  { label: "Nutricao Materno-Infantil", value: "nutricao_materno_infantil" },
  { label: "Nutricao Geriatrica", value: "nutricao_geriatrica" },
  { label: "Nutricao Funcional", value: "nutricao_funcional" },
  { label: "Nutricao Comportamental", value: "nutricao_comportamental" },
  { label: "Nutricao Oncologica", value: "nutricao_oncologica" },
  { label: "Nutricao Vegetariana/Vegana", value: "nutricao_vegetariana" },
  { label: "Transtornos Alimentares", value: "transtornos_alimentares" },
  { label: "Emagrecimento", value: "emagrecimento" },
  { label: "Ganho de Massa Muscular", value: "ganho_massa" },
  { label: "Diabetes", value: "diabetes" },
  { label: "Hipertensao", value: "hipertensao" },
  { label: "Dislipidemia", value: "dislipidemia" },
]

// Payment method options
const PAYMENT_METHOD_OPTIONS: Option[] = [
  { label: "PIX", value: "pix" },
  { label: "Cartao de Credito", value: "cartao_credito" },
  { label: "Cartao de Debito", value: "cartao_debito" },
  { label: "Dinheiro", value: "dinheiro" },
  { label: "Transferencia Bancaria", value: "transferencia" },
  { label: "Boleto", value: "boleto" },
  { label: "Convenio", value: "convenio" },
]

// Language options
const LANGUAGE_OPTIONS: Option[] = [
  { label: "Portugues", value: "portugues" },
  { label: "Ingles", value: "ingles" },
  { label: "Espanhol", value: "espanhol" },
  { label: "Frances", value: "frances" },
  { label: "Italiano", value: "italiano" },
  { label: "Alemao", value: "alemao" },
  { label: "Libras", value: "libras" },
]

// Available times options
const AVAILABLE_TIMES_OPTIONS: Option[] = [
  { label: "Segunda 08:00-12:00", value: "seg_manha" },
  { label: "Segunda 13:00-18:00", value: "seg_tarde" },
  { label: "Terca 08:00-12:00", value: "ter_manha" },
  { label: "Terca 13:00-18:00", value: "ter_tarde" },
  { label: "Quarta 08:00-12:00", value: "qua_manha" },
  { label: "Quarta 13:00-18:00", value: "qua_tarde" },
  { label: "Quinta 08:00-12:00", value: "qui_manha" },
  { label: "Quinta 13:00-18:00", value: "qui_tarde" },
  { label: "Sexta 08:00-12:00", value: "sex_manha" },
  { label: "Sexta 13:00-18:00", value: "sex_tarde" },
  { label: "Sabado 08:00-12:00", value: "sab_manha" },
  { label: "Sabado 13:00-17:00", value: "sab_tarde" },
  { label: "Domingo 08:00-12:00", value: "dom_manha" },
  { label: "Domingo 13:00-17:00", value: "dom_tarde" },
]

// Opções para anamnese nutricional
const GENERO_OPTIONS = [
  { value: "masculino", label: "Masculino" },
  { value: "feminino", label: "Feminino" },
  { value: "outro", label: "Outro" },
  { value: "prefiro_nao_informar", label: "Prefiro não informar" }
]

const OBJETIVO_NUTRICIONAL_OPTIONS = [
  { value: "definicao", label: "Definição (diminuir percentual de gordura e aumentar massa magra)" },
  { value: "disturbios_saude", label: "Distúrbios na saúde (Anemia, Diabetes mellitus, Doença cardíaca, Esteatose hepática e etc.)" },
  { value: "emagrecimento", label: "Emagrecimento" },
  { value: "ganho_massa", label: "Ganho de massa muscular" },
  { value: "intolerancia_alergia", label: "Intolerância/alergia alimentar" },
  { value: "performance_esportiva", label: "Performance esportiva" },
  { value: "reeducacao_alimentar", label: "Reeducação alimentar" },
  { value: "saude_geral", label: "Saúde geral" },
  { value: "saude_intestinal", label: "Saúde intestinal" },
  { value: "outro", label: "Outro" }
]

const COMORBIDADES_OPTIONS: Option[] = [
  { value: "anemia", label: "Anemia" },
  { value: "ansiedade", label: "Ansiedade" },
  { value: "artrite_reumatoide", label: "Artrite reumatoide" },
  { value: "colite_ulcerativa", label: "Colite ulcerativa" },
  { value: "depressao", label: "Depressão" },
  { value: "desnutricao", label: "Desnutrição" },
  { value: "diabetes_mellitus_1", label: "Diabetes mellitus 1" },
  { value: "diabetes_mellitus_2", label: "Diabetes mellitus 2" },
  { value: "dislipidemia", label: "Dislipidemia (colesterol e triglicerídeos altos)" },
  { value: "doenca_cardiaca", label: "Doença cardíaca" },
  { value: "doenca_celiaca", label: "Doença celíaca" },
  { value: "doenca_crohn", label: "Doença de Crohn" },
  { value: "doenca_hashimoto", label: "Doença de Hashimoto" },
  { value: "doenca_hepatica_cronica", label: "Doença hepática crônica" },
  { value: "doenca_renal_cronica", label: "Doença renal crônica" },
  { value: "doencas_neurodegenerativas", label: "Doenças neurodegenerativas (Alzheimer, Parkinson, etc.)" },
  { value: "gastrite", label: "Gastrite" },
  { value: "hipertensao_arterial", label: "Hipertensão arterial" },
  { value: "hipertiroidismo", label: "Hipertiroidismo" },
  { value: "hipotiroidismo", label: "Hipotiroidismo" },
  { value: "intolerancia_alergia_lactose", label: "Intolerância ou alergia a lactose" },
  { value: "lupus", label: "Lúpus" },
  { value: "neoplasia", label: "Neoplasia" },
  { value: "obesidade", label: "Obesidade" },
  { value: "osteoporose", label: "Osteoporose" },
  { value: "refluxo_gastroesofagico", label: "Refluxo gastroesofágico" },
  { value: "sindrome_intestino_irritavel", label: "Síndrome do intestino irritável" },
  { value: "sindrome_metabolica", label: "Síndrome metabólica" },
  { value: "transtorno_alimentar", label: "Transtorno alimentar" },
  { value: "ulcera_peptica", label: "Úlcera péptica" }
]

const ALERGIAS_ANAMNESE_OPTIONS: Option[] = [
  { value: "amendoim", label: "Amendoim" },
  { value: "castanha", label: "Castanha" },
  { value: "conservantes", label: "Conservantes" },
  { value: "corantes_artificiais", label: "Corantes artificiais" },
  { value: "frutos_mar", label: "Frutos do mar" },
  { value: "gluten", label: "Glúten" },
  { value: "lactose", label: "Lactose" },
  { value: "leite", label: "Leite" },
  { value: "milho", label: "Milho" },
  { value: "nozes", label: "Nozes" },
  { value: "ovo", label: "Ovo" },
  { value: "peixes", label: "Peixes" },
  { value: "soja", label: "Soja" },
  { value: "sulfitos", label: "Sulfitos" }
]

const PREFERENCIAS_ALIMENTARES_OPTIONS: Option[] = [
  { value: "vegetariano", label: "Vegetariano" },
  { value: "vegano", label: "Vegano" },
  { value: "sem_gluten", label: "Sem glúten" },
  { value: "sem_lactose", label: "Sem lactose" },
  { value: "low_carb", label: "Low carb" },
  { value: "cetogenica", label: "Cetogênica" },
  { value: "mediterranea", label: "Mediterrânea" },
  { value: "dash", label: "DASH" },
  { value: "paleolitica", label: "Paleolítica" },
  { value: "jejum_intermitente", label: "Jejum intermitente" },
  { value: "sem_acucar", label: "Sem açúcar" },
  { value: "organicos", label: "Alimentos orgânicos" },
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
  { value: "sem_restricoes", label: "Sem restrições" }
]

interface UserProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userType: UserType
  initialData: PatientProfile | NutritionistProfile | CompanyProfile
  userId: string
  onProfileUpdate?: () => void
}

export function UserProfileModal({
  open,
  onOpenChange,
  userType,
  initialData,
  userId,
  onProfileUpdate,
}: UserProfileModalProps) {
  const [formData, setFormData] = useState<any>(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [crnValue, setCrnValue] = useState("")
  const [crnValidation, setCrnValidation] = useState<{
    status: "idle" | "validating" | "valid" | "invalid"
    message: string
  }>({ status: "idle", message: "" })

  const [cnpjValue, setCnpjValue] = useState("")
  const [cnpjValidation, setCnpjValidation] = useState<{
    status: "idle" | "validating" | "valid" | "invalid"
    message: string
  }>({ status: "idle", message: "" })

  const [cpfValue, setCpfValue] = useState("")
  const [cpfValidation, setCpfValidation] = useState<{
    status: "idle" | "validating" | "valid" | "invalid"
    message: string
  }>({ status: "idle", message: "" })

  const [rgValue, setRgValue] = useState("")
  const [rgValidation, setRgValidation] = useState<{
    status: "idle" | "validating" | "valid" | "invalid"
    message: string
  }>({ status: "idle", message: "" })

  // Estado para paginação
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = userType === "paciente" ? 3 : userType === "nutricionista" ? 2 : 1
  
  // Estado para controlar se está editando (modo de edição)
  const [isEditing, setIsEditing] = useState(true)

  // Estados para anamnese nutricional (apenas para pacientes)
  const [anamneseData, setAnamneseData] = useState<any>({
    patient_id: userId,
    objetivos_nutricionais: [],
    objetivo_personalizado: "",
    comorbidades: [],
    alergias_alimentares: [],
    suplementacao_atual: [],
    medicacoes_uso: []
  })

  useEffect(() => {
    if (open && initialData) {
      // Resetar estados de validação
      setCrnValidation({ status: "idle", message: "" })
      setCnpjValidation({ status: "idle", message: "" })
      setCpfValidation({ status: "idle", message: "" })
      setRgValidation({ status: "idle", message: "" })
      setError(null)
      setCurrentPage(1)

      // Garantir que formData sempre tenha as propriedades necessárias
      const safeFormData = {
        ...initialData,
        profile_image_url: initialData?.profile_image_url || "",
        full_name: initialData?.full_name || ""
      }

      // Adicionar logo_url apenas para empresas
      if (userType === "empresa") {
        safeFormData.logo_url = initialData?.logo_url || ""
        safeFormData.company_name = initialData?.company_name || ""
      }
      // Inicialização específica para pacientes foi removida pois os dados
      // de condições de saúde, alergias e preferências alimentares agora
      // são coletados através da anamnese nutricional

      if (userType === "nutricionista") {
        safeFormData.specialties = Array.isArray(initialData?.specialties)
          ? initialData.specialties.join(", ")
          : initialData?.specialties || ""
        // Para horários disponíveis, convertemos array do banco em objeto para o ScheduleSelector
        safeFormData.available_times = Array.isArray(initialData?.available_times)
          ? JSON.stringify({
              monday: initialData.available_times.map((time: string) => ({ start: time, end: time }))
            })
          : typeof initialData?.available_times === "string"
          ? initialData.available_times
          : typeof initialData?.available_times === "object"
          ? JSON.stringify(initialData.available_times)
          : "{}"
        safeFormData.languages = Array.isArray(initialData?.languages)
          ? initialData.languages.join(", ")
          : initialData?.languages || ""
        safeFormData.certifications = Array.isArray(initialData?.certifications)
          ? initialData.certifications.join(", ")
          : initialData?.certifications || ""
        safeFormData.achievements = Array.isArray(initialData?.achievements)
          ? initialData.achievements.join(", ")
          : initialData?.achievements || ""

        safeFormData.services_offered =
          initialData?.services_offered && typeof initialData.services_offered === "object"
            ? JSON.stringify(initialData.services_offered)
            : initialData?.services_offered || ""

        safeFormData.crn_document_url = initialData?.crn_document_url || ""
        safeFormData.identity_document_url = initialData?.identity_document_url || ""

        safeFormData.consultation_languages = initialData?.consultation_languages || ""
        safeFormData.payment_methods = initialData?.payment_methods || ""
        safeFormData.cancellation_policy = initialData?.cancellation_policy || ""
      }

      // Definir formData apenas uma vez após processar todos os campos
      setFormData(safeFormData)

      // Inicializar validações apenas se os dados existirem
      if (userType === "nutricionista" && initialData?.crn) {
        const formattedCrn = formatCRN(initialData.crn)
        setCrnValue(formattedCrn)
        setCrnValidation({ status: "valid", message: "CRN válido" })
      }
      if (userType === "empresa" && initialData?.cnpj) {
        const formattedCnpj = formatCNPJ(initialData.cnpj)
        setCnpjValue(formattedCnpj)
        setCnpjValidation({ status: "valid", message: "CNPJ válido" })
      }

      // Inicializar CPF e RG se existirem
      if ((userType === "paciente" || userType === "nutricionista") && initialData?.cpf) {
        const formattedCpf = formatCPF(initialData.cpf)
        setCpfValue(formattedCpf)
        setCpfValidation({ status: "valid", message: "CPF válido" })
      }
      if ((userType === "paciente" || userType === "nutricionista") && initialData?.rg) {
        const formattedRg = formatRG(initialData.rg)
        setRgValue(formattedRg)
        setRgValidation({ status: "valid", message: "RG válido" })
      }

      // Carregar dados da anamnese para pacientes
      if (userType === "paciente") {
        loadAnamneseData()
      }
    }
  }, [open, userType, initialData?.id])

  // Função para carregar dados da anamnese
  const loadAnamneseData = async () => {
    try {
      const { data, error } = await supabase
        .from("anamnese_nutricional")
        .select("*")
        .eq("patient_id", userId)
        .single()

      if (data && !error) {
        setAnamneseData(data)
        
        // Sincronizar preferências alimentares da anamnese com o perfil
        if (data.preferencias_alimentares) {
          setFormData((prev: any) => ({
            ...prev,
            dietary_preferences: data.preferencias_alimentares
          }))
        }
      } else {
        // Se não há anamnese, mas há preferências no perfil, sincronizar
        if (initialData?.dietary_preferences) {
          setAnamneseData((prev: any) => ({
            ...prev,
            preferencias_alimentares: initialData.dietary_preferences
          }))
        }
      }
    } catch (error) {
      console.log("Nenhuma anamnese encontrada, criando nova")
      
      // Se não há anamnese, mas há preferências no perfil, sincronizar
      if (initialData?.dietary_preferences) {
        setAnamneseData((prev: any) => ({
          ...prev,
          preferencias_alimentares: initialData.dietary_preferences
        }))
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData((prev) => ({ ...prev, [id]: type === "checkbox" ? checked : value }))
  }

  const handleImageUploaded = (imageUrl: string) => {
    const imageField = userType === "empresa" ? "logo_url" : "profile_image_url"
    setFormData((prev) => ({ ...prev, [imageField]: imageUrl }))
  }

  const handleImageRemoved = () => {
    const imageField = userType === "empresa" ? "logo_url" : "profile_image_url"
    setFormData((prev) => ({ ...prev, [imageField]: "" }))
  }

  const handleCRNChange = async (value: string) => {
    const formatted = formatCRN(value)
    setCrnValue(formatted)
    setFormData((prev) => ({ ...prev, crn: formatted.replace(/\D/g, "") }))

    if (!formatted || formatted.replace(/\D/g, "").length < 6) {
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
    } catch (error) {
      setCrnValidation({
        status: "invalid",
        message: "Erro ao validar CRN. Tente novamente.",
      })
    }
  }

  const handleCNPJChange = async (value: string) => {
    const formatted = formatCNPJ(value)
    setCnpjValue(formatted)
    setFormData((prev) => ({ ...prev, cnpj: formatted.replace(/\D/g, "") }))

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
      })
    } catch (error) {
      setCnpjValidation({
        status: "invalid",
        message: "Erro ao validar CNPJ. Tente novamente.",
      })
    }
  }

  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value)
    setCpfValue(formatted)
    setFormData((prev) => ({ ...prev, cpf: formatted.replace(/\D/g, "") }))

    if (!formatted || formatted.replace(/\D/g, "").length < 11) {
      setCpfValidation({ status: "idle", message: "" })
      return
    }

    if (!validateCPFFormat(formatted)) {
      setCpfValidation({ status: "invalid", message: "Formato de CPF invalido" })
      return
    }

    const isValid = validateCPF(formatted.replace(/\D/g, ""))
    if (isValid) {
      setCpfValidation({ status: "valid", message: "CPF valido" })
    } else {
      setCpfValidation({ status: "invalid", message: "CPF invalido" })
    }
  }

  const handleRGChange = (value: string) => {
    const formatted = formatRG(value)
    setRgValue(formatted)
    setFormData((prev) => ({ ...prev, rg: formatted.replace(/\D/g, "") }))

    if (!formatted || formatted.replace(/\D/g, "").length < 7) {
      setRgValidation({ status: "idle", message: "" })
      return
    }

    if (!validateRGFormat(formatted)) {
      setRgValidation({ status: "invalid", message: "Formato de RG invalido" })
      return
    }

    const isValid = validateRG(formatted.replace(/\D/g, ""))
    if (isValid) {
      setRgValidation({ status: "valid", message: "RG valido" })
    } else {
      setRgValidation({ status: "invalid", message: "RG invalido" })
    }
  }

  const handleSpecialtiesChange = (values: string[]) => {
    const labels = values.map(value => SPECIALTY_OPTIONS.find(opt => opt.value === value)?.label || value)
    setFormData((prev) => ({ ...prev, specialties: labels.join(", ") }))
  }

  const handlePaymentMethodsChange = (values: string[]) => {
    const labels = values.map(value => PAYMENT_METHOD_OPTIONS.find(opt => opt.value === value)?.label || value)
    setFormData((prev) => ({ ...prev, payment_methods: labels.join(", ") }))
  }

  const handleLanguagesChange = (values: string[]) => {
    const labels = values.map(value => LANGUAGE_OPTIONS.find(opt => opt.value === value)?.label || value)
    setFormData((prev) => ({ ...prev, consultation_languages: labels.join(", ") }))
  }

  // Funções para anamnese nutricional
  const handleAnamneseChange = (field: string, value: any) => {
    setAnamneseData((prev: any) => ({
      ...prev,
      [field]: value
    }))

    // Sincronizar preferências alimentares com o perfil do paciente
    if (field === "preferencias_alimentares" && userType === "paciente") {
      setFormData((prev: any) => ({
        ...prev,
        dietary_preferences: value
      }))
    }
  }

  // Função para formatar peso automaticamente
  const formatPeso = (value: string) => {
    // Remove caracteres não numéricos
    const numericValue = value.replace(/[^\d]/g, "")
    
    if (numericValue.length === 0) return ""
    if (numericValue.length === 1) return numericValue
    if (numericValue.length === 2) return numericValue
    
    // Adiciona ponto antes do último dígito para valores com 3+ dígitos
    const integerPart = numericValue.slice(0, -1)
    const decimalPart = numericValue.slice(-1)
    
    return `${integerPart}.${decimalPart}`
  }

  // Função para formatar altura automaticamente
  const formatAltura = (value: string) => {
    // Remove caracteres não numéricos
    const numericValue = value.replace(/[^\d]/g, "")
    
    if (numericValue.length === 0) return ""
    if (numericValue.length === 1) return `1.${numericValue}`
    if (numericValue.length === 2) return `1.${numericValue}`
    
    // Para valores com 3 dígitos, formato 1.XX
    if (numericValue.length === 3) {
      return `${numericValue[0]}.${numericValue.slice(1)}`
    }
    
    return value
  }

  // Handlers específicos para peso e altura
  const handlePesoAnamneseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    
    // Se o usuário está apagando, permitir
    if (rawValue === "") {
      handleAnamneseChange("peso_atual", "")
      return
    }
    
    // Aplicar formatação apenas se necessário
    const formattedValue = formatPeso(rawValue)
    const numericValue = parseFloat(formattedValue) || 0
    
    // Atualizar com o valor formatado para exibição
    handleAnamneseChange("peso_atual", formattedValue)
  }

  const handleAlturaAnamneseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    
    // Se o usuário está apagando, permitir
    if (rawValue === "") {
      handleAnamneseChange("altura", "")
      return
    }
    
    // Aplicar formatação apenas se necessário
    const formattedValue = formatAltura(rawValue)
    const numericValue = parseFloat(formattedValue) || 0
    
    // Atualizar com o valor formatado para exibição
    handleAnamneseChange("altura", formattedValue)
  }

  const calculateIMC = (peso: number, altura: number) => {
    if (peso && altura) {
      const imc = peso / (altura * altura)
      return Math.round(imc * 100) / 100
    }
    return 0
  }

  // Atualizar IMC automaticamente quando peso ou altura mudam
  useEffect(() => {
    if (anamneseData.peso_atual && anamneseData.altura) {
      const imc = calculateIMC(anamneseData.peso_atual, anamneseData.altura)
      // Só atualizar se o IMC realmente mudou para evitar loops infinitos
      if (anamneseData.imc !== imc) {
        setAnamneseData((prev: any) => ({ ...prev, imc }))
      }
    }
  }, [anamneseData.peso_atual, anamneseData.altura, anamneseData.imc])

  const handleComorbilidadesChange = (values: string[]) => {
    setAnamneseData((prev: any) => ({ ...prev, comorbidades: values }))
  }

  const handleAlergiasAnamneseChange = (values: string[]) => {
    setAnamneseData((prev: any) => ({ ...prev, alergias_alimentares: values }))
  }



  // Função de validação para página 3 (anamnese nutricional)
  const validatePage3 = () => {
    if (userType !== "paciente") return true
    
    // Verificar se pelo menos um objetivo foi selecionado
    const hasObjectives = anamneseData?.objetivos_nutricionais && anamneseData.objetivos_nutricionais.length > 0
    
    // Se "outro" foi selecionado, verificar se o campo personalizado foi preenchido
    const hasOtherObjective = anamneseData?.objetivos_nutricionais?.includes("outro")
    const hasCustomObjective = hasOtherObjective ? anamneseData?.objetivo_personalizado?.trim() : true
    
    // Verificar campos obrigatórios
    const hasRequiredFields = anamneseData?.peso_atual && anamneseData?.altura
    
    return hasObjectives && hasCustomObjective && hasRequiredFields
  }

  // Funções de navegação da paginação
  const nextPage = () => {
    // Validar página atual antes de avançar
    if (currentPage === 3 && userType === "paciente") {
      if (!validatePage3()) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha todos os campos obrigatórios da anamnese nutricional.",
          variant: "destructive",
        })
        return
      }
    }
    
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validar anamnese nutricional para pacientes
    if (userType === "paciente" && !validatePage3()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios da anamnese nutricional.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      const dataToSubmit = { ...formData }

      // Processamento específico para pacientes foi removido pois os dados
      // de condições de saúde, alergias e preferências alimentares agora
      // são coletados através da anamnese nutricional

      if (userType === "nutricionista") {
        if (typeof dataToSubmit.specialties === "string") {
          dataToSubmit.specialties = dataToSubmit.specialties
            .split(",")
            .map((item: string) => item.trim())
            .filter(Boolean)
        }
        
        // Para horários disponíveis, convertemos o objeto do ScheduleSelector em um array simples de horários:
        if (typeof dataToSubmit.available_times === "string") {
          try {
            // Tenta fazer parse do JSON do ScheduleSelector
            const parsed = JSON.parse(dataToSubmit.available_times)
            // Converte o objeto de dias/horários em array simples de horários
            const timeSlots: string[] = []
            Object.values(parsed).forEach((daySlots: any) => {
              if (Array.isArray(daySlots)) {
                daySlots.forEach((slot: any) => {
                  if (slot.start && !timeSlots.includes(slot.start)) {
                    timeSlots.push(slot.start)
                  }
                  if (slot.end && !timeSlots.includes(slot.end)) {
                    timeSlots.push(slot.end)
                  }
                })
              }
            })
            // Ordena os horários e remove duplicatas
            dataToSubmit.available_times = timeSlots.sort()
          } catch {
            // Se falhar, usa array vazio
            dataToSubmit.available_times = []
          }
        }
        
        // Função helper para processar campos que podem estar com escape duplo
        const processStringField = (field: string): string[] => {
          // Remover escapes duplos se existirem
          const cleanField = field.replace(/\\"/g, """)
          
          // Tentar fazer parse JSON primeiro
          try {
            const parsed = JSON.parse(cleanField)
            if (Array.isArray(parsed)) {
              return parsed
            }
          } catch {
            // Se não for JSON válido, tratar como string separada por vírgulas
          }
          
          return cleanField
            .split(",")
            .map((item: string) => item.trim())
            .filter(Boolean)
        }

        if (typeof dataToSubmit.languages === "string") {
          dataToSubmit.languages = processStringField(dataToSubmit.languages)
        }
        if (typeof dataToSubmit.certifications === "string") {
          dataToSubmit.certifications = processStringField(dataToSubmit.certifications)
        }
        if (typeof dataToSubmit.achievements === "string") {
          dataToSubmit.achievements = processStringField(dataToSubmit.achievements)
        }
      }

      await updateUserProfile(userId, userType, dataToSubmit)

      // Salvar anamnese nutricional se for paciente
      if (userType === "paciente" && anamneseData) {
        try {
          const { data: existingAnamnese } = await supabase
            .from("anamnese_nutricional")
            .select("id")
            .eq("patient_id", userId)
            .single()

          const anamneseToSave = {
            ...anamneseData,
            patient_id: userId,
            parte1_concluida: true,
            parte2_concluida: true,
            updated_at: new Date().toISOString()
          }

          if (existingAnamnese) {
            await supabase
              .from("anamnese_nutricional")
              .update(anamneseToSave)
              .eq("patient_id", userId)
          } else {
            await supabase
              .from("anamnese_nutricional")
              .insert(anamneseToSave)
          }

          // Sincronizar preferências alimentares com o perfil do paciente
          if (anamneseData.preferencias_alimentares) {
            await supabase
              .from("patient_profiles")
              .update({ dietary_preferences: anamneseData.preferencias_alimentares })
              .eq("user_id", userId)
          }
        } catch (anamneseError) {
          console.error("Erro ao salvar anamnese:", anamneseError)
          // Não bloquear o salvamento do perfil por erro na anamnese
        }
      }

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      })

      onProfileUpdate?.()
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || "Erro ao salvar perfil.")
      toast({
        title: "Erro ao atualizar perfil",
        description: err.message || "Ocorreu um erro ao salvar suas informações.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

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
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case "valid":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "invalid":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const renderCPFValidationIcon = () => {
    switch (cpfValidation.status) {
      case "valid":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "invalid":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const renderRGValidationIcon = () => {
    switch (rgValidation.status) {
      case "valid":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "invalid":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  // Não renderizar o modal se não houver dados iniciais
  if (!initialData) {
    return null
  }

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

        <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4 mb-6">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={
                    userType === "empresa"
                      ? formData?.logo_url || "/placeholder.svg?height=96&width=96&query=company logo"
                      : formData?.profile_image_url || "/placeholder.svg?height=96&width=96&query=user profile"
                  }
                  alt={userType === "empresa" ? (formData?.company_name || "Profile Image") : (formData?.full_name || "Profile Image")}
                  key={userType === "empresa" ? formData?.logo_url : formData?.profile_image_url}
                />
                <AvatarFallback className="bg-gray-200 text-gray-600 text-2xl font-semibold">
                  {userType === "empresa" 
                    ? (formData?.company_name?.charAt(0).toUpperCase() || "E")
                    : (formData?.full_name?.charAt(0).toUpperCase() || "U")
                  }
                </AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-semibold text-gray-900">
                {userType === "empresa" ? "Logo da Empresa" : "Foto de Perfil"}
              </h3>
              {(userType === "empresa" ? formData?.logo_url : formData?.profile_image_url) && (
                <p className="text-xs text-gray-500 text-center max-w-xs truncate">
                  Imagem atual: {userType === "empresa" ? formData?.logo_url : formData?.profile_image_url}
                </p>
              )}
            </div>
            
            <div className="max-w-md mx-auto">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Enviar {userType === "empresa" ? "logo" : "foto"} do computador
              </Label>
              <ImageUpload
                onImageUploaded={handleImageUploaded}
                onImageRemoved={handleImageRemoved}
                currentImageUrl={userType === "empresa" ? formData?.logo_url : formData?.profile_image_url}
                userId={userId}
                className="w-full"
              />
            </div>

            <div className="max-w-md mx-auto">
              <Label htmlFor="profile_image_url" className="text-sm font-medium text-gray-700 mb-2 block">
                Ou inserir URL da imagem
              </Label>
              <div className="relative">
                <Input
                  id={userType === "empresa" ? "logo_url" : "profile_image_url"}
                  value={userType === "empresa" ? formData?.logo_url || "" : formData?.profile_image_url || ""}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input id="full_name" value={formData?.full_name || ""} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={formData?.phone || ""} onChange={handleChange} placeholder="(XX) XXXXX-XXXX" />
            </div>
          </div>

          {(userType === "paciente" || userType === "nutricionista") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cpf">CPF</Label>
                <div className="relative">
                  <Input
                    id="cpf"
                    value={cpfValue}
                    onChange={(e) => handleCPFChange(e.target.value)}
                    placeholder="XXX.XXX.XXX-XX"
                    className={
                      cpfValidation.status === "invalid"
                        ? "border-red-500 focus-visible:ring-red-500"
                        : cpfValidation.status === "valid"
                          ? "border-green-500 focus-visible:ring-green-500"
                          : ""
                    }
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">{renderCPFValidationIcon()}</div>
                </div>
                {cpfValidation.message && (
                  <p
                    className={`text-sm mt-1 ${cpfValidation.status === "invalid" ? "text-red-500" : "text-green-500"}`}
                  >
                    {cpfValidation.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="rg">RG</Label>
                <div className="relative">
                  <Input
                    id="rg"
                    value={rgValue}
                    onChange={(e) => handleRGChange(e.target.value)}
                    placeholder="XX.XXX.XXX-X"
                    className={
                      rgValidation.status === "invalid"
                        ? "border-red-500 focus-visible:ring-red-500"
                        : rgValidation.status === "valid"
                          ? "border-green-500 focus-visible:ring-green-500"
                          : ""
                    }
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">{renderRGValidationIcon()}</div>
                </div>
                {rgValidation.message && (
                  <p
                    className={`text-sm mt-1 ${rgValidation.status === "invalid" ? "text-red-500" : "text-green-500"}`}
                  >
                    {rgValidation.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {userType === "paciente" && (
            <>
              {/* Campo Data de Nascimento - sempre visível */}
              <div className="mb-4">
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input id="birth_date" type="date" value={formData?.birth_date || ""} onChange={handleChange} />
              </div>

              {/* Indicador de página */}
              <div className="flex justify-center items-center gap-2 mb-4">
                <span className="text-sm text-gray-500">
                  Página {currentPage} de {totalPages}
                </span>
              </div>

              {/* Página 1 - Dados Pessoais */}
              {currentPage === 1 && (
                <>
                  <div className="text-center text-gray-600">
                    <p>Complete as próximas páginas com suas informações nutricionais.</p>
                  </div>
                </>
              )}

              {/* Página 2 - Anamnese Nutricional Parte 1 */}
              {currentPage === 2 && (
                <>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Anamnese Nutricional - Informações Básicas</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="anamnese_genero">Gênero</Label>
                        <select
                          id="anamnese_genero"
                          value={anamneseData?.genero || ""}
                          onChange={(e) => handleAnamneseChange("genero", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Selecione</option>
                          {GENERO_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="anamnese_email">E-mail</Label>
                        <Input
                          id="anamnese_email"
                          type="email"
                          value={anamneseData?.email || ""}
                          onChange={(e) => handleAnamneseChange("email", e.target.value)}
                          placeholder="email@exemplo.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="anamnese_instagram">Instagram</Label>
                        <Input
                          id="anamnese_instagram"
                          value={anamneseData?.instagram || ""}
                          onChange={(e) => handleAnamneseChange("instagram", e.target.value)}
                          placeholder="@seuinstagram"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="anamnese_cidade">Cidade</Label>
                        <Input
                          id="anamnese_cidade"
                          value={anamneseData?.cidade || ""}
                          onChange={(e) => handleAnamneseChange("cidade", e.target.value)}
                          placeholder="Sua cidade"
                        />
                      </div>
                      <div>
                        <Label htmlFor="anamnese_estado">Estado</Label>
                        <Input
                          id="anamnese_estado"
                          value={anamneseData?.estado || ""}
                          onChange={(e) => handleAnamneseChange("estado", e.target.value)}
                          placeholder="Seu estado"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Página 3 - Anamnese Nutricional Parte 2 */}
              {currentPage === 3 && (
                <>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Anamnese Nutricional - Dados Clínicos</h3>
                    
                    <div>
                      <Label>Objetivos Nutricionais</Label>
                      <MultiSelect
                        options={OBJETIVO_NUTRICIONAL_OPTIONS}
                        selected={anamneseData?.objetivos_nutricionais || []}
                        onChange={(selected) => handleAnamneseChange("objetivos_nutricionais", selected)}
                        placeholder="Selecione seus objetivos nutricionais"
                      />
                      {anamneseData?.objetivos_nutricionais?.includes("outro") && (
                        <div className="mt-2">
                          <Label htmlFor="objetivo_personalizado">Especifique seu objetivo personalizado</Label>
                          <Input
                            id="objetivo_personalizado"
                            value={anamneseData?.objetivo_personalizado || ""}
                            onChange={(e) => handleAnamneseChange("objetivo_personalizado", e.target.value)}
                            placeholder="Descreva seu objetivo específico..."
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="anamnese_peso">Peso Atual (kg)</Label>
                        <Input
                          id="anamnese_peso"
                          type="text"
                          value={anamneseData?.peso_atual || ""}
                          onChange={handlePesoAnamneseChange}
                          placeholder="Ex: 70.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="anamnese_altura">Altura (m)</Label>
                        <Input
                          id="anamnese_altura"
                          type="text"
                          value={anamneseData?.altura || ""}
                          onChange={handleAlturaAnamneseChange}
                          placeholder="Ex: 1.70"
                        />
                      </div>
                      <div>
                        <Label htmlFor="anamnese_imc">IMC</Label>
                        <Input
                          id="anamnese_imc"
                          type="number"
                          value={anamneseData?.imc || ""}
                          readOnly
                          className="bg-gray-100"
                          placeholder="Calculado automaticamente"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="anamnese_historico_peso">Histórico de Peso</Label>
                      <Textarea
                        id="anamnese_historico_peso"
                        value={anamneseData?.historico_peso || ""}
                        onChange={(e) => handleAnamneseChange("historico_peso", e.target.value)}
                        placeholder="Descreva seu histórico de peso, variações, dietas anteriores..."
                      />
                    </div>

                    <div>
                      <Label>Comorbidades</Label>
                      <MultiSelect
                        options={COMORBIDADES_OPTIONS}
                        selected={anamneseData?.comorbidades || []}
                        onChange={handleComorbilidadesChange}
                        placeholder="Selecione as comorbidades"
                      />
                    </div>

                    <div>
                      <Label>Alergias Alimentares</Label>
                      <MultiSelect
                        options={ALERGIAS_ANAMNESE_OPTIONS}
                        selected={anamneseData?.alergias_alimentares || []}
                        onChange={handleAlergiasAnamneseChange}
                        placeholder="Selecione as alergias alimentares"
                      />
                    </div>

                    <div>
                      <Label>Preferências Alimentares</Label>
                      <MultiSelect
                        options={PREFERENCIAS_ALIMENTARES_OPTIONS}
                        selected={anamneseData?.preferencias_alimentares || []}
                        onChange={(selected) => handleAnamneseChange("preferencias_alimentares", selected)}
                        placeholder="Selecione suas preferências alimentares"
                      />
                    </div>

                    <div>
                      <Label htmlFor="anamnese_suplementacao">Suplementação Atual</Label>
                      <Textarea
                        id="anamnese_suplementacao"
                        value={anamneseData?.suplementacao_atual || ""}
                        onChange={(e) => handleAnamneseChange("suplementacao_atual", e.target.value)}
                        placeholder="Liste os suplementos que você usa atualmente..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="anamnese_medicacoes">Medicações em Uso</Label>
                      <Textarea
                        id="anamnese_medicacoes"
                        value={anamneseData?.medicacoes_uso || ""}
                        onChange={(e) => handleAnamneseChange("medicacoes_uso", e.target.value)}
                        placeholder="Liste as medicações que você usa atualmente..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="anamnese_exames">Exames Laboratoriais Recentes</Label>
                      <Textarea
                        id="anamnese_exames"
                        value={anamneseData?.exames_laboratoriais || ""}
                        onChange={(e) => handleAnamneseChange("exames_laboratoriais", e.target.value)}
                        placeholder="Descreva os resultados dos seus exames mais recentes..."
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {userType === "nutricionista" && (
            <>
              {/* Indicador de página */}
              <div className="flex justify-center items-center gap-2 mb-4">
                <span className="text-sm text-gray-500">
                  Página {currentPage} de {totalPages}
                </span>
              </div>

              {/* Página 1 */}
              {currentPage === 1 && (
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

                  <div>
                    <Label htmlFor="bio">Biografia</Label>
                    <Textarea
                      id="bio"
                      value={formData?.bio || ""}
                      onChange={handleChange}
                      placeholder="Fale um pouco sobre voce e sua abordagem..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                    <Label htmlFor="experience_years">Anos de Experiência</Label>
                    <Input
                      id="experience_years"
                      type="number"
                      min="0"
                      max="50"
                      value={formData?.experience_years || ""}
                      onChange={handleChange}
                      placeholder="Ex: 5"
                    />
                  </div>
                    <div>
                      <Label htmlFor="consultation_price">Preço da Consulta (R$)</Label>
                      <Input
                        id="consultation_price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData?.consultation_price || ""}
                        onChange={handleChange}
                        placeholder="Ex: 150.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Modalidades de Atendimento</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="online_consultation_available"
                        checked={formData?.online_consultation_available || false}
                        onChange={handleChange}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="online_consultation_available" className="text-sm font-normal">
                        Atendimento Online Disponível
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="online_only_consultation"
                        checked={formData?.online_only_consultation || false}
                        onChange={handleChange}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="online_only_consultation" className="text-sm font-normal">
                        Somente Atendimento Online (Teleconsulta)
                      </Label>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="academic_background">Formação Acadêmica</Label>
                    <Textarea
                      id="academic_background"
                      value={formData?.academic_background || ""}
                      onChange={handleChange}
                      placeholder="Ex: Graduação em Nutrição pela USP, Pós-graduação em Nutrição Clínica..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Endereço do Consultório</Label>
                    <Textarea
                      id="address"
                      value={formData?.address || ""}
                      onChange={handleChange}
                      placeholder="Rua, número, bairro, cidade, CEP"
                    />
                  </div>

                  <div>
                    <Label htmlFor="specialties">Especialidades</Label>
                    <MultiSelect
                      options={SPECIALTY_OPTIONS}
                      selected={formData?.specialties && typeof formData.specialties === "string" ? formData.specialties.split(", ").filter(Boolean).map(label => SPECIALTY_OPTIONS.find(opt => opt.label === label)?.value || label) : []}
                      onChange={handleSpecialtiesChange}
                      placeholder="Selecione suas especialidades"
                    />
                  </div>

                  <div>
                    <Label htmlFor="consultation_languages">Idiomas de Atendimento</Label>
                    <MultiSelect
                      options={LANGUAGE_OPTIONS}
                      selected={formData?.consultation_languages && typeof formData.consultation_languages === "string" ? formData.consultation_languages.split(", ").filter(Boolean).map(label => LANGUAGE_OPTIONS.find(opt => opt.label === label)?.value || label) : []}
                      onChange={handleLanguagesChange}
                      placeholder="Selecione os idiomas"
                    />
                  </div>

                  <div>
                    <Label htmlFor="payment_methods">Métodos de Pagamento</Label>
                    <MultiSelect
                      options={PAYMENT_METHOD_OPTIONS}
                      selected={formData?.payment_methods && typeof formData.payment_methods === "string" ? formData.payment_methods.split(", ").filter(Boolean).map(label => PAYMENT_METHOD_OPTIONS.find(opt => opt.label === label)?.value || label) : []}
                      onChange={handlePaymentMethodsChange}
                      placeholder="Selecione os métodos"
                    />
                  </div>

                  <div>
                    <Label htmlFor="available_times">Horários Disponíveis</Label>
                    <ScheduleSelector
                      value={formData?.available_times || "{}"}
                      onChange={(value) => setFormData((prev) => ({ ...prev, available_times: value }))}
                      placeholder="Configure seus horários de atendimento"
                    />
                  </div>
                </>
              )}

              {/* Página 2 */}
              {currentPage === 2 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="default_consultation_duration">Duração Padrão das Consultas (minutos)</Label>
                      <Input
                        id="default_consultation_duration"
                        type="number"
                        min="15"
                        max="180"
                        step="15"
                        value={formData?.default_consultation_duration || ""}
                        onChange={handleChange}
                        placeholder="Ex: 60"
                      />
                    </div>
                    <div>
                      <Label htmlFor="min_time_between_appointments">Tempo Mínimo Entre Agendamentos (minutos)</Label>
                      <Input
                        id="min_time_between_appointments"
                        type="number"
                        min="0"
                        max="60"
                        step="5"
                        value={formData?.min_time_between_appointments || ""}
                        onChange={handleChange}
                        placeholder="Ex: 15"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="website_url">Website</Label>
                    <Input
                      id="website_url"
                      type="url"
                      value={formData?.website_url || ""}
                      onChange={handleChange}
                      placeholder="https://seusite.com.br"
                    />
                  </div>

                  <div>
                    <Label htmlFor="certifications">Certificações</Label>
                    <Textarea
                      id="certifications"
                      value={formData?.certifications || ""}
                      onChange={handleChange}
                      placeholder="Liste suas certificações, cursos e especializações..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="achievements">Conquistas</Label>
                    <Textarea
                      id="achievements"
                      value={formData?.achievements || ""}
                      onChange={handleChange}
                      placeholder="Prêmios, reconhecimentos, publicações..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="instagram_username">Instagram</Label>
                      <Input
                        id="instagram_username"
                        value={formData?.instagram_username || ""}
                        onChange={handleChange}
                        placeholder="@seuinstagram"
                      />
                    </div>
                    <div>
                      <Label htmlFor="linkedin_username">LinkedIn</Label>
                      <Input
                        id="linkedin_username"
                        value={formData?.linkedin_username || ""}
                        onChange={handleChange}
                        placeholder="https://linkedin.com/in/seuperfil"
                      />
                    </div>
                  </div>
                </>
              )}

            </>
          )}
        </form>

        {/* Navegação entre páginas - movida para fora do form */}
        {isEditing && (
          <div className="flex justify-between items-center mt-6 px-6">
            <Button
              type="button"
              variant="outline"
              onClick={prevPage}
              disabled={currentPage === 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            
            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i + 1}
                  type="button"
                  variant={currentPage === i + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(i + 1)}
                  className="w-8 h-8 rounded-full text-sm font-medium"
                >
                  {i + 1}
                </Button>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2"
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="profile-form" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
