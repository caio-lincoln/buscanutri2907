'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Trash2, Flag, Shield } from 'lucide-react'
import { usePermissions } from './permission-wrapper'
import { toast } from '@/components/ui/use-toast'

export interface ModerationAction {
  type: 'delete' | 'flag' | 'warn'
  reason: string
  category: 'spam' | 'inappropriate' | 'harassment' | 'misinformation' | 'copyright' | 'other'
  notes?: string
}

interface ContentModerationProps {
  contentId: string
  contentType: 'blog_post' | 'forum_question' | 'forum_answer' | 'comment'
  contentTitle: string
  authorId: string
  onModerationAction: (action: ModerationAction) => Promise<boolean>
  className?: string
}

const MODERATION_REASONS = {
  spam: 'Spam ou conteúdo promocional não autorizado',
  inappropriate: 'Conteúdo inapropriado ou ofensivo',
  harassment: 'Assédio ou bullying',
  misinformation: 'Informações médicas incorretas ou perigosas',
  copyright: 'Violação de direitos autorais',
  other: 'Outros motivos'
}

export function ContentModeration({
  contentId,
  contentType,
  contentTitle,
  authorId,
  onModerationAction,
  className = ''
}: ContentModerationProps) {
  const { hasPermission } = usePermissions()
  const [isOpen, setIsOpen] = useState(false)
  const [actionType, setActionType] = useState<ModerationAction['type']>('flag')
  const [reason, setReason] = useState<ModerationAction['category']>('other')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check if user has moderation permissions
  if (!hasPermission('moderate_content') && !hasPermission('delete_content')) {
    return null
  }

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        title: 'Erro',
        description: 'Selecione um motivo para a ação de moderação.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      const action: ModerationAction = {
        type: actionType,
        reason: MODERATION_REASONS[reason],
        category: reason,
        notes: notes.trim() || undefined
      }

      const success = await onModerationAction(action)
      
      if (success) {
        toast({
          title: 'Ação executada',
          description: `Conteúdo ${actionType === 'delete' ? 'removido' : actionType === 'flag' ? 'sinalizado' : 'marcado'} com sucesso.`,
        })
        setIsOpen(false)
        setNotes('')
        setReason('other')
        setActionType('flag')
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível executar a ação de moderação.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getActionIcon = () => {
    switch (actionType) {
      case 'delete':
        return <Trash2 className="h-4 w-4" />
      case 'flag':
        return <Flag className="h-4 w-4" />
      case 'warn':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  const getActionColor = () => {
    switch (actionType) {
      case 'delete':
        return 'destructive'
      case 'flag':
        return 'secondary'
      case 'warn':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`text-red-600 hover:text-red-700 hover:bg-red-50 ${className}`}
        >
          <Shield className="h-4 w-4 mr-1" />
          Moderar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            Moderação de Conteúdo
          </DialogTitle>
          <DialogDescription>
            Você está prestes a moderar o conteúdo: <strong>{contentTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="action-type">Tipo de Ação</Label>
            <Select value={actionType} onValueChange={(value: ModerationAction['type']) => setActionType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma ação" />
              </SelectTrigger>
              <SelectContent>
                {hasPermission('delete_content') && (
                  <SelectItem value="delete">
                    <div className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4 text-red-600" />
                      Excluir Conteúdo
                    </div>
                  </SelectItem>
                )}
                <SelectItem value="flag">
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-orange-600" />
                    Sinalizar para Revisão
                  </div>
                </SelectItem>
                <SelectItem value="warn">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    Advertir Autor
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reason">Motivo</Label>
            <Select value={reason} onValueChange={(value: ModerationAction['category']) => setReason(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MODERATION_REASONS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Adicione detalhes sobre a violação ou ação tomada..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {actionType === 'delete' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Atenção!</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                Esta ação não pode ser desfeita. O conteúdo será permanentemente removido.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant={getActionColor() as any}
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            {getActionIcon()}
            {isSubmitting ? 'Processando...' : 
             actionType === 'delete' ? 'Excluir' : 
             actionType === 'flag' ? 'Sinalizar' : 'Advertir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ContentModeration
