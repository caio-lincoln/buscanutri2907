'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Ticket, Plus, Ban, RefreshCw } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

type CouponItem = {
  id: string
  code: string | null
  active: boolean
  created: number | null
  expires_at: number | null
  max_redemptions: number | null
  times_redeemed: number
  coupon_id: string | null
  name: string | null
  percent_off: number | null
  amount_off: number | null
  currency: string | null
}

type CreateFormState = {
  code: string
  name: string
  type: 'percent' | 'amount'
  percent_off: string
  amount_off_brl: string
  max_redemptions: string
  expires_at: string
}

const initialForm: CreateFormState = {
  code: '',
  name: '',
  type: 'percent',
  percent_off: '',
  amount_off_brl: '',
  max_redemptions: '',
  expires_at: '',
}

export default function CouponsTab() {
  const [items, setItems] = useState<CouponItem[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateFormState>(initialForm)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/coupons')
      if (!res.ok) {
        throw new Error('Erro ao carregar cupons')
      }
      const data = await res.json()
      setItems(data.items || [])
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: e?.message || 'Não foi possível carregar os cupons',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleInputChange = (field: keyof CreateFormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleCreate = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Código e nome são obrigatórios',
        variant: 'destructive',
      })
      return
    }

    if (form.type === 'percent' && !form.percent_off) {
      toast({
        title: 'Percentual obrigatório',
        description: 'Informe o percentual de desconto',
        variant: 'destructive',
      })
      return
    }

    if (form.type === 'amount' && !form.amount_off_brl) {
      toast({
        title: 'Valor obrigatório',
        description: 'Informe o valor de desconto em BRL',
        variant: 'destructive',
      })
      return
    }

    try {
      setCreating(true)

      const payload: any = {
        code: form.code.trim(),
        name: form.name.trim(),
        type: form.type,
      }

      if (form.type === 'percent') {
        payload.percent_off = Number(form.percent_off)
      } else {
        payload.amount_off_brl = Number(form.amount_off_brl.replace(',', '.'))
      }

      if (form.max_redemptions) {
        payload.max_redemptions = Number(form.max_redemptions)
      }

      if (form.expires_at) {
        payload.expires_at = new Date(form.expires_at).toISOString()
      }

      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Erro ao criar cupom')
      }

      toast({
        title: 'Cupom criado',
        description: 'O cupom foi criado na Stripe e já pode ser usado no checkout',
      })

      setForm(initialForm)
      setIsDialogOpen(false)
      loadData()
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: e?.message || 'Não foi possível criar o cupom',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  const handleDeactivate = async (id: string) => {
    if (deactivatingId) return
    setDeactivatingId(id)
    try {
      const res = await fetch('/api/admin/coupons/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Erro ao desativar cupom')
      }
      toast({
        title: 'Cupom desativado',
        description: 'O cupom não poderá mais ser utilizado em novos pagamentos',
      })
      loadData()
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: e?.message || 'Não foi possível desativar o cupom',
        variant: 'destructive',
      })
    } finally {
      setDeactivatingId(null)
    }
  }

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const aCreated = a.created || 0
      const bCreated = b.created || 0
      return bCreated - aCreated
    })
  }, [items])

  const formatCurrency = (value: number | null, currency: string | null) => {
    if (value == null) return '-'
    const cur = (currency || 'brl').toUpperCase()
    try {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: cur,
      }).format(value)
    } catch {
      return `${value.toFixed(2)} ${cur}`
    }
  }

  const formatDate = (value: number | null) => {
    if (!value) return '-'
    return new Date(value).toLocaleString('pt-BR')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Ticket className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#1E1D40]">Cupons de desconto</h2>
            <p className="text-sm text-gray-600">
              Gerencie cupons da Stripe utilizados no checkout de consultas e assinaturas.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Atualizar
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button">
                <Plus className="h-4 w-4 mr-1" />
                Criar cupom
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo cupom Stripe</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Código do cupom</Label>
                    <Input
                      id="code"
                      value={form.code}
                      onChange={e => handleInputChange('code', e.target.value.toUpperCase())}
                      placeholder="EXEMPLO10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome interno</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={e => handleInputChange('name', e.target.value)}
                      placeholder="Desconto 10% teleconsulta"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de desconto</Label>
                    <Select
                      value={form.type}
                      onValueChange={value => handleInputChange('type', value as 'percent' | 'amount')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">Percentual (%)</SelectItem>
                        <SelectItem value="amount">Valor fixo (BRL)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.type === 'percent' ? (
                    <div className="space-y-2">
                      <Label htmlFor="percent_off">Percentual de desconto (%)</Label>
                      <Input
                        id="percent_off"
                        type="number"
                        min={1}
                        max={100}
                        value={form.percent_off}
                        onChange={e => handleInputChange('percent_off', e.target.value)}
                        placeholder="10"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="amount_off_brl">Valor de desconto (BRL)</Label>
                      <Input
                        id="amount_off_brl"
                        type="number"
                        min={1}
                        step="0.01"
                        value={form.amount_off_brl}
                        onChange={e => handleInputChange('amount_off_brl', e.target.value)}
                        placeholder="50,00"
                      />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max_redemptions">Limite de usos</Label>
                    <Input
                      id="max_redemptions"
                      type="number"
                      min={1}
                      value={form.max_redemptions}
                      onChange={e => handleInputChange('max_redemptions', e.target.value)}
                      placeholder="Opcional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expires_at">Expira em</Label>
                    <Input
                      id="expires_at"
                      type="datetime-local"
                      value={form.expires_at}
                      onChange={e => handleInputChange('expires_at', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                  }}
                  disabled={creating}
                >
                  Cancelar
                </Button>
                <Button type="button" onClick={handleCreate} disabled={creating}>
                  {creating ? 'Criando...' : 'Criar cupom'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base font-semibold text-[#1E1D40]">
            Cupons cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-sm text-gray-500">
              Carregando cupons...
            </div>
          ) : sortedItems.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-500">
              Nenhum cupom cadastrado ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Desconto</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map(item => {
                    const isExpired = item.expires_at ? item.expires_at < Date.now() : false
                    const type = item.percent_off ? 'percent' : item.amount_off ? 'amount' : 'unknown'
                    const discountLabel =
                      type === 'percent'
                        ? `${item.percent_off}%`
                        : type === 'amount'
                        ? formatCurrency(item.amount_off, item.currency)
                        : '-'

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">{item.code}</TableCell>
                        <TableCell>{item.name || '-'}</TableCell>
                        <TableCell>
                          {type === 'percent' ? (
                            <Badge variant="outline">Percentual</Badge>
                          ) : type === 'amount' ? (
                            <Badge variant="outline">Valor fixo</Badge>
                          ) : (
                            <Badge variant="secondary">Outro</Badge>
                          )}
                        </TableCell>
                        <TableCell>{discountLabel}</TableCell>
                        <TableCell>
                          <div className="text-xs">
                            {item.times_redeemed} / {item.max_redemptions ?? '∞'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <div>Criado: {formatDate(item.created)}</div>
                            <div>Expira: {formatDate(item.expires_at)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.active && !isExpired ? (
                            <Badge variant="default" className="bg-emerald-100 text-emerald-700">
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                              Inativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={!item.active || deactivatingId === item.id}
                            onClick={() => handleDeactivate(item.id)}
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Desativar
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

