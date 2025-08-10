'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { X, Save, Loader2 } from 'lucide-react'
import { updateForumQuestion, updateForumAnswer } from '@/lib/forum-data'

interface EditForumModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  type: 'question' | 'answer'
  itemId: string
  userId: string
  initialData: {
    title?: string
    content: string
    tags?: string[]
    category?: string
  }
}

export function EditForumModal({
  isOpen,
  onClose,
  onSuccess,
  type,
  itemId,
  userId,
  initialData,
}: EditForumModalProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [category, setCategory] = useState('')
  const [newTag, setNewTag] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when modal opens/closes or data changes
  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || '')
      setContent(initialData?.content || '')
      setTags(initialData?.tags || [])
      setCategory(initialData?.category || '')
      setNewTag('')
    }
  }, [isOpen, initialData])

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 5) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) return

    if (type === 'question' && !title.trim()) return

    setIsSubmitting(true)

    try {
      let success = false

      if (type === 'question') {
        success = await updateForumQuestion(
          itemId,
          title.trim(),
          content.trim(),
          tags,
          userId,
          category
        )
      } else {
        success = await updateForumAnswer(itemId, content.trim(), userId)
      }

      if (success) {
        onSuccess()
        onClose()
      } else {
        alert(
          'Erro ao atualizar. Verifique se você tem permissão para editar este item.'
        )
      }
    } catch (error) {
      // Silent error handling - update error
      alert('Erro ao atualizar. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = content.trim() && (type === 'answer' || title.trim())

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Editar {type === 'question' ? 'Pergunta' : 'Resposta'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {type === 'question' && (
            <>
              <div className="space-y-2">
                <Label
                  htmlFor="title"
                  className="text-sm font-medium text-gray-700"
                >
                  Título da Pergunta *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Digite o título da sua pergunta..."
                  className="w-full"
                  maxLength={200}
                />
                <p className="text-xs text-gray-500">
                  {title.length}/200 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="category"
                  className="text-sm font-medium text-gray-700"
                >
                  Categoria
                </Label>
                <Input
                  id="category"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="Ex: Nutrição Esportiva, Emagrecimento..."
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Tags (máximo 5)
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite uma tag e pressione Enter"
                    className="flex-1"
                    disabled={tags.length >= 5}
                  />
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    disabled={
                      !newTag.trim() ||
                      tags.includes(newTag.trim()) ||
                      tags.length >= 5
                    }
                    variant="outline"
                  >
                    Adicionar
                  </Button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label
              htmlFor="content"
              className="text-sm font-medium text-gray-700"
            >
              {type === 'question'
                ? 'Descrição da Pergunta'
                : 'Conteúdo da Resposta'}{' '}
              *
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={
                type === 'question'
                  ? 'Descreva sua pergunta em detalhes...'
                  : 'Digite sua resposta...'
              }
              rows={8}
              className="resize-none"
              maxLength={2000}
            />
            <p className="text-xs text-gray-500">
              {content.length}/2000 caracteres
            </p>
          </div>

          <DialogFooter className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
