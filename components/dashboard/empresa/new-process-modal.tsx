'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { createSupabaseClient } from '@/lib/supabase'
import { useUser } from '@/hooks/use-user'

interface JobOption {
  id: string
  title: string
}

interface CandidateOption {
  id: string
  name: string
  email: string
}

interface NewProcessModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function NewProcessModal({
  isOpen,
  onClose,
  onSuccess,
}: NewProcessModalProps) {
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [jobs, setJobs] = useState<JobOption[]>([])
  const [candidates, setCandidates] = useState<CandidateOption[]>([])
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [loadingCandidates, setLoadingCandidates] = useState(false)

  const [formData, setFormData] = useState({
    jobId: '',
    candidateId: '',
    currentStage: 'triagem',
    nextStep: '',
    deadline: undefined as Date | undefined,
    notes: '',
  })

  const loadJobs = useCallback(async () => {
    if (!user?.companyProfile?.id) return

    setLoadingJobs(true)
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('job_postings')
        .select('id, title')
        .eq('company_id', user.companyProfile.id)
        .eq('status', 'ativa')
        .order('created_at', { ascending: false })

      if (error) throw error
      setJobs(data || [])
    } catch (error) {
      // Silent error handling: Error loading jobs
    } finally {
      setLoadingJobs(false)
    }
  }, [user?.companyProfile?.id])

  // Carregar vagas da empresa
  useEffect(() => {
    if (isOpen && user?.companyProfile?.id) {
      loadJobs()
    }
  }, [isOpen, user?.companyProfile?.id, loadJobs])

  const loadCandidates = useCallback(async (jobId: string) => {
    setLoadingCandidates(true)
    try {
      const supabase = createSupabaseClient()
      // Usar função RPC para evitar problemas de RLS
      const { data, error } = await supabase.rpc('get_job_candidates', {
        job_id_param: jobId,
      })

      if (error) throw error

      const candidateOptions =
        data?.map(candidate => ({
          id: candidate.candidate_id,
          applicationId: candidate.application_id,
          name: candidate.candidate_name,
          email: candidate.candidate_email,
        })) || []

      setCandidates(candidateOptions)
    } catch (error) {
      // Silent error handling: Error loading candidates
      setCandidates([])
    } finally {
      setLoadingCandidates(false)
    }
  }, [])

  // Carregar candidatos quando uma vaga for selecionada
  useEffect(() => {
    if (formData.jobId) {
      loadCandidates(formData.jobId)
    } else {
      setCandidates([])
      setFormData(prev => ({ ...prev, candidateId: '' }))
    }
  }, [formData.jobId, loadCandidates])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.jobId || !formData.candidateId || !formData.nextStep) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    setLoading(true)
    try {
      const supabase = createSupabaseClient()
      // Primeiro, buscar o application_id
      const { data: application, error: appError } = await supabase
        .from('job_applications')
        .select('id')
        .eq('job_id', formData.jobId)
        .eq('candidate_id', formData.candidateId)
        .single()

      if (appError || !application) {
        throw new Error('Candidatura não encontrada')
      }

      // Criar o processo seletivo
      const { error: processError } = await supabase
        .from('selection_processes')
        .insert({
          application_id: application.id,
          current_stage: formData.currentStage,
          next_step: formData.nextStep,
          deadline: formData.deadline?.toISOString().split('T')[0] || null,
          notes: formData.notes || null,
          status: 'em_andamento',
        })

      if (processError) throw processError

      // Atualizar status da candidatura para "em_analise"
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({ status: 'em_analise' })
        .eq('id', application.id)

      if (updateError) throw updateError

      onSuccess()
      onClose()
      resetForm()
    } catch (error) {
      // Silent error handling: Error creating process
      alert('Erro ao criar processo seletivo. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      jobId: '',
      candidateId: '',
      currentStage: 'triagem',
      nextStep: '',
      deadline: undefined,
      notes: '',
    })
    setJobs([])
    setCandidates([])
  }

  const handleClose = () => {
    onClose()
    resetForm()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#1E1D40]">
            Novo Processo Seletivo
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção de Vaga */}
          <div className="space-y-2">
            <Label htmlFor="job">Vaga *</Label>
            <Select
              value={formData.jobId}
              onValueChange={value =>
                setFormData(prev => ({ ...prev, jobId: value }))
              }
              disabled={loadingJobs}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingJobs ? 'Carregando vagas...' : 'Selecione uma vaga'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {jobs.map(job => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seleção de Candidato */}
          <div className="space-y-2">
            <Label htmlFor="candidate">Candidato *</Label>
            <Select
              value={formData.candidateId}
              onValueChange={value =>
                setFormData(prev => ({ ...prev, candidateId: value }))
              }
              disabled={!formData.jobId || loadingCandidates}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !formData.jobId
                      ? 'Selecione uma vaga primeiro'
                      : loadingCandidates
                        ? 'Carregando candidatos...'
                        : 'Selecione um candidato'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {candidates.map(candidate => (
                  <SelectItem key={candidate.id} value={candidate.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{candidate.name}</span>
                      <span className="text-sm text-gray-500">
                        {candidate.email}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estágio Atual */}
          <div className="space-y-2">
            <Label htmlFor="stage">Estágio Atual *</Label>
            <Select
              value={formData.currentStage}
              onValueChange={value =>
                setFormData(prev => ({ ...prev, currentStage: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="triagem">Triagem</SelectItem>
                <SelectItem value="entrevista">Entrevista</SelectItem>
                <SelectItem value="teste_tecnico">Teste Técnico</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="rejeitado">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Próximo Passo */}
          <div className="space-y-2">
            <Label htmlFor="nextStep">Próximo Passo *</Label>
            <Input
              id="nextStep"
              value={formData.nextStep}
              onChange={e =>
                setFormData(prev => ({ ...prev, nextStep: e.target.value }))
              }
              placeholder="Ex: Agendar entrevista, Enviar teste técnico..."
              required
            />
          </div>

          {/* Prazo */}
          <div className="space-y-2">
            <Label>Prazo</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !formData.deadline && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.deadline ? (
                    format(formData.deadline, 'PPP', { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.deadline}
                  onSelect={date =>
                    setFormData(prev => ({ ...prev, deadline: date }))
                  }
                  disabled={date => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={e =>
                setFormData(prev => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Observações sobre o processo..."
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Processo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
