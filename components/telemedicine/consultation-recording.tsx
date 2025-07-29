"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Play,
  Pause,
  Square,
  Download,
  Share2,
  Clock,
  FileVideo,
  AlertCircle,
  CheckCircle,
  Settings,
} from "lucide-react"

interface ConsultationRecordingProps {
  consultationId: string
  userType: "paciente" | "nutricionista"
  isRecording: boolean
  onStartRecording: () => void
  onStopRecording: () => void
  onPauseRecording: () => void
}

export function ConsultationRecording({
  consultationId,
  userType,
  isRecording,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
}: ConsultationRecordingProps) {
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [recordings, setRecordings] = useState([
    {
      id: "1",
      name: "Consulta - 15/01/2025",
      duration: "45:32",
      size: "125 MB",
      date: new Date(Date.now() - 86400000),
      status: "completed" as const,
    },
    {
      id: "2",
      name: "Consulta - 08/01/2025",
      duration: "38:15",
      size: "98 MB",
      date: new Date(Date.now() - 604800000),
      status: "completed" as const,
    },
  ])
  const [storageUsed, setStorageUsed] = useState(45) // Percentage

  // Update recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording, isPaused])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleStartRecording = () => {
    onStartRecording()
    setRecordingDuration(0)
    setIsPaused(false)
  }

  const handlePauseRecording = () => {
    onPauseRecording()
    setIsPaused(!isPaused)
  }

  const handleStopRecording = () => {
    onStopRecording()
    setIsPaused(false)

    // Add new recording to list
    const newRecording = {
      id: Date.now().toString(),
      name: `Consulta - ${new Date().toLocaleDateString()}`,
      duration: formatDuration(recordingDuration),
      size: `${Math.round((recordingDuration / 60) * 2.8)} MB`, // Estimate
      date: new Date(),
      status: "completed" as const,
    }

    setRecordings((prev) => [newRecording, ...prev])
    setRecordingDuration(0)
  }

  const canRecord = userType === "nutricionista"

  return (
    <Card className="h-[600px] flex flex-col border-0 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-purple-100/50">
        <CardTitle className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
            <FileVideo className="h-4 w-4 text-white" />
          </div>
          <span>Gravação da Consulta</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Current Recording Controls */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Gravação Atual</h3>
            {isRecording && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                Gravando
              </Badge>
            )}
          </div>

          {isRecording && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Duração</span>
                <span className="font-mono text-lg font-semibold text-red-600">
                  {formatDuration(recordingDuration)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min((recordingDuration / 3600) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            {!isRecording ? (
              <Button
                onClick={handleStartRecording}
                disabled={!canRecord}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Iniciar Gravação
              </Button>
            ) : (
              <>
                <Button
                  onClick={handlePauseRecording}
                  variant="outline"
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-50 bg-transparent"
                >
                  {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                  {isPaused ? "Retomar" : "Pausar"}
                </Button>
                <Button
                  onClick={handleStopRecording}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50 bg-transparent"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Parar
                </Button>
              </>
            )}

            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {!canRecord && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">Apenas nutricionistas podem iniciar gravações</span>
              </div>
            </div>
          )}
        </div>

        {/* Storage Usage */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-blue-900">Armazenamento</h3>
            <span className="text-sm text-blue-700">{storageUsed}% usado</span>
          </div>
          <Progress value={storageUsed} className="mb-2" />
          <div className="flex items-center justify-between text-sm text-blue-700">
            <span>450 MB de 1 GB</span>
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
              Gerenciar
            </Button>
          </div>
        </div>

        {/* Previous Recordings */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Gravações Anteriores</h3>
          <div className="space-y-3">
            {recordings.map((recording) => (
              <div key={recording.id} className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileVideo className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-900">{recording.name}</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Concluída
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{recording.duration}</span>
                      </div>
                      <span>{recording.size}</span>
                      <span>{recording.date.toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {recordings.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileVideo className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma gravação disponível</p>
              <p className="text-sm">As gravações das consultas aparecerão aqui</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
