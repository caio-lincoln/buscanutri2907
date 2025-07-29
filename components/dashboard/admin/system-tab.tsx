"use client"

import { Badge } from "@/components/ui/badge"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Server, Database, Cloud, Zap, RefreshCw, AlertTriangle, Terminal, HardDrive } from "lucide-react"

interface ServiceStatus {
  name: string
  status: "online" | "offline" | "degradado"
  uptime: string
  latency: string
  icon: React.ComponentType<{ className?: string }>
}

const mockServices: ServiceStatus[] = [
  {
    name: "API Principal",
    status: "online",
    uptime: "99.9%",
    latency: "50ms",
    icon: Server,
  },
  {
    name: "Base de Dados",
    status: "online",
    uptime: "99.8%",
    latency: "30ms",
    icon: Database,
  },
  {
    name: "Armazenamento de Arquivos",
    status: "online",
    uptime: "99.7%",
    latency: "80ms",
    icon: Cloud,
  },
  {
    name: "Sistema de Notificações",
    status: "degradado",
    uptime: "98.5%",
    latency: "200ms",
    icon: Zap,
  },
]

const serviceStatusColors = {
  online: "bg-green-100 text-green-700 border-green-200",
  offline: "bg-red-100 text-red-700 border-red-200",
  degradado: "bg-yellow-100 text-yellow-700 border-yellow-200",
}

export function SystemTab() {
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [logs, setLogs] = useState<string[]>([
    "[2024-07-24 10:00:01] INFO: API Gateway online.",
    "[2024-07-24 10:00:05] INFO: Database connection established.",
    "[2024-07-24 10:01:10] WARN: Notification service latency increased.",
    "[2024-07-24 10:05:30] INFO: New user registered: user@example.com",
    "[2024-07-24 10:10:00] ERROR: Payment gateway timeout.",
  ])

  const handleClearCache = () => {
    alert("Cache limpo com sucesso!")
    console.log("Cache cleared.")
  }

  const handleRestartService = (serviceName: string) => {
    alert(`Serviço '${serviceName}' reiniciado.`)
    console.log(`Service ${serviceName} restarted.`)
  }

  const handleFetchLatestLogs = () => {
    // Simulate fetching new logs
    const newLogs = [
      `[${new Date().toLocaleString()}] INFO: Fetched latest logs.`,
      `[${new Date().toLocaleString()}] DEBUG: System check initiated.`,
    ]
    setLogs((prevLogs) => [...prevLogs, ...newLogs])
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-[#1E1D40]">Gerenciamento do Sistema</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-[#1E1D40] flex items-center gap-2">
              <Server className="h-5 w-5 text-gray-600" /> Status dos Serviços
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockServices.map((service, i) => {
              const IconComponent = service.icon
              return (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                        service.status === "online"
                          ? "bg-gradient-to-br from-green-500 to-green-600"
                          : service.status === "degradado"
                            ? "bg-gradient-to-br from-yellow-500 to-yellow-600"
                            : "bg-gradient-to-br from-red-500 to-red-600"
                      } group-hover:scale-105 transition-transform duration-200`}
                    >
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#1E1D40] text-sm">{service.name}</p>
                      <Badge variant="outline" className={`capitalize ${serviceStatusColors[service.status]}`}>
                        {service.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{service.uptime}</p>
                    <p className="text-xs text-gray-500">Uptime</p>
                  </div>
                </div>
              )
            })}
            <Button variant="outline" className="w-full mt-4 bg-transparent">
              Ver Detalhes de Monitoramento
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-[#1E1D40] flex items-center gap-2">
              <Terminal className="h-5 w-5 text-gray-600" /> Logs do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-64 overflow-y-auto bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-mono custom-scrollbar">
              {logs.map((log, i) => (
                <p
                  key={i}
                  className={log.includes("ERROR") ? "text-red-400" : log.includes("WARN") ? "text-yellow-400" : ""}
                >
                  {log}
                </p>
              ))}
            </div>
            <Button variant="outline" className="w-full bg-transparent" onClick={handleFetchLatestLogs}>
              <RefreshCw className="h-4 w-4 mr-2" /> Carregar Mais Logs
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-[#1E1D40] flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-gray-600" /> Gerenciamento de Cache
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Limpe o cache da aplicação para garantir que os usuários vejam as informações mais recentes.
            </p>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleClearCache}>
              <RefreshCw className="h-4 w-4 mr-2" /> Limpar Cache
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-[#1E1D40] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-gray-600" /> Modo de Manutenção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="maintenance-mode" className="text-sm font-medium text-gray-700">
                Ativar Modo de Manutenção
              </Label>
              <Switch id="maintenance-mode" checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
            </div>
            <Textarea
              placeholder="Mensagem para o modo de manutenção (opcional)"
              className="min-h-[80px] border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Salvar Configuração</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
