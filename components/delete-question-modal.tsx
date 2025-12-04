'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface DeleteQuestionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  questionTitle: string
  isDeleting?: boolean
}

export function DeleteQuestionModal({
  open,
  onOpenChange,
  onConfirm,
  questionTitle,
  isDeleting = false,
}: DeleteQuestionModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Deletar Pergunta
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-700 mb-3">
            Tem certeza que deseja deletar a pergunta:
          </p>
          <div className="bg-gray-50 p-3 rounded-lg border">
            <p className="font-medium text-gray-900 line-clamp-2">
              "{questionTitle}"
            </p>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Todas as respostas e interações relacionadas também serão removidas permanentemente.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading || isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading || isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {(isLoading || isDeleting) && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Deletar Pergunta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
