'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/components/ui/use-toast'

type UserType = 'paciente' | 'nutricionista' | 'empresa'

type UserStatus = 'ativo' | 'inativo' | 'pendente' | 'suspenso'

export type EditUserData = {
  id: string
  name: string
  email: string
  type: UserType
  status?: UserStatus
  is_verified?: boolean
  nutritionist_profiles?: { id: string; full_name: string; is_verified?: string }
}

type EditFormState = {
  name: string
  email: string
  type: UserType
  status: UserStatus | undefined
  is_verified: boolean
}

interface EditUserModalProps {
  user: EditUserData
  onClose: () => void
  onEdited?: () => void
}

export function EditUserModal({ user, onClose, onEdited }: EditUserModalProps) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<EditFormState>(() => {
    const initialVerified =
      user.type === 'nutricionista'
        ? !!user.nutritionist_profiles?.is_verified
        : user.type === 'empresa'
          ? !!user.is_verified
          : false
    return {
      name: user.name,
      email: user.email,
      type: user.type,
      status: user.status,
      is_verified: initialVerified,
    }
  })

  useEffect(() => {
    const initialVerified =
      user.type === 'nutricionista'
        ? !!user.nutritionist_profiles?.is_verified
        : user.type === 'empresa'
          ? !!user.is_verified
          : false
    setForm({
      name: user.name,
      email: user.email,
      type: user.type,
      status: user.status,
      is_verified: initialVerified,
    })
  }, [user])

  const nameLabel = useMemo(() => {
    switch (form.type) {
      case 'empresa':
        return 'Nome da empresa'
      case 'nutricionista':
        return 'Nome completo'
      default:
        return 'Nome completo'
    }
  }, [form.type])

  const canToggleVerified = form.type === 'nutricionista' || form.type === 'empresa'

  const hasChanges =
    form.email !== user.email ||
    form.name !== user.name ||
    form.type !== user.type ||
    form.status !== user.status ||
    (canToggleVerified && form.is_verified !== !!user.is_verified)

  const handleChangeField = (field: keyof EditFormState, value: string | boolean) => {
    setForm(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const buildPayload = () => {
    const payload: Record<string, any> = {}
    if (form.email !== user.email) payload['email'] = form.email
    if (form.type !== user.type) payload['user_type'] = form.type
    if (form.name !== user.name) payload['name'] = form.name
    if (form.status && form.status !== user.status) payload['status'] = form.status
    if (canToggleVerified) payload['is_verified'] = form.is_verified
    payload['production_auth'] = 'liberar_producao'
    return payload
  }

  const handleSubmit = async () => {
    if (!hasChanges) {
      toast({
        title: 'Nenhuma alteração realizada',
        description: 'Os dados do usuário já estavam iguais.',
      })
      return
    }

    setSaving(true)
    try {
      const payload = buildPayload()

      const res = await fetch(`/api/admin/users/${user.id}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-production-auth': 'liberar_producao',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const j = await res.json().catch(() => ({}))
      const data = j?.data ?? j

      if (!res.ok) {
        const msg =
          (j?.error && (j?.error?.message || j?.error)) ||
          j?.message ||
          data?.error ||
          'Falha ao atualizar usuário'
        throw new Error(String(msg))
      }

      if (data && data.ok === false) {
        const msg =
          (data.error && (data.error.message || data.error)) ||
          data.message ||
          'Falha ao atualizar usuário'
        throw new Error(String(msg))
      }

      const edited =
        typeof data?.edited === 'boolean'
          ? data.edited
          : typeof data?.success === 'boolean'
            ? data.success
            : true

      if (!edited) {
        toast({
          title: 'Nenhuma alteração detectada',
          description: 'Os dados do usuário já estavam iguais.',
        })
        return
      }

      toast({
        title: 'Usuário atualizado',
        description: 'As alterações foram salvas com sucesso.',
      })

      await onEdited?.()
      onClose()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Atualize informações básicas e status do usuário.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="admin-edit-email">Email</Label>
            <Input
              id="admin-edit-email"
              value={form.email}
              onChange={e => handleChangeField('email', e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="admin-edit-name">{nameLabel}</Label>
            <Input
              id="admin-edit-name"
              value={form.name}
              onChange={e => handleChangeField('name', e.target.value)}
              placeholder={nameLabel}
            />
          </div>

          <div className="grid gap-2">
            <Label>Tipo de usuário</Label>
            <Select
              value={form.type}
              onValueChange={v => handleChangeField('type', v as UserType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paciente">Paciente</SelectItem>
                <SelectItem value="nutricionista">Nutricionista</SelectItem>
                <SelectItem value="empresa">Empresa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Status</Label>
            <Select
              value={form.status || 'ativo'}
              onValueChange={v => handleChangeField('status', v as UserStatus)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="suspenso">Suspenso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {canToggleVerified && (
            <div className="flex items-center justify-between pt-2">
              <div>
                <Label>Verificado</Label>
                <p className="text-xs text-muted-foreground">
                  Controla a verificação de nutricionistas e empresas.
                </p>
              </div>
              <Switch
                checked={form.is_verified}
                onCheckedChange={v => handleChangeField('is_verified', v)}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default EditUserModal

