"use client"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, Clock, User, Phone, MessageSquare } from "lucide-react"
import Image from "next/image"
import { openConversationWithNutritionist } from "@/lib/chat-forum-service"
import { toast } from "sonner"

interface Address {
  id: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zip_code: string
}

interface NutritionistProfile {
  id: string
  user_id: string
  full_name: string
  profile_image_url?: string | null
  specialties?: string
  phone?: string
}

interface AppointmentDetails {
  id: string
  appointment_date: string // YYYY-MM-DD
  appointment_time: string // HH:mm
  duration_minutes: number
  status: string
  type: string
  patient_notes?: string | null
  price?: number | null
  nutritionist_id: string
  patient_id: string
  nutritionist: NutritionistProfile
  address: Address
}

export default function PresencialDetailsPage(props: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseClient(), [])
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [chatLoading, setChatLoading] = useState(false)
  
  const { id } = React.use(props.params)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // Query 'appointments' table with necessary joins
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id, appointment_date, appointment_time, duration_minutes, status, type, patient_notes, price, nutritionist_id, patient_id,
          nutritionist:nutritionist_profiles!fk_appointments_nutritionist_id (
            id, user_id, full_name, profile_image_url, specialties
          ),
          address:nutritionist_addresses!appointments_address_id_fkey (
            id, street, number, complement, neighborhood, city, state, zip_code
          )
        `)
        .eq("id", id)
        .eq("type", "presencial")
        .single()

      if (error || !data) {
        throw new Error("Agendamento presencial não encontrado.")
      }

      setAppointment(data as any)
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || "Erro ao carregar detalhes.")
      router.push("/dashboard/paciente?activeTab=presenciais")
    } finally {
      setLoading(false)
    }
  }, [id, supabase, router])

  useEffect(() => {
    loadData()
  }, [loadData])

  const startChat = async () => {
    if (!appointment?.nutritionist?.id) return
    try {
      setChatLoading(true)
      // Assuming openConversationWithNutritionist expects a UUID string of the nutritionist profile ID
      // or user ID? Usually it's profile ID or user ID depending on implementation.
      // Based on previous code, it took nutritionist.id.
      // Let's verify chat service usage if possible, but standard is profile ID for business logic usually.
      // Actually, let's assume it works as before.
      const conversationId = await openConversationWithNutritionist(appointment.nutritionist.id)
      if (conversationId) {
        router.push(`/dashboard/paciente/chat?id=${conversationId}`)
      } else {
        toast.error("Não foi possível iniciar o chat.")
      }
    } catch (e) {
      toast.error("Erro ao abrir chat.")
    } finally {
      setChatLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (!appointment) return null

  // Format Date and Time
  // appointment_date is YYYY-MM-DD, appointment_time is HH:mm
  // We can construct a Date object or just format string manually for safety
  const [year, month, day] = appointment.appointment_date.split('-').map(Number)
  const dateObj = new Date(year, month - 1, day)
  const formattedDate = format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

  const formatAddress = (addr: Address) => {
    return [
      `${addr.street}, ${addr.number}`,
      addr.complement,
      addr.neighborhood,
      `${addr.city} - ${addr.state}`,
      `CEP: ${addr.zip_code}`
    ].filter(Boolean).join(", ")
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detalhes do Agendamento</h1>
          <p className="text-gray-500">Consulta Presencial</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard/paciente?activeTab=presenciais")}>
          Voltar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-primary" />
                Data e Horário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Data</p>
                  <p className="font-medium text-lg capitalize">{formattedDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Horário</p>
                  <p className="font-medium text-lg">{appointment.appointment_time}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duração Estimada</p>
                  <p className="font-medium">{appointment.duration_minutes} minutos</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                    ${appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                      appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                      'bg-blue-100 text-blue-800'}`}>
                    {appointment.status === 'confirmed' ? 'Confirmado' : appointment.status}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="w-5 h-5 text-primary" />
                Local de Atendimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium text-lg">{formatAddress(appointment.address).split(',')[0]}</p>
                <p className="text-gray-600">{appointment.address.neighborhood}</p>
                <p className="text-gray-600">{appointment.address.city} - {appointment.address.state}</p>
                <p className="text-sm text-gray-400 mt-2">{appointment.address.zip_code}</p>
              </div>
            </CardContent>
          </Card>

          {appointment.patient_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Suas Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{appointment.patient_notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar: Professional Info */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-sm">
                {appointment.nutritionist.profile_image_url ? (
                  <Image
                    src={appointment.nutritionist.profile_image_url}
                    alt={appointment.nutritionist.full_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-gray-400 m-auto mt-6" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{appointment.nutritionist.full_name}</h3>
                <p className="text-sm text-muted-foreground">{appointment.nutritionist.specialties}</p>
              </div>
              
              <div className="w-full pt-4 space-y-2">
                <Button 
                  className="w-full" 
                  variant="default"
                  onClick={startChat}
                  disabled={chatLoading}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Mensagem
                </Button>
                <Link href={`/nutricionistas/${appointment.nutritionist.id}`} className="block w-full">
                  <Button className="w-full" variant="outline">
                    Ver Perfil Completo
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Precisa reagendar ou cancelar?<br />
              Entre em contato com o profissional pelo chat.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
