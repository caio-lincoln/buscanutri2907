'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { Loader2, Upload, Building2, User, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import { updateCompanyProfile, uploadCompanyLogo } from '@/lib/company-service'
import type { CompanyProfile } from '@/lib/company-service'

// Opções para os selects
const COMPANY_SIZE_OPTIONS = [
  { value: 'micro', label: 'Microempresa (até 9 funcionários)' },
  { value: 'pequena', label: 'Pequena empresa (10-49 funcionários)' },
  { value: 'media', label: 'Média empresa (50-249 funcionários)' },
  { value: 'grande', label: 'Grande empresa (250+ funcionários)' },
]

const COMPANY_SECTOR_OPTIONS = [
  { value: 'saude', label: 'Saúde e Bem-estar' },
  { value: 'alimentacao', label: 'Alimentação e Bebidas' },
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'educacao', label: 'Educação' },
  { value: 'consultoria', label: 'Consultoria' },
  { value: 'industria', label: 'Indústria' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'comercio', label: 'Comércio' },
  { value: 'outros', label: 'Outros' },
]

interface CompanyProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData: CompanyProfile
  onProfileUpdate?: () => void
}

export function CompanyProfileModal({
  open,
  onOpenChange,
  initialData,
  onProfileUpdate,
}: CompanyProfileModalProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  // Estados para os dados do formulário
  const [formData, setFormData] = useState({
    // Página 1 - Dados básicos da empresa
    company_name: '',
    cnpj: '',
    description: '',
    logo_url: '',
    
    // Página 2 - Informações da empresa
    website: '',
    company_size: '',
    industry: '',
    address: '',
    phone: '',
    
    // Página 3 - Dados do responsável
    responsible_name: '',
    responsible_position: '',
  })

  const totalPages = 3

  // Inicializar dados do formulário
  useEffect(() => {
    if (initialData) {
      setFormData({
        company_name: initialData.company_name || '',
        cnpj: initialData.cnpj || '',
        description: initialData.description || '',
        logo_url: initialData.logo_url || '',
        website: initialData.website || '',
        company_size: initialData.company_size || '',
        industry: initialData.industry || '',
        address: initialData.address || '',
        phone: initialData.phone || '',
        responsible_name: initialData.responsible_name || '',
        responsible_position: initialData.responsible_position || '',
      })
      setLogoPreview(initialData.logo_url || null)
    }
  }, [initialData])

  // Função para atualizar campos do formulário
  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Função para lidar com upload de logo
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Erro no upload',
          description: 'Por favor, selecione apenas arquivos de imagem.',
          variant: 'destructive',
        })
        return
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Erro no upload',
          description: 'A imagem deve ter no máximo 5MB.',
          variant: 'destructive',
        })
        return
      }

      setLogoFile(file)
      
      // Criar preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Função para validar CNPJ
  const validateCNPJ = (cnpj: string): boolean => {
    const cleanCNPJ = cnpj.replace(/[^\d]/g, '')
    if (cleanCNPJ.length !== 14) return false
    
    // Validação básica de CNPJ
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false
    
    return true
  }

  // Função para formatar CNPJ
  const formatCNPJ = (value: string) => {
    const cleanValue = value.replace(/[^\d]/g, '')
    return cleanValue
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 18)
  }

  // Função para validar formulário
  const validateForm = (): boolean => {
    if (currentPage === 1) {
      if (!formData.company_name.trim()) {
        toast({
          title: 'Campo obrigatório',
          description: 'Nome da empresa é obrigatório.',
          variant: 'destructive',
        })
        return false
      }
      
      if (formData.cnpj && !validateCNPJ(formData.cnpj)) {
        toast({
          title: 'CNPJ inválido',
          description: 'Por favor, insira um CNPJ válido.',
          variant: 'destructive',
        })
        return false
      }
    }

    if (currentPage === 3) {
      if (!formData.responsible_name.trim()) {
        toast({
          title: 'Campo obrigatório',
          description: 'Nome do responsável é obrigatório.',
          variant: 'destructive',
        })
        return false
      }
    }

    return true
  }

  // Função para navegar entre páginas
  const nextPage = () => {
    if (validateForm() && currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Função para salvar o perfil
  const handleSave = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      let logoUrl = formData.logo_url

      // Upload do logo se houver arquivo selecionado
      if (logoFile) {
        logoUrl = await uploadCompanyLogo(logoFile, initialData.user_id)
      }

      // Preparar dados para atualização
      const updateData = {
        ...formData,
        logo_url: logoUrl,
      }

      // Atualizar perfil da empresa
      await updateCompanyProfile(initialData.user_id, updateData)

      toast({
        title: 'Perfil atualizado!',
        description: 'As informações da empresa foram salvas com sucesso.',
      })

      onProfileUpdate?.()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error)
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um erro ao salvar o perfil.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Renderizar página atual
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>Dados básicos da empresa</span>
            </div>

            {/* Upload de Logo */}
            <div className="space-y-2">
              <Label>Logo da Empresa</Label>
              <div className="flex items-center gap-4">
                {logoPreview && (
                  <div className="w-16 h-16 rounded-lg border overflow-hidden">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Label
                    htmlFor="logo-upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
                  >
                    <Upload className="h-4 w-4" />
                    {logoPreview ? 'Alterar Logo' : 'Adicionar Logo'}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG até 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Nome da Empresa */}
            <div className="space-y-2">
              <Label htmlFor="company_name">
                Nome da Empresa <span className="text-red-500">*</span>
              </Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => updateFormData('company_name', e.target.value)}
                placeholder="Digite o nome da empresa"
              />
            </div>

            {/* CNPJ */}
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => updateFormData('cnpj', formatCNPJ(e.target.value))}
                placeholder="00.000.000/0000-00"
                maxLength={18}
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição da Empresa</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Descreva brevemente sua empresa, seus valores e objetivos..."
                rows={4}
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>Informações da empresa</span>
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => updateFormData('website', e.target.value)}
                placeholder="https://www.suaempresa.com.br"
              />
            </div>

            {/* Porte da Empresa */}
            <div className="space-y-2">
              <Label>Porte da Empresa</Label>
              <Select
                value={formData.company_size}
                onValueChange={(value) => updateFormData('company_size', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o porte da empresa" />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_SIZE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Setor */}
            <div className="space-y-2">
              <Label>Setor de Atuação</Label>
              <Select
                value={formData.industry}
                onValueChange={(value) => updateFormData('industry', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_SECTOR_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Endereço */}
            <div className="space-y-2">
              <Label htmlFor="address">
                <MapPin className="h-4 w-4 inline mr-1" />
                Endereço
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => updateFormData('address', e.target.value)}
                placeholder="Rua, número, bairro, cidade, estado, CEP"
                rows={3}
              />
            </div>

            {/* Telefone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => updateFormData('phone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Dados do responsável</span>
            </div>

            {/* Nome do Responsável */}
            <div className="space-y-2">
              <Label htmlFor="responsible_name">
                Nome do Responsável <span className="text-red-500">*</span>
              </Label>
              <Input
                id="responsible_name"
                value={formData.responsible_name}
                onChange={(e) => updateFormData('responsible_name', e.target.value)}
                placeholder="Nome completo do responsável"
              />
            </div>

            {/* Cargo do Responsável */}
            <div className="space-y-2">
              <Label htmlFor="responsible_position">Cargo/Função</Label>
              <Input
                id="responsible_position"
                value={formData.responsible_position}
                onChange={(e) => updateFormData('responsible_position', e.target.value)}
                placeholder="Ex: Diretor de RH, Gerente de Benefícios"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">
                Informações importantes
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• O responsável será o contato principal para comunicações</li>
                <li>• Certifique-se de que os dados estão corretos</li>
                <li>• Você pode alterar essas informações a qualquer momento</li>
              </ul>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Editar Perfil da Empresa
          </DialogTitle>
        </DialogHeader>

        {/* Indicador de páginas */}
        <div className="flex items-center justify-center gap-2 py-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <div
              key={page}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                page === currentPage
                  ? 'bg-primary text-primary-foreground'
                  : page < currentPage
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {page}
            </div>
          ))}
        </div>

        {/* Conteúdo da página atual */}
        <div className="py-4">
          {renderCurrentPage()}
        </div>

        {/* Botões de navegação */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={prevPage}
            disabled={currentPage === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>

          <div className="flex gap-2">
            {currentPage < totalPages ? (
              <Button onClick={nextPage} className="flex items-center gap-2">
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar Perfil
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}