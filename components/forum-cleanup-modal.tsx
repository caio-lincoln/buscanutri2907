'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2, AlertTriangle, CheckCircle } from 'lucide-react'
import { cleanupForumData } from '@/lib/forum-data'

interface ForumCleanupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface CleanupResult {
  deletedQuestions: number
  deletedAnswers: number
  deletedLikes: number
}

export function ForumCleanupModal({
  isOpen,
  onClose,
  onSuccess,
}: ForumCleanupModalProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<CleanupResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCleanup = async () => {
    setIsRunning(true)
    setError(null)
    setResult(null)

    try {
      const cleanupResult = await cleanupForumData()

      if (cleanupResult) {
        setResult(cleanupResult)
        onSuccess()
      } else {
        setError('Erro ao executar a limpeza. Tente novamente.')
      }
    } catch (error) {
      // Silent error handling - cleanup error
      setError('Erro inesperado durante a limpeza. Tente novamente.')
    } finally {
      setIsRunning(false)
    }
  }

  const handleClose = () => {
    setResult(null)
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-orange-600">
            <Trash2 className="h-5 w-5" />
            Limpeza do Fórum
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {!result && !error && (
            <>
              <p className="text-gray-700 mb-4">
                Esta operação irá remover todos os dados órfãos do fórum:
              </p>

              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li>• Perguntas sem autor válido</li>
                <li>• Respostas sem pergunta ou autor válido</li>
                <li>• Curtidas sem pergunta/resposta ou usuário válido</li>
              </ul>

              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-700">
                  <strong>Atenção:</strong> Esta ação não pode ser desfeita.
                  Apenas dados órfãos serão removidos.
                </p>
              </div>
            </>
          )}

          {result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">
                  Limpeza concluída com sucesso!
                </span>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">Resultados:</h4>
                <ul className="space-y-1 text-sm text-green-700">
                  <li>• {result.deletedQuestions} perguntas órfãs removidas</li>
                  <li>• {result.deletedAnswers} respostas órfãs removidas</li>
                  <li>• {result.deletedLikes} curtidas órfãs removidas</li>
                </ul>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Erro na limpeza</span>
              </div>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isRunning}
          >
            {result ? 'Fechar' : 'Cancelar'}
          </Button>

          {!result && (
            <Button
              type="button"
              onClick={handleCleanup}
              disabled={isRunning}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Executando Limpeza...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Executar Limpeza
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
