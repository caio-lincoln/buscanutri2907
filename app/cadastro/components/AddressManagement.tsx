'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { MapPin, Plus } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { nutritionistAddressService } from '@/lib/nutritionist-address-service'
import { useUser } from '@/hooks/use-user'
import { AddressData } from '@/lib/address-utils'
import type { NutritionistAddress } from '@/lib/supabase'

// Converte DB -> DTO do formulário (mantido)
const convertToAddressData = (address: NutritionistAddress): AddressData => ({
  id: address.id,
  nutritionist_id: address.nutritionist_id,
  type: address.type,
  status: address.status,
  is_main: address.is_main,
  country: address.country,
  state: address.state,
  city: address.city,
  neighborhood: address.neighborhood || undefined,
  zip_code: address.zip_code || undefined,
  street: address.street || undefined,
  number: address.number || undefined,
  complement: address.complement || undefined,
  latitude: address.latitude || undefined,
  longitude: address.longitude || undefined,
  service_radius_km: address.service_radius_km || undefined,
})

interface AddressManagementProps {
  className?: string
  nutritionistId?: string // opcional no cadastro
  onAddressesChange?: (addresses: AddressData[]) => void
}

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

export default function AddressManagement({
  className,
  nutritionistId,
  onAddressesChange,
}: AddressManagementProps) {
  const { user } = useUser()
  const [ addresses, setAddresses ] = useState<AddressData[]>([])
  const [ editingIndex, setEditingIndex ] = useState<number | null>(null) // -1 = novo
  const [ loading, setLoading ] = useState(false)
  const [ formData, setFormData ] = useState<AddressData>({
    type: 'in_person',
    status: 'active',
    is_main: false,
    country: 'Brasil',
    state: '',
    city: '',
  })

  // Se quiser carregar do banco, descomente este bloco
  // async function loadAddresses() {
  //   const currentNutritionistId = nutritionistId || user?.id
  //   if (!currentNutritionistId) return
  //   try {
  //     setLoading(true)
  //     const rows = await nutritionistAddressService.getAddressesByNutritionist(currentNutritionistId)
  //     setAddresses(rows.map(convertToAddressData))
  //   } catch {
  //     toast({ title: 'Erro', description: 'Erro ao carregar endereços', variant: 'destructive' })
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  useEffect(() => {
    // loadAddresses()
  }, [ nutritionistId, user?.id ])

  // Notifica o pai sempre que a lista muda
  useEffect(() => {
    onAddressesChange?.(addresses)
  }, [ addresses, onAddressesChange ])

  // Garante 1 principal quando a lista existir e nenhum marcado
  useEffect(() => {
    if (addresses.length === 0) return
    const hasMain = addresses.some(a => a.is_main)
    if (!hasMain) {
      setAddresses(prev =>
        prev.map((a, i) => ({ ...a, is_main: i === 0 }))
      )
    }
  }, [ addresses.length ])

  function handleAddAddress() {
    const newAddress: AddressData = {
      id: `tmp-${crypto.randomUUID()}`, // id temporário para UI
      type: 'in_person',
      status: 'active',
      is_main: addresses.length === 0, // primeiro é principal
      country: 'Brasil',
      state: '',
      city: '',
      service_radius_km: 30,
    }
    setFormData(newAddress)
    setEditingIndex(-1) // novo
  }

  function handleEditAddress(index: number) {
    setFormData({ ...addresses[ index ] })
    setEditingIndex(index)
  }

  function finishEditing() {
    setEditingIndex(null)
    setFormData({
      type: 'in_person',
      status: 'active',
      is_main: false,
      country: 'Brasil',
      state: '',
      city: '',
    })
  }

  async function handleSaveAddress() {
    // Validações básicas
    if (!formData.state?.trim()) {
      toast({ title: 'Erro de validação', description: 'Estado é obrigatório', variant: 'destructive' })
      return
    }
    if (!formData.city?.trim()) {
      toast({ title: 'Erro de validação', description: 'Cidade é obrigatória', variant: 'destructive' })
      return
    }

    try {
      setLoading(true)

      setAddresses(prev => {
        let next = [ ...prev ]

        const normalized = (list: AddressData[]) =>
          formData.is_main
            ? list.map(a => ({ ...a, is_main: false }))
            : list

        if (editingIndex === -1) {
          next = normalized(next)
          next.unshift({
            ...formData,
            is_main: formData.is_main || next.length === 0,
          })
        } else if (editingIndex !== null) {
          next = normalized(next)
          next[ editingIndex ] = {
            ...next[ editingIndex ],
            ...formData,
          }
        }

        return next
      })

      toast({ title: 'Sucesso', description: 'Endereço salvo' })
      finishEditing()

      // Persistência opcional:
      // const currentNutritionistId = nutritionistId || user?.id
      // if (currentNutritionistId) {
      //   if (editingIndex === -1) {
      //     await nutritionistAddressService.createAddress({ ...formData, nutritionist_id: currentNutritionistId })
      //   } else if (editingIndex !== null && addresses[editingIndex]?.id) {
      //     await nutritionistAddressService.updateAddress(addresses[editingIndex].id!, formData)
      //   }
      //   await loadAddresses()
      // }
    } catch {
      toast({ title: 'Erro', description: 'Erro ao salvar endereço', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteAddress(index: number) {
    const item = addresses[ index ]
    try {
      setLoading(true)

      setAddresses(prev => prev.filter((_, i) => i !== index))

      if (item?.id && !String(item.id).startsWith('tmp-')) {
        await nutritionistAddressService.deleteAddress(item.id)
      }

      toast({ title: 'Sucesso', description: 'Endereço removido' })
    } catch {
      toast({ title: 'Erro', description: 'Erro ao remover endereço', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSetMainAddress(index: number) {
    const item = addresses[ index ]
    try {
      setLoading(true)

      setAddresses(prev =>
        prev.map((a, i) => ({ ...a, is_main: i === index }))
      )

      if (item?.id && !String(item.id).startsWith('tmp-')) {
        await nutritionistAddressService.setMainAddress(item.id)
      }

      toast({ title: 'Sucesso', description: 'Endereço principal definido' })
    } catch {
      toast({ title: 'Erro', description: 'Erro ao definir principal', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // CEP -> autofill (regex corrigido)
  async function handleZipCodeChange(zip: string) {
    setFormData(prev => ({ ...prev, zip_code: zip }))
    const clean = zip.replace(/\D/g, '')
    if (!/^\d{8}$/.test(clean)) return

    try {
      const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
      const data = await r.json()
      if (data?.erro) return
      setFormData(prev => ({
        ...prev,
        street: data.logradouro || prev.street,
        neighborhood: data.bairro || prev.neighborhood,
        city: data.localidade || prev.city,
        state: data.uf || prev.state,
      }))
    } catch { }
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Endereços de Atendimento</h3>
          <Button type="button" variant="outline" size="sm" onClick={handleAddAddress} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Endereço
          </Button>
        </div>

        {/* Lista de endereços */}
        {addresses.length > 0 && (
          <div className="space-y-3">
            {addresses.map((addr, i) => (
              <Card key={addr.id ?? i}>
                <CardContent className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {addr.type === 'in_person' ? 'Presencial' : 'Teleconsulta'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${addr.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {addr.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                      {addr.is_main && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          Principal
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {[ addr.street, addr.number, addr.neighborhood, addr.city, addr.state, addr.zip_code ]
                        .filter(Boolean)
                        .join(', ') || 'Endereço não informado'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => handleEditAddress(i)}>Editar</Button>
                    {!addr.is_main && (
                      <Button type="button" variant="outline" size="sm" onClick={() => handleSetMainAddress(i)}>
                        Definir Principal
                      </Button>
                    )}
                    <Button type="button"variant="destructive" size="sm" onClick={() => handleDeleteAddress(i)}>
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Placeholder quando não há itens */}
        {addresses.length === 0 && editingIndex === null && (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum endereço cadastrado</p>
            <p className="text-sm">Adicione pelo menos um endereço para seus atendimentos</p>
          </div>
        )}

        {/* Formulário */}
        {editingIndex !== null && (
          <Card>
            <CardHeader>
              <CardTitle>{editingIndex === -1 ? 'Adicionar Endereço' : 'Editar Endereço'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Atendimento</Label>
                  <Select
                    value={formData.type || ''}
                    onValueChange={(v: 'in_person' | 'teleconsultation') => setFormData(p => ({ ...p, type: v }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_person">Presencial</SelectItem>
                      <SelectItem value="teleconsultation">Teleconsulta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status || ''}
                    onValueChange={(v: 'active' | 'inactive') => setFormData(p => ({ ...p, status: v }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_main"
                  checked={!!formData.is_main}
                  onCheckedChange={(ck) => setFormData(p => ({ ...p, is_main: !!ck }))}
                />
                <Label htmlFor="is_main">Endereço principal</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="zip_code">CEP</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code || ''}
                    onChange={(e) => handleZipCodeChange(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                </div>
                <div>
                  <Label htmlFor="state">Estado *</Label>
                  <Select
                    value={formData.state || ''}
                    onValueChange={(uf) => setFormData(p => ({ ...p, state: uf }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione o estado" /></SelectTrigger>
                    <SelectContent>
                      {BRAZILIAN_STATES.map(uf => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    value={formData.city || ''}
                    onChange={(e) => setFormData(p => ({ ...p, city: e.target.value }))}
                    placeholder="Nome da cidade"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="street">Rua/Avenida</Label>
                  <Input
                    id="street"
                    value={formData.street || ''}
                    onChange={(e) => setFormData(p => ({ ...p, street: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={formData.number || ''}
                    onChange={(e) => setFormData(p => ({ ...p, number: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood || ''}
                    onChange={(e) => setFormData(p => ({ ...p, neighborhood: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    value={formData.complement || ''}
                    onChange={(e) => setFormData(p => ({ ...p, complement: e.target.value }))}
                  />
                </div>
              </div>

              {formData.type === 'in_person' && (
                <div>
                  <Label htmlFor="service_radius_km">Raio de Atendimento (km)</Label>
                  <Input
                    id="service_radius_km"
                    type="number"
                    min={0}
                    max={500}
                    value={formData.service_radius_km ?? ''}
                    onChange={(e) =>
                      setFormData(p => ({ ...p, service_radius_km: e.target.value ? parseInt(e.target.value) : undefined }))
                    }
                    placeholder="30"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Distância máxima a partir deste endereço
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={finishEditing} disabled={loading}>
                  Cancelar
                </Button>
                <Button type="button" onClick={handleSaveAddress} disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
