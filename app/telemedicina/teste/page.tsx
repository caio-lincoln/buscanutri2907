"use client"

import { useState, useEffect } from "react"
import { TestConsultationCreator } from "@/components/telemedicine/test-consultation-creator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { TestTube, Database, Users, Video, MessageSquare, FileText, CheckCircle, AlertTriangle } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface SystemStatus {
  database: boolean
  users: boolean
  consultations: boolean
  messages: boolean
  notes: boolean
}

export default function TelemedicineTestPage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: false,
    users: false,
    consultations: false,
    messages: false,
    notes: false,
    // webrtc removido - funcionalidade em desenvolvimento
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSystemStatus()
  }, [])

  const checkSystemStatus = async () => {
    try {
      setLoading(true)
      const status: SystemStatus = {
        database: false,
        users: false,
        consultations: false,
        messages: false,
        notes: false,
        // webrtc removido - funcionalidade em desenvolvimento
      }

      // Testar conexão com banco
      try {
        const { error } = await supabase.from("consultations").select("id").limit(1)
        status.database = !error
      } catch {
        status.database = false
      }

      // Testar tabela de usuários
      try {
        const { data: patients } = await supabase.from("patient_profiles").select("user_id").limit(1)
        const { data: nutritionists } = await supabase.from("nutritionist_profiles").select("user_id").limit(1)
        status.users = !!(patients?.length && nutritionists?.length)
      } catch {
        status.users = false
      }

      // Testar tabela de consultas
      try {
        const { data } = await supabase.from("consultations").select("id").limit(1)
        status.consultations = !!data
      } catch {
        status.consultations = false
      }

      // Testar tabela de mensagens
      try {
        const { data } = await supabase.from("telemedicine_consultation_messages").select("id").limit(1)
        status.messages = !!data
      } catch {
        status.messages = false
      }

      // Testar tabela de notas
      try {
        const { data } = await supabase.from("telemedicine_consultation_notes").select("id").limit(1)
        status.notes = !!data
      } catch {
        status.notes = false
      }

      // Testar tabelas WebRTC - removido (funcionalidade em desenvolvimento)

      setSystemStatus(status)
    } catch (error) {
      console.error("Error checking system status:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (isWorking: boolean) => {
    return isWorking ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-red-600" />
    )
  }

  const getStatusColor = (isWorking: boolean) => {
    return isWorking ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <TestTube className="h-6 w-6 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Teste de Telemedicina</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Página de testes para verificar todas as funcionalidades do sistema de telemedicina da Busca Nutri
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Status do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                Status do Sistema
              </CardTitle>
              <p className="text-sm text-gray-600">Verificação dos componentes necessários</p>
            </CardHeader>

            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-500 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Verificando sistema...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Conexão com Banco</span>
                    </div>
                    <Badge variant="outline" className={getStatusColor(systemStatus.database)}>
                      {getStatusIcon(systemStatus.database)}
                      {systemStatus.database ? "OK" : "Erro"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Usuários de Teste</span>
                    </div>
                    <Badge variant="outline" className={getStatusColor(systemStatus.users)}>
                      {getStatusIcon(systemStatus.users)}
                      {systemStatus.users ? "OK" : "Faltando"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Tabela Consultas</span>
                    </div>
                    <Badge variant="outline" className={getStatusColor(systemStatus.consultations)}>
                      {getStatusIcon(systemStatus.consultations)}
                      {systemStatus.consultations ? "OK" : "Erro"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Sistema de Chat</span>
                    </div>
                    <Badge variant="outline" className={getStatusColor(systemStatus.messages)}>
                      {getStatusIcon(systemStatus.messages)}
                      {systemStatus.messages ? "OK" : "Erro"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Sistema de Notas</span>
                    </div>
                    <Badge variant="outline" className={getStatusColor(systemStatus.notes)}>
                      {getStatusIcon(systemStatus.notes)}
                      {systemStatus.notes ? "OK" : "Erro"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium">WebRTC/Vídeo</span>
                    </div>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      Em Desenvolvimento
                    </Badge>
                  </div>
                </div>
              )}

              <Button onClick={checkSystemStatus} variant="outline" className="w-full mt-4 bg-transparent">
                Verificar Novamente
              </Button>
            </CardContent>
          </Card>

          {/* Criador de Consulta de Teste */}
          <div>
            <TestConsultationCreator />
          </div>
        </div>

        {/* Instruções */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>📋 Instruções de Teste</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">🔧 Preparação:</h4>
                <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                  <li>Execute os scripts SQL para criar dados de teste</li>
                  <li>Verifique se todos os status estão &quot;OK&quot;</li>
                  <li>Crie uma consulta de teste usando o formulário</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">🧪 Testes a Realizar:</h4>
                <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                  <li>Acesso à página da consulta</li>
                  <li>Entrada na sala de telemedicina</li>
                  <li>Controles de vídeo e áudio</li>
                  <li>Chat em tempo real</li>
                  <li>Criação e edição de notas</li>
                  <li>Finalização da consulta</li>
                </ol>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Dicas:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use abas diferentes do navegador para simular paciente e nutricionista</li>
                <li>• Teste em modo incógnito para simular usuários diferentes</li>
                <li>• Verifique o console do navegador para logs de debug</li>
                <li>• Teste com diferentes configurações de câmera/microfone</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
