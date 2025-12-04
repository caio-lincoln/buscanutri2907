import { useEffect, useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Loader2 } from "lucide-react"
import { deleteMyAddress, listMyAddresses, NutritionistAddress, ServiceType, setPrimaryAddress, upsertMyAddress } from "../lib/nutritionist-address-service"
import { UserType } from "../lib/supabase"
import { useAuth } from "../contexts/auth-context"
import { toast } from "./ui/use-toast"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Input } from "./ui/input"
import { Checkbox } from "./ui/checkbox"
import { getStates, getCitiesByUF, type BRState, type BRCity } from '../lib/geo'

type Props = {
  userType: UserType;
  open: boolean;
}

export function AddressCard({ userType, open }: Props) {
  const { nutritionistProfile } = useAuth()
  const [ addresses, setAddresses ] = useState<NutritionistAddress[]>([])
  const [ loadingAddresses, setLoadingAddresses ] = useState(false)
  const [ editingAddress, setEditingAddress ] = useState<NutritionistAddress | null>(null)
  const [ showAddressForm, setShowAddressForm ] = useState(false)
  const [ addressFormData, setAddressFormData ] = useState<Partial<NutritionistAddress>>({
    service_type: 'presencial',
    status: 'ativo',
    is_primary: false,
  })

  const [ states, setStates ] = useState<BRState[]>([])
  const [ cities, setCities ] = useState<BRCity[]>([])
  const [ loadingStates, setLoadingStates ] = useState(false)
  const [ loadingCities, setLoadingCities ] = useState(false)
  const [ savingAddress, setSavingAddress ] = useState(false)

  async function loadStatesOnce() {
    setLoadingStates(true)
    try {
      const s = await getStates()
      setStates(s)
    } finally {
      setLoadingStates(false)
    }
  }

  async function loadCitiesForUF(uf: string) {
    setLoadingCities(true)
    try {
      const c = await getCitiesByUF(uf)
      setCities(c)
    } finally {
      setLoadingCities(false)
    }
  }

  async function fillByCEP(cep: string) {
    const clean = cep.replace(/\D/g, '')
    if (clean.length !== 8) return
    const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
    const j = await r.json()
    if (j.erro) return

    const uf = j.uf?.toUpperCase() || ''
    setAddressFormData(prev => ({
      ...prev,
      cep,
      state: uf,
      city: j.localidade || prev.city,
      neighborhood: j.bairro || prev.neighborhood,
      street: j.logradouro || prev.street,
    }))
    if (uf) await loadCitiesForUF(uf)
  }

  const loadAddresses = async () => {
    if (userType !== 'nutricionista' || !nutritionistProfile?.id) return

    setLoadingAddresses(true)
    try {
      const addressList = await listMyAddresses(nutritionistProfile.id)
      setAddresses(addressList)
    } catch (error) {
      toast({
        title: 'Erro ao carregar endereços',
        description: 'Não foi possível carregar a lista de endereços.',
        variant: 'destructive',
      })
    } finally {
      setLoadingAddresses(false)
    }
  }

  // Função para salvar endereço
  const handleSaveAddress = async () => {
    if (!nutritionistProfile?.id) return

    // Validações
    if (!addressFormData.service_type) {
      toast({
        title: 'Erro de validação',
        description: 'Tipo de serviço é obrigatório.',
        variant: 'destructive',
      })
      return
    }

    // Estado e Cidade são obrigatórios para qualquer tipo de endereço
    if (!addressFormData.state || !addressFormData.city) {
      toast({
        title: 'Erro de validação',
        description: 'Estado e cidade são obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    if (addressFormData.service_type === 'presencial' && !addressFormData.cep) {
      toast({
        title: 'Erro de validação',
        description: 'CEP é obrigatório para atendimento presencial.',
        variant: 'destructive',
      })
      return
    }

    if (addressFormData.radius_km && (isNaN(Number(addressFormData.radius_km)) || Number(addressFormData.radius_km) < 0)) {
      toast({
        title: 'Erro de validação',
        description: 'Raio deve ser um número válido.',
        variant: 'destructive',
      })
      return
    }

    setSavingAddress(true)
    try {
      await upsertMyAddress({
        ...addressFormData,
        // Garantir tipo numérico para o raio
        radius_km: addressFormData.radius_km !== undefined ? Number(addressFormData.radius_km as any) : undefined,
        nutritionist_id: nutritionistProfile.id,
      })

      toast({
        title: 'Endereço salvo',
        description: 'Endereço foi salvo com sucesso.',
      })

      setShowAddressForm(false)
      setEditingAddress(null)
      setAddressFormData({
        service_type: 'presencial',
        status: 'ativo',
        is_primary: false,
      })

      await loadAddresses()
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: (error as any)?.message || 'Não foi possível salvar o endereço.',
        variant: 'destructive',
      })
    } finally {
      setSavingAddress(false)
    }
  }

  // Função para excluir endereço
  const handleDeleteAddress = async (id: string) => {
    try {
      await deleteMyAddress(id)
      toast({
        title: 'Endereço excluído',
        description: 'Endereço foi excluído com sucesso.',
      })
      setShowAddressForm(false)
      await loadAddresses()
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o endereço.',
        variant: 'destructive',
      })
    }
  }

  // Função para definir endereço principal
  const handleSetPrimaryAddress = async (id: string) => {
    if (!nutritionistProfile?.id) return

    try {
      await setPrimaryAddress(nutritionistProfile.id, id)
      toast({
        title: 'Endereço principal definido',
        description: 'Endereço principal foi atualizado.',
      })
      await loadAddresses()
    } catch (error) {
      toast({
        title: 'Erro ao definir principal',
        description: 'Não foi possível definir o endereço como principal.',
        variant: 'destructive',
      })
    }
  }

  // Função para editar endereço
  const handleEditAddress = (address: NutritionistAddress) => {
    setEditingAddress(address)
    setAddressFormData(address)
    setShowAddressForm(true)
  }

  // Função para formatar endereço
  const formatAddress = (address: NutritionistAddress) => {
    const parts = []
    if (address.street) parts.push(address.street)
    if (address.number) parts.push(address.number)
    if (address.neighborhood) parts.push(address.neighborhood)
    if (address.city) parts.push(address.city)
    if (address.state) parts.push(address.state)
    if (address.cep) parts.push(address.cep)
    return parts.join(', ') || 'Endereço não informado'
  }

  useEffect(() => {
    if (open && userType === 'nutricionista') {
      loadAddresses()
    }
  }, [ open, userType, nutritionistProfile?.id ])

  useEffect(() => {
    if (open) {
      loadStatesOnce()
    }
  }, [ open, userType ])

  // Se estiver editando e já houver estado, carrega cidades
  useEffect(() => {
    if (showAddressForm && addressFormData.state) {
      loadCitiesForUF(addressFormData.state as string)
    } else {
      setCities([])
    }
  }, [ showAddressForm, addressFormData.state ])

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Endereços de Atendimento
          <Button
            type="button"
            onClick={() => {
              setEditingAddress(null)
              setAddressFormData({
                service_type: 'presencial',
                status: 'ativo',
                is_primary: false,
              })
              setShowAddressForm(true)
            }}
            size="sm"
          >
            Adicionar Endereço
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loadingAddresses ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Carregando endereços...</span>
          </div>
        ) : addresses.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Nenhum endereço cadastrado
          </p>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <Card key={address.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">
                          {address.service_type === 'presencial' ? 'Presencial' :
                            address.service_type === 'online' ? 'Online' : 'Híbrido'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${address.status === 'ativo'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                          }`}>
                          {address.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </span>
                        {address.is_primary && (
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            Principal
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {formatAddress(address)}
                      </p>
                      {address.radius_km && (
                        <p className="text-xs text-gray-500 mt-1">
                          Raio de atendimento: {address.radius_km}km
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={() => handleEditAddress(address)}
                        size="sm"
                        variant="outline"
                      >
                        Editar
                      </Button>
                      {!address.is_primary && (
                        <Button
                          type="button"
                          onClick={() => handleSetPrimaryAddress(address.id)}
                          size="sm"
                          variant="outline"
                        >
                          Definir Principal
                        </Button>
                      )}
                      <Button
                        type="button"
                        onClick={() => handleDeleteAddress(address.id)}
                        size="sm"
                        variant="destructive"
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Formulário de Endereço */}
        {showAddressForm && (
          <Card className="mt-4 border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">
                {editingAddress ? 'Editar Endereço' : 'Novo Endereço'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service_type">Tipo de Serviço *</Label>
                  <Select
                    value={addressFormData.service_type as string}
                    onValueChange={(value: ServiceType) =>
                      setAddressFormData(prev => ({ ...prev, service_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presencial">Presencial</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="hibrido">Híbrido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={addressFormData.status as string}
                    onValueChange={(value: 'ativo' | 'inativo') =>
                      setAddressFormData(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {addressFormData.service_type === 'presencial' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cep">CEP</Label>
                      <Input
                        id="cep"
                        onBlur={(event) => {
                          fillByCEP(event.target.value)
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            fillByCEP(event.target.value)
                          }
                        }}
                        value={addressFormData.cep || ''}
                        onChange={(e) => {
                          if (!e.target.value.length) {
                            setAddressFormData((prev) => ({ ...prev, city: '', state: '', cep: '' }))
                            return
                          }
                          setAddressFormData(prev => ({ ...prev, cep: e.target.value }))
                        }}
                        placeholder="00000-000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">Estado *</Label>
                      <Select
                        value={(addressFormData.state as string) || ''}
                        onValueChange={async (uf: string) => {
                          setAddressFormData(prev => ({ ...prev, state: uf, city: '' }))
                          await loadCitiesForUF(uf)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={loadingStates ? 'Carregando...' : 'Selecione o estado'} />
                        </SelectTrigger>
                        <SelectContent>
                          {states.map(s => (
                            <SelectItem key={s.uf} value={s.uf}>
                              {s.name} ({s.uf})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">Cidade *</Label>
                      <Select
                        disabled={!addressFormData.state || loadingCities}
                        value={(addressFormData.city as string) || ''}
                        onValueChange={(cityName: string) =>
                          setAddressFormData(prev => ({ ...prev, city: cityName }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              !addressFormData.state
                                ? 'Selecione o estado antes'
                                : loadingCities
                                  ? 'Carregando...'
                                  : 'Selecione a cidade'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map(c => (
                            <SelectItem key={c.ibge_id} value={c.name}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="neighborhood">Bairro</Label>
                      <Input
                        id="neighborhood"
                        value={addressFormData.neighborhood || ''}
                        onChange={(e) => setAddressFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="street">Rua</Label>
                      <Input
                        id="street"
                        value={addressFormData.street || ''}
                        onChange={(e) => setAddressFormData(prev => ({ ...prev, street: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="number">Número</Label>
                      <Input
                        id="number"
                        value={addressFormData.number || ''}
                        onChange={(e) => setAddressFormData(prev => ({ ...prev, number: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="complement">Complemento</Label>
                      <Input
                        id="complement"
                        value={addressFormData.complement || ''}
                        onChange={(e) => setAddressFormData(prev => ({ ...prev, complement: e.target.value }))}
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="radius_km">Raio de Atendimento (km)</Label>
                <Input
                  id="radius_km"
                  type="number"
                  min="0"
                  value={addressFormData.radius_km || ''}
                  onChange={(e) => setAddressFormData(prev => ({
                    ...prev,
                    radius_km: e.target.value ? Number(e.target.value as string) : undefined
                  }))}
                  placeholder="Ex: 50"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_primary"
                  checked={addressFormData.is_primary || false}
                  onCheckedChange={(checked) =>
                    setAddressFormData(prev => ({ ...prev, is_primary: !!checked }))
                  }
                />
                <Label htmlFor="is_primary">Definir como endereço principal</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  onClick={handleSaveAddress}
                  disabled={savingAddress}
                >
                  {savingAddress && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {editingAddress ? 'Atualizar' : 'Salvar'}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowAddressForm(false)
                    setEditingAddress(null)
                    setAddressFormData({
                      service_type: 'presencial',
                      status: 'ativo',
                      is_primary: false,
                    })
                  }}
                  variant="outline"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}
