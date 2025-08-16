import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Clock, Edit, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface AvailabilitySlot {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
}

interface AvailabilityManagerProps {
  availability: AvailabilitySlot[]
  onAdd: (slot: Omit<AvailabilitySlot, 'id'>) => Promise<void>
  onUpdate: (id: string, slot: Omit<AvailabilitySlot, 'id'>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  className?: string
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
]

export function AvailabilityManager({
  availability,
  onAdd,
  onUpdate,
  onDelete,
  className = '',
}: AvailabilityManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | null>(null)
  const [dayOfWeek, setDayOfWeek] = useState<string>('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const getDayName = (dayNumber: number) => {
    return DAYS_OF_WEEK.find(day => day.value === dayNumber)?.label || 'Desconhecido'
  }

  const handleOpenDialog = (slot?: AvailabilitySlot) => {
    if (slot) {
      setEditingSlot(slot)
      setDayOfWeek(slot.day_of_week.toString())
      setStartTime(slot.start_time)
      setEndTime(slot.end_time)
    } else {
      setEditingSlot(null)
      setDayOfWeek('')
      setStartTime('')
      setEndTime('')
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingSlot(null)
    setDayOfWeek('')
    setStartTime('')
    setEndTime('')
  }

  const handleSubmit = async () => {
    if (!dayOfWeek || !startTime || !endTime) {
      toast.error('Preencha todos os campos')
      return
    }

    if (startTime >= endTime) {
      toast.error('O horário de início deve ser anterior ao horário de fim')
      return
    }

    setIsLoading(true)
    try {
      const slotData = {
        day_of_week: parseInt(dayOfWeek),
        start_time: startTime,
        end_time: endTime,
      }

      if (editingSlot) {
        await onUpdate(editingSlot.id, slotData)
        toast.success('Horário atualizado com sucesso!')
      } else {
        await onAdd(slotData)
        toast.success('Horário adicionado com sucesso!')
      }

      handleCloseDialog()
    } catch {
      // console.error('Erro ao salvar horário:', error)
      toast.error('Erro ao salvar horário')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este horário?')) {
      return
    }

    try {
      await onDelete(id)
      toast.success('Horário excluído com sucesso!')
    } catch {
      // console.error('Erro ao excluir horário:', error)
      toast.error('Erro ao excluir horário')
    }
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Disponibilidade
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Horário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSlot ? 'Editar Horário' : 'Adicionar Novo Horário'}
                </DialogTitle>
                <DialogDescription>
                  {editingSlot
                    ? 'Edite as informações do horário de disponibilidade.'
                    : 'Configure um novo horário de disponibilidade para teleconsultas.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="day">Dia da Semana</Label>
                  <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o dia" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="start-time">Horário de Início</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end-time">Horário de Fim</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? 'Salvando...' : editingSlot ? 'Atualizar' : 'Adicionar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {availability.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum horário de disponibilidade configurado.</p>
              <p className="text-sm">Adicione horários para que os pacientes possam agendar teleconsultas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availability
                .sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time))
                .map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{getDayName(slot.day_of_week)}</p>
                        <p className="text-sm text-muted-foreground">
                          {slot.start_time} - {slot.end_time}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(slot)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(slot.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}