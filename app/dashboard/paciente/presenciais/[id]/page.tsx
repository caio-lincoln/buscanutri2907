"use client"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { openConversationWithNutritionist } from "@/lib/chat-forum-service"

interface Address {
  street?: string
  number?: string
  complement?: string
  city?: string
  state?: string
  zip_code?: string
}

interface PersonProfile {
  id: string
  user_id?: string
  full_name: string
  profile_image_url?: string | null
  address?: Address | null
}

interface ConsultationDetails {
  id: string
  scheduled_at: string
  duration_minutes: number
  status: string
  type: string
  patient_notes?: string | null
  nutritionist_id: string
  patient_id: string
  nutritionist?: PersonProfile
  patient?: PersonProfile
}

interface NutritionistApiData extends PersonProfile {
  phone?: string | null
  specialties?: string[]
  rating?: number
  total_reviews?: number
}

function sanitizePhoneForWhatsApp(raw?: string | null): string | null {
  if (!raw) return null
  // Remove tudo que não é dígito
  const digits = raw.replace(/\D+/g, "")
  if (!digits) return null
  // Garante código do Brasil (55)
  if (digits.startsWith("55")) return digits
  return `55${digits}`
}

export default function PresencialDetailsPage(props: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseClient(), [])
  const [consultation, setConsultation] = useState<ConsultationDetails | null>(null)
  const [nutritionistInfo, setNutritionistInfo] = useState<NutritionistApiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chatLoading, setChatLoading] = useState(false)

  // Next.js: params is now a Promise in Client Components
  const { id } = React.use(props.params)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Carrega a consulta presencial pelo ID com joins de perfis
      const { data, error } = await supabase
        .from("in_person_consultations")
        .select(
          `
          id, scheduled_at, duration_minutes, status, type, patient_notes, nutritionist_id, patient_id,
          nutritionist:nutritionist_profiles!in_person_consultations_nutritionist_id_fkey (
            id, user_id, full_name, profile_image_url, address
          ),
          patient:patient_profiles!in_person_consultations_patient_id_fkey ( id, user_id, full_name, profile_image_url )
        `
        )
        .eq("id", id)
        .maybeSingle()

      if (error || !data) {
        throw new Error("Consulta não encontrada")
      }

      setConsultation(data as unknown as ConsultationDetails)

      // Buscar dados completos do nutricionista pela API (inclui phone)
      const nutUserId = (data as any)?.nutritionist?.user_id
      if (nutUserId) {
        const resp = await fetch(`/api/nutritionists/${nutUserId}`)
        if (resp.ok) {
          const json = await resp.json()
          setNutritionistInfo(json?.nutritionist || null)
        }
      }
    } catch (e: any) {
      setError(e?.message || "Erro ao carregar detalhes")
    } finally {
      setLoading(false)
    }
  }, [id, supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  const whatsappHref = useMemo(() => {
    const phone = sanitizePhoneForWhatsApp(nutritionistInfo?.phone || null)
    if (!phone) return null
    const msg = encodeURIComponent(
      `Olá, gostaria de confirmar minha consulta presencial. Identificador: ${consultation?.id}`
    )
    return `https://wa.me/${phone}?text=${msg}`
  }, [nutritionistInfo?.phone, consultation?.id])

  const startChat = useCallback(async () => {
    if (!consultation?.nutritionist?.id) return
    try {
      setChatLoading(true)
      const conversationId = await openConversationWithNutritionist(consultation.nutritionist.id)
      if (conversationId) {
        router.push(`/dashboard/paciente/chat/${conversationId}`)
      }
    } catch (e) {
      // Silenciar erros para UX simples
    } finally {
      setChatLoading(false)
    }
  }, [consultation?.nutritionist?.id, router])

  if (loading) {
    return (
      <div className="p-6">
        <p>Carregando detalhes...</p>
      </div>
    )
  }

  if (error || !consultation) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error || "Erro ao carregar consulta"}</p>
        <Button className="mt-4" onClick={() => router.push("/dashboard/paciente/presenciais")}>Voltar</Button>
      </div>
    )
  }

  const dt = new Date(consultation.scheduled_at)
  const dateText = format(dt, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Detalhes da Consulta Presencial</h1>
        <Button variant="outline" onClick={() => router.push("/dashboard/paciente/presenciais")}>Voltar</Button>
      </div>

      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-4">
          <Image
            src={consultation.nutritionist?.profile_image_url || "/placeholder.jpg"}
            alt={consultation.nutritionist?.full_name || "Nutricionista"}
            width={64}
            height={64}
            className="rounded-full object-cover"
          />
          <div>
            <p className="font-medium">{consultation.nutritionist?.full_name}</p>
            <p className="text-sm text-muted-foreground">{dateText}</p>
          </div>
        </div>

        {consultation.nutritionist?.address && (
          <div className="text-sm">
            <p className="font-medium">Endereço</p>
            <p>
              {consultation.nutritionist.address.street || ""}
              {consultation.nutritionist.address.number ? `, ${consultation.nutritionist.address.number}` : ""}
              {consultation.nutritionist.address.complement ? ` - ${consultation.nutritionist.address.complement}` : ""}
            </p>
            <p>
              {[consultation.nutritionist.address.city, consultation.nutritionist.address.state, consultation.nutritionist.address.zip_code]
                .filter(Boolean)
                .join(" - ")}
            </p>
          </div>
        )}

        {consultation.patient_notes && (
          <div>
            <p className="font-medium">Observações do paciente</p>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{consultation.patient_notes}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <Link
            href={`/nutricionistas/${consultation.nutritionist?.id}`}
            className="inline-flex"
          >
            <Button variant="secondary">Ver perfil</Button>
          </Link>

          <Button onClick={startChat} disabled={chatLoading}>
            {chatLoading ? "Abrindo chat..." : "Enviar mensagem pelo Chat"}
          </Button>

          {whatsappHref ? (
            <Link href={whatsappHref} target="_blank" className="inline-flex">
              <Button variant="default">WhatsApp</Button>
            </Link>
          ) : (
            <Button variant="ghost" disabled>
              WhatsApp indisponível
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}