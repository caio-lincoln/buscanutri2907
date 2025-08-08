"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Users, Clock, RefreshCw } from "lucide-react"
import { useRealtimeProfileViews } from "@/hooks/use-realtime-profile-views"
import { profileViewsService } from "@/lib/profile-views-service"

interface RealtimeViewsTestProps {
  nutritionistId: string
  initialStats?: {
    totalViews: number
    uniqueViews: number
    lastViewAt: string | null
  }
}

export function RealtimeViewsTest({ nutritionistId, initialStats }: RealtimeViewsTestProps) {
  const [isRecording, setIsRecording] = useState(false)
  const { viewStats, recordView, refreshStats } = useRealtimeProfileViews(nutritionistId, initialStats)

  const handleRecordView = async () => {
    setIsRecording(true)
    try {
      await recordView()
    } catch (error) {
      console.error('Erro ao registrar visualização:', error)
    } finally {
      setIsRecording(false)
    }
  }

  const handleRefreshStats = async () => {
    try {
      await refreshStats()
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Teste de Visualizações em Tempo Real
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Eye className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-600">Total</span>
            </div>
            <Badge variant="secondary" className="text-lg font-bold">
              {viewStats.totalViews}
            </Badge>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-gray-600">Únicos</span>
            </div>
            <Badge variant="secondary" className="text-lg font-bold">
              {viewStats.uniqueViews}
            </Badge>
          </div>
        </div>

        {viewStats.lastViewAt && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-600">Última Visualização</span>
            </div>
            <p className="text-xs text-gray-500">
              {new Date(viewStats.lastViewAt).toLocaleString('pt-BR')}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={handleRecordView} 
            disabled={isRecording}
            className="flex-1"
            size="sm"
          >
            {isRecording ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Simular Visualização
              </>
            )}
          </Button>
          <Button 
            onClick={handleRefreshStats} 
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-xs text-gray-500 text-center">
          As estatísticas são atualizadas automaticamente em tempo real
        </div>
      </CardContent>
    </Card>
  )
}