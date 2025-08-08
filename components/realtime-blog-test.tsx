"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, RefreshCw, Clock } from 'lucide-react'
import { useRealtimeBlogViews } from '@/hooks/use-realtime-blog-views'
import { BlogViewsService } from '@/lib/blog-views-service'

interface RealtimeBlogTestProps {
  blogPostId: string
  initialViews?: number
  postTitle?: string
}

export function RealtimeBlogTest({ 
  blogPostId, 
  initialViews = 0,
  postTitle = "Post de Teste"
}: RealtimeBlogTestProps) {
  const [isRecording, setIsRecording] = useState(false)
  
  const { stats, isLoading, error, recordView, refreshStats } = useRealtimeBlogViews({
    blogPostId,
    initialStats: {
      totalViews: initialViews,
      uniqueViews: 0,
      lastViewAt: null
    }
  })

  const handleRecordView = async () => {
    setIsRecording(true)
    try {
      await recordView()
    } catch (err) {
      console.error('Erro ao registrar visualização:', err)
    } finally {
      setIsRecording(false)
    }
  }

  const handleDirectIncrement = async () => {
    try {
      await BlogViewsService.recordView(blogPostId)
    } catch (err) {
      console.error('Erro ao incrementar visualização diretamente:', err)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-blue-500" />
          Teste Realtime - Blog
        </CardTitle>
        <p className="text-sm text-gray-600">{postTitle}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalViews}
            </div>
            <div className="text-xs text-gray-600">Total Views</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {stats.uniqueViews}
            </div>
            <div className="text-xs text-gray-600">Unique Views</div>
          </div>
        </div>

        {/* Última visualização */}
        {stats.lastViewAt && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>
              Última: {new Date(stats.lastViewAt).toLocaleTimeString('pt-BR')}
            </span>
          </div>
        )}

        {/* Status */}
        <div className="flex gap-2">
          {isLoading && (
            <Badge variant="secondary">Carregando...</Badge>
          )}
          {error && (
            <Badge variant="destructive">Erro</Badge>
          )}
        </div>

        {/* Botões de teste */}
        <div className="space-y-2">
          <Button 
            onClick={handleRecordView}
            disabled={isRecording || isLoading}
            className="w-full"
            size="sm"
          >
            {isRecording ? 'Registrando...' : 'Simular Nova Visualização'}
          </Button>
          
          <Button 
            onClick={handleDirectIncrement}
            variant="outline"
            className="w-full"
            size="sm"
          >
            Incrementar Diretamente
          </Button>
          
          <Button 
            onClick={refreshStats}
            variant="ghost"
            className="w-full"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar Estatísticas
          </Button>
        </div>

        {/* Info do Post */}
        <div className="text-xs text-gray-500 pt-2 border-t">
          Post ID: {blogPostId}
        </div>
      </CardContent>
    </Card>
  )
}