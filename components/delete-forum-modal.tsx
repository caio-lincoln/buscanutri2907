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
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { deleteForumQuestion, deleteForumAnswer } from '@/lib/forum-data'

interface DeleteForumModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  type: 'question' | 'answer'
  itemId: string
  userId: string
  itemTitle?: string
}

export function DeleteForumModal({
  isOpen,
  onClose,
  onSuccess,
  type,
  itemId,
  userId,
  itemTitle,
}: DeleteForumModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      let success = false

      if (type === 'question') {
        success = await deleteForumQuestion(itemId, userId)
      } else {
        success = await deleteForumAnswer(itemId, userId)
      }

      if (success) {
        onSuccess()
        onClose()
      } else {
        alert(
          'Erro ao excluir. Verifique se você tem permissão para excluir este item.'
        )
      }
    } catch (error) {
      // Silent error handling: Error deleting item
      alert('Erro ao excluir. Tente novamente.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Confirmar Exclusão
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-gray-700 mb-4">
            Tem certeza que deseja excluir esta{' '}
            {type === 'question' ? 'pergunta' : 'resposta'}?
          </p>

          {itemTitle && (
            <div className="bg-gray-50 p-3 rounded-lg border">
              <p className="text-sm font-medium text-gray-600 mb-1">
                {type === 'question' ? 'Pergunta:' : 'Resposta:'}
              </p>
              <p className="text-sm text-gray-800 line-clamp-3">{itemTitle}</p>
            </div>
          )}

          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              <strong>Atenção:</strong> Esta ação não pode ser desfeita.
              {type === 'question' &&
                ' Todas as respostas associadas também serão excluídas.'}
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir {type === 'question' ? 'Pergunta' : 'Resposta'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
