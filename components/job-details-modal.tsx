"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { MapPin, DollarSign, Briefcase, Clock, Users, Building, CheckCircle, Heart, Share2 } from "lucide-react"
import { createSupabaseClient } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

interface JobPosting {
  id: string
  title: string
  description: string
  requirements: string[]
  benefits: string[]
  salary_min?: number
  salary_max?: number
  location: string
  job_type: "CLT" | "PJ" | "Estágio" | "Freelancer"
  level: "Estagiário" | "Júnior" | "Pleno" | "Sênior" | "Gerente"
  status: "ativa" | "pausada" | "fechada"
  applications_count: number
  created_at: string
  company_id: string
  company_profiles?: {
    company_name: string
    logo_url?: string
  } | null
}

interface JobDetailsModalProps {
  job: JobPosting
  isOpen: boolean
  onClose: () => void
}

export function JobDetailsModal({ job, isOpen, onClose }: JobDetailsModalProps) {
  const [isApplying, setIsApplying] = useState(false)
  const { user } = useAuth()
  const supabase = createSupabaseClient()

  const formatSalaryRange = (job: JobPosting) => {
    if (job.salary_min && job.salary_max) {
      return `R$ ${job.salary_min.toLocaleString()} - R$ ${job.salary_max.toLocaleString()}`
    } else if (job.salary_min) {
      return `A partir de R$ ${job.salary_min.toLocaleString()}`
    } else if (job.salary_max) {
      return `Até R$ ${job.salary_max.toLocaleString()}`
    }
    return "Salário a combinar"
  }

  const handleApply = async () => {
    console.log("🔄 Iniciando candidatura...")
    console.log("👤 Usuário atual:", user)
    
    setIsApplying(true)
    try {
      if (!user) {
        console.log("❌ Usuário não autenticado")
        toast.error("Para se candidatar, você precisa estar logado.")
        return
      }

      // Verificar se o usuário é nutricionista
      if (user.user_type !== "nutricionista") {
        console.log("❌ Usuário não é nutricionista:", user.user_type)
        toast.error("Apenas nutricionistas podem se candidatar às vagas.")
        return
      }

      console.log("✅ Usuário autenticado como nutricionista")
      console.log("🔍 Buscando perfil do nutricionista...")

      // Buscar o perfil do nutricionista para obter o ID correto
      const { data: nutritionistProfile, error: profileError } = await supabase
        .from("nutritionist_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (profileError || !nutritionistProfile) {
        console.error("❌ Erro ao buscar perfil do nutricionista:", profileError)
        toast.error("Perfil de nutricionista não encontrado. Complete seu cadastro primeiro.")
        return
      }

      console.log("✅ Perfil do nutricionista encontrado:", nutritionistProfile.id)
      console.log("🔍 Verificando candidatura existente...")

      // Verificar se já se candidatou
      const { data: existingApplication, error: checkError } = await supabase
        .from("job_applications")
        .select("id")
        .eq("job_id", job.id)
        .eq("candidate_id", nutritionistProfile.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error("❌ Erro ao verificar candidatura existente:", checkError)
        throw checkError
      }

      if (existingApplication) {
        console.log("⚠️ Candidatura já existe")
        toast.warning("Você já se candidatou a esta vaga!")
        return
      }

      console.log("✅ Criando nova candidatura...")

      // Criar candidatura
      const { error } = await supabase.from("job_applications").insert({
        job_id: job.id,
        candidate_id: nutritionistProfile.id,
        status: "pendente",
        applied_at: new Date().toISOString(),
      })

      if (error) {
        console.error("❌ Erro ao criar candidatura:", error)
        throw error
      }

      console.log("✅ Candidatura criada com sucesso!")
      toast.success("Candidatura enviada com sucesso!")
      onClose()
    } catch (error) {
      console.error("💥 Erro geral na candidatura:", error)
      toast.error("Erro ao enviar candidatura. Tente novamente.")
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Vaga</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header da Vaga */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-[#1E1D40] rounded-lg flex items-center justify-center flex-shrink-0">
              {job.company_profiles?.logo_url ? (
                <Image
                  src={job.company_profiles.logo_url || "/placeholder.svg"}
                  alt={job.company_profiles.company_name ?? "Logo da empresa"}
                  width={64}
                  height={64}
                  className="rounded-lg object-cover"
                  unoptimized
                />
              ) : (
                <Building className="h-8 w-8 text-white" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-[#1E1D40] mb-2">{job.title}</h1>
                  <p className="text-lg text-orange-600 font-medium mb-2">
                    🏢 {job.company_profiles?.company_name ?? "Empresa confidencial"}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-[#1E1D40]/70">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      <span>{job.job_type}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Publicada em {new Date(job.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-medium">
                    {job.level}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Conteúdo Principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Descrição */}
              <div>
                <h2 className="text-xl font-semibold text-[#1E1D40] mb-3">Sobre a Vaga</h2>
                <p className="text-[#1E1D40]/80 leading-relaxed whitespace-pre-line">{job.description}</p>
              </div>

              {/* Requisitos */}
              {job.requirements && job.requirements.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-[#1E1D40] mb-3">Requisitos</h2>
                  <ul className="space-y-2">
                    {job.requirements.map((requirement, index) => (
                      <li key={`requirement-${job.id}-${index}-${requirement.slice(0, 20)}`} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-[#1E1D40]/80">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benefícios */}
              {job.benefits && job.benefits.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-[#1E1D40] mb-3">Benefícios</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {job.benefits.map((benefit, index) => (
                      <div key={`benefit-${job.id}-${index}-${benefit.slice(0, 20)}`} className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-[#1E1D40]">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Card de Candidatura */}
              <div className="bg-[#1E1D40] text-white p-6 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-5 w-5" />
                      <span className="font-medium">Salário</span>
                    </div>
                    <p className="text-orange-300 font-semibold">Faça login para ver</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5" />
                      <span className="font-medium">Candidatos</span>
                    </div>
                    <p className="text-white/80">{job.applications_count} pessoas se candidataram</p>
                  </div>

                  <Button
                    className="w-full bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white"
                    onClick={handleApply}
                    disabled={isApplying}
                  >
                    {isApplying ? "Enviando..." : "Candidatar-se Agora"}
                  </Button>

                  <p className="text-xs text-white/60 text-center">
                    Ao se candidatar, você concorda com nossos{" "}
                    <a href="/termos" className="underline hover:text-white">
                      Termos de Uso
                    </a>
                  </p>
                </div>
              </div>

              {/* Informações da Empresa */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-[#1E1D40] mb-3">Sobre a Empresa</h3>
                <div className="space-y-2">
                  <p className="text-sm text-[#1E1D40]/80">
                    <strong>Nome:</strong> {job.company_profiles?.company_name ?? "Empresa confidencial"}
                  </p>
                  <p className="text-sm text-[#1E1D40]/80">
                    <strong>Localização:</strong> {job.location}
                  </p>
                  <p className="text-sm text-[#1E1D40]/80">
                    <strong>Setor:</strong> Nutrição e Saúde
                  </p>
                </div>
              </div>

              {/* Vagas Similares */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-[#1E1D40] mb-3">Vagas Similares</h3>
                <p className="text-sm text-[#1E1D40]/60">Explore outras oportunidades na área de nutrição</p>
                <Button variant="outline" className="w-full mt-3 bg-transparent" onClick={onClose}>
                  Ver Mais Vagas
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
