"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Plus, Save, Edit, Trash2 } from "lucide-react"
import { getConsultationNotes } from "@/lib/consultation-service"
import type { ConsultationNote, Consultation } from "@/lib/consultation-service"
import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"

interface ConsultationNotesProps {
  consultationId: string
  consultation: Consultation
  userType: "paciente" | "nutricionista"
  user: any
  userProfile: any
  isVisible: boolean
}

export function ConsultationNotes({
  consultationId,
  consultation,
  userType,
  user,
  userProfile,
  isVisible,
}: ConsultationNotesProps) {
  const [notes, setNotes] = useState<ConsultationNote[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    category: "general" as ConsultationNote["category"],
  })

  const isPatient = userType === "paciente"
  const canCreateNotes = userType === "nutricionista" // Apenas nutricionistas podem criar notas

  const categoryLabels = {
    symptoms: "Sintomas",
    diagnosis: "Diagnóstico",
    treatment: "Tratamento",
    followup: "Acompanhamento",
    general: "Geral",
  }

  const categoryColors = {
    symptoms: "bg-red-50 text-red-700 border-red-200",
    diagnosis: "bg-blue-50 text-blue-700 border-blue-200",
    treatment: "bg-green-50 text-green-700 border-green-200",
    followup: "bg-purple-50 text-purple-700 border-purple-200",
    general: "bg-gray-50 text-gray-700 border-gray-200",
  }

  const loadNotes = useCallback(async () => {
    try {
      setLoading(true)
      const notesData = await getConsultationNotes(consultationId)
      setNotes(notesData)
    } catch (error) {
      console.error("Error loading notes:", error)
    } finally {
      setLoading(false)
    }
  }, [consultationId])

  const setupRealtimeSubscription = useCallback(() => {
    const channel = supabase
      .channel(`consultation_notes_${consultationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "consultation_notes",
          filter: `consultation_id=eq.${consultationId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setNotes((prev) => [payload.new as ConsultationNote, ...prev])
          } else if (payload.eventType === "UPDATE") {
            setNotes((prev) =>
              prev.map((note) => (note.id === payload.new.id ? (payload.new as ConsultationNote) : note)),
            )
          } else if (payload.eventType === "DELETE") {
            setNotes((prev) => prev.filter((note) => note.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [consultationId])

  useEffect(() => {
    if (isVisible) {
      loadNotes()
      setupRealtimeSubscription()
    }
  }, [isVisible, consultationId, loadNotes, setupRealtimeSubscription])

  const createNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim() || saving) return

    try {
      setSaving(true)

      const { error } = await supabase.from("telemedicine_consultation_notes").insert({
        consultation_id: consultationId,
        author_id: user.id,
        title: newNote.title.trim(),
        content: newNote.content.trim(),
        category: newNote.category,
      })

      if (error) throw error

      // Reset form
      setNewNote({
        title: "",
        content: "",
        category: "general",
      })
      setIsCreating(false)

      toast({
        title: "✅ Nota criada",
        description: "A nota foi salva com sucesso",
      })
    } catch (error) {
      console.error("Error creating note:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar a nota",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const updateNote = async (noteId: string, updates: Partial<ConsultationNote>) => {
    try {
      setSaving(true)

      const { error } = await supabase
        .from("telemedicine_consultation_notes")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", noteId)

      if (error) throw error

      setEditingNote(null)

      toast({
        title: "✅ Nota atualizada",
        description: "A nota foi atualizada com sucesso",
      })
    } catch (error) {
      console.error("Error updating note:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a nota",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase.from("telemedicine_consultation_notes").delete().eq("id", noteId)

      if (error) throw error

      toast({
        title: "✅ Nota excluída",
        description: "A nota foi removida com sucesso",
      })
    } catch (error) {
      console.error("Error deleting note:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a nota",
        variant: "destructive",
      })
    }
  }

  const formatNoteTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const isMyNote = (note: ConsultationNote) => {
    return note.author_id === user.id
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Notas da Consulta</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Carregando notas...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="h-3 w-3 text-green-600" />
              </div>
              Notas da Consulta
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {canCreateNotes ? "Registre informações importantes" : "Visualize as notas do nutricionista"}
            </p>
          </div>

          {canCreateNotes && !isCreating && (
            <Button onClick={() => setIsCreating(true)} size="sm" className="bg-green-500 hover:bg-green-600">
              <Plus className="h-4 w-4 mr-1" />
              Nova Nota
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Create Note Form */}
        {isCreating && (
          <div className="border-b bg-gray-50/50 p-4 space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Título da nota..."
                value={newNote.title}
                onChange={(e) => setNewNote((prev) => ({ ...prev, title: e.target.value }))}
                className="flex-1"
              />
              <Select
                value={newNote.category}
                onValueChange={(value) =>
                  setNewNote((prev) => ({ ...prev, category: value as ConsultationNote["category"] }))
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Textarea
              placeholder="Conteúdo da nota..."
              value={newNote.content}
              onChange={(e) => setNewNote((prev) => ({ ...prev, content: e.target.value }))}
              rows={3}
              className="resize-none"
            />

            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsCreating(false)
                  setNewNote({ title: "", content: "", category: "general" })
                }}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={createNote}
                size="sm"
                disabled={!newNote.title.trim() || !newNote.content.trim() || saving}
                className="bg-green-500 hover:bg-green-600"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Salvar
              </Button>
            </div>
          </div>
        )}

        {/* Notes List */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {notes.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-600 text-sm">Nenhuma nota ainda</p>
                <p className="text-gray-500 text-xs mt-1">
                  {canCreateNotes ? "Crie a primeira nota da consulta" : "O nutricionista ainda não criou notas"}
                </p>
              </div>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="border rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{note.title}</h3>
                      <Badge variant="outline" className={`text-xs ${categoryColors[note.category]}`}>
                        {categoryLabels[note.category]}
                      </Badge>
                    </div>

                    {isMyNote(note) && canCreateNotes && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingNote(note.id)}
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNote(note.id)}
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <p className="text-gray-700 text-sm whitespace-pre-wrap mb-3">{note.content}</p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Por {isMyNote(note) ? "Você" : isPatient ? "Nutricionista" : "Paciente"}</span>
                    <span>{formatNoteTime(note.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
