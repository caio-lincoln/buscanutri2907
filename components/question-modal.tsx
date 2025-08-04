"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { type ForumQuestion, createForumQuestion } from "@/lib/forum-data"
import { getCurrentUser } from "@/lib/auth"

interface QuestionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onQuestionPosted?: (question: ForumQuestion) => void
}

export function QuestionModal({ open, onOpenChange, onQuestionPosted }: QuestionModalProps) {
  const [questionTitle, setQuestionTitle] = useState("")
  const [questionContent, setQuestionContent] = useState("")
  const [questionCategory, setQuestionCategory] = useState("")
  const [userType, setUserType] = useState<string | null>(null)

  const specialtiesOptions = [
    { value: "suplementos", label: "Suplementos" },
    { value: "exercicios", label: "Exercícios" }, 
    { value: "dieta", label: "Dieta" },
    { value: "saude", label: "Saúde" },
    { value: "nutricao", label: "Nutrição" },
  ]

  useEffect(() => {
    // Reset form fields when modal opens
    if (open) {
      setQuestionTitle("")
      setQuestionContent("")
      setQuestionCategory("")
      
      // Detectar tipo de usuário
      const detectUserType = async () => {
        try {
          const user = await getCurrentUser()
          if (user) {
            setUserType(user.user_type)
          }
        } catch (error) {
          console.error("Erro ao detectar tipo de usuário:", error)
        }
      }
      
      detectUserType()
    }
  }, [open])

  const handlePostQuestion = async () => {
    if (!questionTitle.trim() || !questionContent.trim() || !questionCategory.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o título, a pergunta e a especialidade.",
        variant: "destructive",
      })
      return
    }

    try {
      const user = await getCurrentUser()
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para fazer uma pergunta.",
          variant: "destructive",
        })
        return
      }

      const addedQuestion = await createForumQuestion(
        questionTitle,
        questionContent,
        [questionCategory],
        user.id,
        questionCategory
      )
      
      if (addedQuestion) {
        onQuestionPosted?.(addedQuestion)
        toast({ title: "Pergunta publicada!", description: "Sua pergunta foi enviada para a comunidade." })
        onOpenChange(false) // Close modal after posting
      } else {
        toast({
          title: "Erro ao publicar",
          description: "Não foi possível publicar sua pergunta. Tente novamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao publicar pergunta:", error)
      toast({
        title: "Erro ao publicar",
        description: "Não foi possível publicar sua pergunta. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fazer uma Nova Pergunta</DialogTitle>
          <DialogDescription>
            {userType === 'nutricionista' 
              ? "Faça uma pergunta para outros nutricionistas da comunidade Busca Nutri."
              : "Descreva sua dúvida para a comunidade Busca Nutri."
            }
          </DialogDescription>
          {userType === 'nutricionista' && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-800">
                  Pergunta direcionada para nutricionistas
                </span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Esta pergunta será visível apenas para outros nutricionistas da plataforma.
              </p>
            </div>
          )}
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="newQuestionTitle" className="text-sm font-medium text-gray-700">
              Título
            </Label>
            <Input
              id="newQuestionTitle"
              placeholder="Ex: Dúvida sobre atendimento online..."
              value={questionTitle}
              onChange={(e) => setQuestionTitle(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="newQuestionContent" className="text-sm font-medium text-gray-700">
              Sua Pergunta
            </Label>
            <Textarea
              id="newQuestionContent"
              placeholder="Descreva sua dúvida ou tópico aqui..."
              rows={4}
              value={questionContent}
              onChange={(e) => setQuestionContent(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="newQuestionCategory">Especialidade</Label>
            <Select value={questionCategory} onValueChange={setQuestionCategory}>
              <SelectTrigger id="newQuestionCategory">
                <SelectValue placeholder="Selecione uma especialidade" />
              </SelectTrigger>
              <SelectContent>
                {specialtiesOptions.map((specialty) => (
                  <SelectItem key={specialty.value} value={specialty.value}>
                    {specialty.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handlePostQuestion}
            disabled={!questionTitle.trim() || !questionContent.trim() || !questionCategory.trim()}
          >
            <Send className="h-4 w-4 mr-2" />
            Publicar Pergunta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
