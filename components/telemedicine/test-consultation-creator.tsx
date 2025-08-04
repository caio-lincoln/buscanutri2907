"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TestTube, Calendar, User, Stethoscope, Copy, ExternalLink } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"

interface TestConsultation {
  id: string
  scheduled_time: string
  patient_name: string
  nutritionist_name: string
  status: string
  consultation_type: string
}

export function TestConsultationCreator() {
  const [loading, setLoading] = useState(false)
  const [testConsultation, setTestConsultation] = useState<TestConsultation | null>(null)
  const [minutesFromNow, setMinutesFromNow] = useState("2")
  const [duration, setDuration] = useState("30")
  const [consultationType, setConsultationType] = useState("video")

  const createTestConsultation = async () => {
    try {
      setLoading(true)

      // Buscar usuários de teste existentes
      const { data: patients } = await supabase.from("patient_profiles").select("user_id, full_name").limit(1)

      const { data: nutritionists } = await supabase.from("nutritionist_profiles").select("user_id, full_name").limit(1)

      if (!patients?.length || !nutritionists?.length) {
        toast({
          title: "❌ Erro",
          description: "Não há usuários suficientes para criar consulta de teste. Execute os scripts SQL primeiro.",
          variant: "destructive",
        })
        return
      }

      // Calcular horário da consulta
      const scheduledTime = new Date()
      scheduledTime.setMinutes(scheduledTime.getMinutes() + Number.parseInt(minutesFromNow))

      // Criar consulta de teste
      const { data: consultation, error } = await supabase
        .from("consultations")
        .insert({
          patient_id: patients[0].user_id,
          nutritionist_id: nutritionists[0].user_id,
          scheduled_time: scheduledTime.toISOString(),
          status: "scheduled",
          consultation_type: consultationType,
          price: 0,
          payment_status: "paid",
          notes: `🧪 CONSULTA DE TESTE - Criada em ${new Date().toLocaleString("pt-BR")} para testar funcionalidades`,
        })
        .select()
        .single()

      if (error) throw error

      // Criar mensagens de teste
      await supabase.from("telemedicine_consultation_messages").insert([
        {
          consultation_id: consultation.id,
          sender_id: patients[0].user_id,
          message: "Olá! Esta é uma mensagem de teste do paciente.",
          message_type: "text",
          sent_at: new Date().toISOString(),
          delivered_at: new Date().toISOString(),
        },
        {
          consultation_id: consultation.id,
          sender_id: nutritionists[0].user_id,
          message: "Olá! Esta é uma resposta de teste da nutricionista.",
          message_type: "text",
          sent_at: new Date().toISOString(),
          delivered_at: new Date().toISOString(),
        },
      ])

      // Criar notas de teste
      await supabase.from("telemedicine_consultation_notes").insert([
        {
          consultation_id: consultation.id,
          author_id: nutritionists[0].user_id,
          title: "Nota de Teste",
          content: "Esta é uma nota de teste criada automaticamente para demonstrar a funcionalidade.",
          category: "general",
        },
      ])

      setTestConsultation({
        id: consultation.id,
        scheduled_time: consultation.scheduled_time,
        patient_name: patients[0].full_name,
        nutritionist_name: nutritionists[0].full_name,
        status: consultation.status,
        consultation_type: consultation.consultation_type,
      })

      toast({
        title: "✅ Consulta de teste criada!",
        description: `Consulta agendada para ${scheduledTime.toLocaleTimeString("pt-BR")}`,
      })
    } catch (error) {
      console.error("Error creating test consultation:", error)
      toast({
        title: "❌ Erro",
        description: "Não foi possível criar a consulta de teste",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyConsultationUrl = () => {
    if (testConsultation) {
      const url = `${window.location.origin}/telemedicina/consulta/${testConsultation.id}`
      navigator.clipboard.writeText(url)
      toast({
        title: "📋 URL copiada!",
        description: "Link da consulta copiado para a área de transferência",
      })
    }
  }

  const openConsultation = () => {
    if (testConsultation) {
      window.open(`/telemedicina/consulta/${testConsultation.id}`, "_blank")
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5 text-purple-600" />
          Criador de Consulta de Teste
        </CardTitle>
        <p className="text-sm text-gray-600">
          Crie uma consulta de teste para verificar todas as funcionalidades de telemedicina
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {!testConsultation ? (
          <>
            {/* Configurações da Consulta */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="minutes">Minutos no futuro</Label>
                <Input
                  id="minutes"
                  type="number"
                  value={minutesFromNow}
                  onChange={(e) => setMinutesFromNow(e.target.value)}
                  min="1"
                  max="60"
                />
              </div>

              <div>
                <Label htmlFor="duration">Duração (min)</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="45">45 minutos</SelectItem>
                    <SelectItem value="60">60 minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select value={consultationType} onValueChange={setConsultationType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Videochamada</SelectItem>
                    <SelectItem value="audio">Áudio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Botão de Criar */}
            <Button
              onClick={createTestConsultation}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Criando consulta...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Criar Consulta de Teste
                </>
              )}
            </Button>

            {/* Informações */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">ℹ️ O que será criado:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Uma consulta agendada para {minutesFromNow} minutos no futuro</li>
                <li>• Mensagens de teste entre paciente e nutricionista</li>
                <li>• Notas de consulta de exemplo</li>
                <li>• Chat e notas configurados (videochamada em desenvolvimento)</li>
              </ul>
            </div>
          </>
        ) : (
          <>
            {/* Consulta Criada */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <TestTube className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-semibold text-green-900">Consulta de Teste Criada!</h3>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-green-800">ID:</span>
                    <p className="text-green-700 font-mono text-xs">{testConsultation.id}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-800">Horário:</span>
                    <p className="text-green-700">
                      {new Date(testConsultation.scheduled_time).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">
                    {testConsultation.patient_name} ↔ {testConsultation.nutritionist_name}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                    <Calendar className="h-3 w-3 mr-1" />
                    {testConsultation.status}
                  </Badge>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                    <Stethoscope className="h-3 w-3 mr-1" />
                    {testConsultation.consultation_type}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-3">
              <Button onClick={copyConsultationUrl} variant="outline" className="flex-1 bg-transparent">
                <Copy className="h-4 w-4 mr-2" />
                Copiar URL
              </Button>
              <Button onClick={openConsultation} className="flex-1 bg-blue-600 hover:bg-blue-700">
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Consulta
              </Button>
            </div>

            {/* Instruções de Teste */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-2">🧪 Como testar:</h4>
              <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
                <li>Clique em &quot;Abrir Consulta&quot; para acessar a página da consulta</li>
                <li>Teste a entrada na sala de telemedicina</li>
                <li>Verifique os controles de vídeo e áudio</li>
                <li>Teste o chat em tempo real</li>
                <li>Crie e edite notas da consulta</li>
                <li>Teste a finalização da consulta</li>
              </ol>
            </div>

            {/* Reset */}
            <Button
              onClick={() => setTestConsultation(null)}
              variant="ghost"
              className="w-full text-gray-600 hover:text-gray-800"
            >
              Criar Nova Consulta de Teste
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
