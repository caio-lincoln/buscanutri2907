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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/components/ui/use-toast'

type UserType = 'paciente' | 'nutricionista' | 'empresa'

export type EditUserData = {
  id: string
  name: string
  email: string
  type: UserType
  status?: 'ativo' | 'inativo' | 'pendente'
  is_verified?: boolean
  nutritionist_profiles?: { id: string; full_name: string; is_verified?: string }
}

interface EditUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: EditUserData | null
  onUpdated?: () => void
}

export function EditUserModal({ open, onOpenChange, user, onUpdated }: EditUserModalProps) {
  const [saving, setSaving] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState<UserType>('paciente')
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    if (user) {
      setEmail(user.email || '')
      setName(user.name || '')
      setType(user.type)
      const initialVerified =
        user.type === 'nutricionista'
          ? !!user.nutritionist_profiles?.is_verified
          : user.type === 'empresa'
          ? !!user.is_verified
          : false
      setVerified(initialVerified)
    }
  }, [user])

  const nameLabel = useMemo(() => {
    switch (type) {
      case 'empresa':
        return 'Nome da empresa'
      case 'nutricionista':
        return 'Nome completo'
      default:
        return 'Nome completo'
    }
  }, [type])

  const canToggleVerified = type === 'nutricionista' || type === 'empresa'

  async function handleSave() {
    if (!user) return
    setSaving(true)
    try {
      const payload: Record<string, any> = {}
      if (email && email !== user.email) payload.email = email
      if (type && type !== user.type) payload.user_type = type
      if (name && name !== user.name) payload.name = name
      if (canToggleVerified) payload.is_verified = verified
      payload.production_auth = 'liberar_producao'

      const res = await fetch(`/api/admin/users/${user.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-production-auth': 'liberar_producao' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = (j?.error && (j?.error?.message || j?.error)) || j?.message || 'Falha ao atualizar usuário'
        throw new Error(String(msg))
      }
      // Alguns endpoints retornam { data: { success: boolean, error?: string } }
      const data = j?.data ?? j
      if (data && data.success === false) {
        const msg = data.error || 'Falha ao atualizar usuário'
        throw new Error(String(msg))
      }
      toast({ title: 'Usuário atualizado', description: 'As alterações foram salvas com sucesso.' })
      onOpenChange(false)
      onUpdated?.()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err?.message || 'Tente novamente.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>Atualize informações básicas e status de verificação.</DialogDescription>
        </DialogHeader>

        {user ? (
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">{nameLabel}</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder={nameLabel} />
            </div>
            <div className="grid gap-2">
              <Label>Tipo de usuário</Label>
              <Select value={type} onValueChange={v => setType(v as UserType)}>
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

            {canToggleVerified && (
              <div className="flex items-center justify-between pt-2">
                <div>
                  <Label>Verificado</Label>
                  <p className="text-xs text-muted-foreground">Controla a verificação de nutricionistas/empresas.</p>
                </div>
                <Switch checked={verified} onCheckedChange={setVerified} />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-6 text-sm text-muted-foreground">Nenhum usuário selecionado.</div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default EditUserModal
