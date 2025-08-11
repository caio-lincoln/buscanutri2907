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
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, MapPin, Home } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { nutritionistAddressService } from '@/lib/nutritionist-address-service'
import { useUser } from '@/hooks/use-user'

export interface AddressData {
  id?: string
  nutritionist_id?: string
  type: 'in_person' | 'teleconsultation'
  status: 'active' | 'inactive'
  is_main: boolean
  country: string
  state: string
  city: string
  neighborhood?: string
  zip_code?: string
  street?: string
  number?: string
  complement?: string
  latitude?: number
  longitude?: number
  service_radius_km?: number
}

interface AddressManagementProps {
  className?: string
  nutritionistId?: string // Para usar durante o cadastro
  onAddressesChange?: (addresses: AddressData[]) => void // Callback para notificar mudanças
}

const BRAZILIAN_STATES = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
]

export default function AddressManagement({
  className,
  nutritionistId,
  onAddressesChange,
}: AddressManagementProps) {
  const { user } = useUser()
  const [addresses, setAddresses] = useState<AddressData[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<AddressData>({
    type: 'in_person',
    status: 'active',
    is_main: false,
    country: 'Brasil',
    state: '',
    city: '',
    neighborhood: '',
    zip_code: '',
    street: '',
    number: '',
    complement: '',
    service_radius_km: 30,
  })

  // Load addresses from Supabase
  const loadAddresses = async () => {
    const currentNutritionistId = nutritionistId || user?.id
    if (!currentNutritionistId) return

    try {
      setLoading(true)
      const addressesData =
        await nutritionistAddressService.getAddressesByNutritionist(
          currentNutritionistId
        )
      setAddresses(addressesData)
    } catch (error) {
      // Error loading addresses - handled silently
      toast({
        title: 'Erro',
        description: 'Erro ao carregar endereços',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Load addresses on component mount
  useEffect(() => {
    loadAddresses()
  }, [nutritionistId, user?.id])

  // Notify parent component of address changes
  useEffect(() => {
    if (onAddressesChange) {
      onAddressesChange(addresses)
    }
  }, [addresses, onAddressesChange])

  // Auto-set first address as main
  useEffect(() => {
    if (addresses.length === 0) {
      return
    }

    const hasMainAddress = addresses.some(addr => addr.is_main)
    if (!hasMainAddress) {
      const updatedAddresses = addresses.map((addr, index) => ({
        ...addr,
        is_main: index === 0,
      }))
      setAddresses(updatedAddresses)
    }
  }, [addresses])

  const handleAddAddress = () => {
    setFormData({
      type: 'in_person',
      status: 'active',
      is_main: addresses.length === 0, // First address is automatically main
      country: 'Brasil',
      state: '',
      city: '',
      neighborhood: '',
      zip_code: '',
      street: '',
      number: '',
      complement: '',
      service_radius_km: 30,
    })
    setEditingIndex(-1) // -1 indicates new address
  }

  const handleEditAddress = (index: number) => {
    setFormData({ ...addresses[index] })
    setEditingIndex(index)
  }

  const handleSaveAddress = async () => {
    const currentNutritionistId = nutritionistId || user?.id
    if (!currentNutritionistId) {
      toast({
        title: 'Erro',
        description: 'ID do nutricionista não encontrado',
        variant: 'destructive',
      })
      return
    }

    // Validation
    if (!formData.state.trim()) {
      toast({
        title: 'Erro de validação',
        description: 'Estado é obrigatório',
        variant: 'destructive',
      })
      return
    }

    if (!formData.city.trim()) {
      toast({
        title: 'Erro de validação',
        description: 'Cidade é obrigatória',
        variant: 'destructive',
      })
      return
    }

    if (formData.zip_code && !/^d{5}-?d{3}$/.test(formData.zip_code)) {
      toast({
        title: 'Erro de validação',
        description: 'CEP deve estar no formato 00000-000',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)

      if (editingIndex === -1) {
        // Adding new address
        const addressData = {
          ...formData,
          nutritionist_id: currentNutritionistId,
        }
        await nutritionistAddressService.createAddress(addressData)
        toast({
          title: 'Sucesso',
          description: 'Endereço adicionado com sucesso',
        })
      } else {
        // Editing existing address
        const addressId = addresses[editingIndex].id
        if (addressId) {
          await nutritionistAddressService.updateAddress(addressId, formData)
          toast({
            title: 'Sucesso',
            description: 'Endereço atualizado com sucesso',
          })
        }
      }

      // Reload addresses from database
      await loadAddresses()
      setEditingIndex(null)
    } catch (error) {
      // Error saving address - handled silently
      toast({
        title: 'Erro',
        description: 'Erro ao salvar endereço',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAddress = async (index: number) => {
    const addressId = addresses[index].id
    if (!addressId) return

    try {
      setLoading(true)
      await nutritionistAddressService.deleteAddress(addressId)

      // Reload addresses from database
      await loadAddresses()

      toast({
        title: 'Sucesso',
        description: 'Endereço removido com sucesso',
      })
    } catch (error) {
      // Error deleting address - handled silently
      toast({
        title: 'Erro',
        description: 'Erro ao remover endereço',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSetMainAddress = async (index: number) => {
    const addressId = addresses[index].id
    if (!addressId) return

    try {
      setLoading(true)
      await nutritionistAddressService.setMainAddress(addressId)

      // Reload addresses from database
      await loadAddresses()

      toast({
        title: 'Sucesso',
        description: 'Endereço principal definido com sucesso',
      })
    } catch (error) {
      // Error setting main address
      toast({
        title: 'Erro',
        description: 'Erro ao definir endereço principal',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
  }

  const handleZipCodeChange = async (zipCode: string) => {
    setFormData(prev => ({ ...prev, zip_code: zipCode }))

    // Auto-fill address from CEP (Brazilian postal code)
    if (/^d{5}-?d{3}$/.test(zipCode)) {
      try {
        const cleanZip = zipCode.replace('-', '')
        const response = await fetch(
          `https://viacep.com.br/ws/${cleanZip}/json/`
        )
        const data = await response.json()

        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            street: data.logradouro || prev.street,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state,
          }))
        }
      } catch (error) {
        // Error fetching address from CEP
      }
    }
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Endereços de Atendimento</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddAddress}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar Endereço
          </Button>
        </div>

        {/* Address List */}
        <div className="space-y-3">
          {addresses.map((address, index) => (
            <Card key={index} className="relative">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant={
                          address.type === 'in_person' ? 'default' : 'secondary'
                        }
                      >
                        {address.type === 'in_person' ? (
                          <>
                            <MapPin className="h-3 w-3 mr-1" />
                            Presencial
                          </>
                        ) : (
                          <>
                            <Home className="h-3 w-3 mr-1" />
                            Teleconsulta
                          </>
                        )}
                      </Badge>
                      {address.is_main && (
                        <Badge variant="outline">Principal</Badge>
                      )}
                      <Badge
                        variant={
                          address.status === 'active' ? 'default' : 'secondary'
                        }
                      >
                        {address.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>

                    <div className="text-sm text-gray-600">
                      <p className="font-medium">
                        {address.city}/{address.state}
                      </p>
                      {address.street && (
                        <p>
                          {address.street}
                          {address.number ? `, ${address.number}` : ''}
                        </p>
                      )}
                      {address.neighborhood && <p>{address.neighborhood}</p>}
                      {address.zip_code && <p>CEP: {address.zip_code}</p>}
                      {address.service_radius_km &&
                        address.type === 'in_person' && (
                          <p>
                            Raio de atendimento: {address.service_radius_km} km
                          </p>
                        )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!address.is_main && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetMainAddress(index)}
                        disabled={loading}
                      >
                        Definir como principal
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditAddress(index)}
                      disabled={loading}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAddress(index)}
                      className="text-red-600 hover:text-red-700"
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Address Form */}
        {editingIndex !== null && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingIndex === -1 ? 'Adicionar Endereço' : 'Editar Endereço'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Tipo de Atendimento</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'in_person' | 'teleconsultation') =>
                      setFormData(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_person">Presencial</SelectItem>
                      <SelectItem value="teleconsultation">
                        Teleconsulta
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'active' | 'inactive') =>
                      setFormData(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_main"
                  checked={formData.is_main}
                  onCheckedChange={checked =>
                    setFormData(prev => ({ ...prev, is_main: !!checked }))
                  }
                />
                <Label htmlFor="is_main">Endereço principal</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="zip_code">CEP</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code || ''}
                    onChange={e => handleZipCodeChange(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                </div>

                <div>
                  <Label htmlFor="state">Estado *</Label>
                  <Select
                    value={formData.state}
                    onValueChange={value =>
                      setFormData(prev => ({ ...prev, state: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRAZILIAN_STATES.map(state => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, city: e.target.value }))
                    }
                    placeholder="Nome da cidade"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="street">Rua/Avenida</Label>
                  <Input
                    id="street"
                    value={formData.street || ''}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, street: e.target.value }))
                    }
                    placeholder="Nome da rua"
                  />
                </div>

                <div>
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={formData.number || ''}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, number: e.target.value }))
                    }
                    placeholder="123"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood || ''}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        neighborhood: e.target.value,
                      }))
                    }
                    placeholder="Nome do bairro"
                  />
                </div>

                <div>
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    value={formData.complement || ''}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        complement: e.target.value,
                      }))
                    }
                    placeholder="Apto, sala, etc."
                  />
                </div>
              </div>

              {formData.type === 'in_person' && (
                <div>
                  <Label htmlFor="service_radius_km">
                    Raio de Atendimento (km)
                  </Label>
                  <Input
                    id="service_radius_km"
                    type="number"
                    min="0"
                    max="500"
                    value={formData.service_radius_km || ''}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        service_radius_km: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      }))
                    }
                    placeholder="30"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Distância máxima que você atende a partir deste endereço
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveAddress}
                  disabled={loading}
                >
                  {loading
                    ? 'Salvando...'
                    : editingIndex === -1
                      ? 'Adicionar'
                      : 'Salvar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {addresses.length === 0 && editingIndex === null && (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum endereço cadastrado</p>
            <p className="text-sm">
              Adicione pelo menos um endereço para seus atendimentos
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
