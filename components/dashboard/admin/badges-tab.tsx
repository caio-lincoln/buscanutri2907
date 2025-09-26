'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Edit, Trash, Award, User, XCircle, Upload, X } from 'lucide-react'
import Image from 'next/image'
import { toast } from '@/components/ui/use-toast'
import {
  createBadge,
  getAllBadges,
  updateBadge,
  deleteBadge,
  assignBadgeToNutritionist,
  removeBadgeFromNutritionist,
  getNutritionistBadges,
} from '@/lib/badge-service'
import { getAllNutritionists } from '@/lib/nutritionist-service'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

type Props = {
  initialUser: Pick<User, 'id' | 'email' | 'user_metadata' | 'app_metadata'>
}

export function BadgesTab({ initialUser }: Props) {
  const [badges, setBadges] = useState([])
  const [nutritionists, setNutritionists] = useState([])
  const [selectedNutritionist, setSelectedNutritionist] = useState(null)
  const [nutritionistBadges, setNutritionistBadges] = useState([])
  const [loading, setLoading] = useState(true)
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [currentBadge, setCurrentBadge] = useState(null)
  const [adminUserId, setAdminUserId] = useState(null)
  const [iconFile, setIconFile] = useState(null)
  const [iconPreview, setIconPreview] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchData()
    fetchAdminUser()
  }, [])

  const fetchAdminUser = async () => {
    try {
      console.log('Initial user from props:', initialUser) // Debug log
      
      if (initialUser) {
        // Verificar se o usuário é realmente admin através dos metadados
        const userType = initialUser.user_metadata?.user_type || initialUser.app_metadata?.user_type
        console.log('User type from metadata:', userType) // Debug log
        
        if (userType === 'admin') {
          setAdminUserId(initialUser.id)
          console.log('Admin user ID set from props:', initialUser.id) // Debug log
        } else {
          console.warn('User is not admin:', userType)
          toast({
            title: 'Acesso Negado',
            description: 'Você precisa ser um administrador para gerenciar insígnias.',
            variant: 'destructive',
          })
        }
      } else {
        console.warn('No initial user provided')
        toast({
          title: 'Não Autenticado',
          description: 'Faça login como administrador para continuar.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error setting admin user:', error)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    const fetchedBadges = await getAllBadges()
    setBadges(fetchedBadges)
    const fetchedNutritionists = await getAllNutritionists()
    setNutritionists(fetchedNutritionists)
    setLoading(false)
  }

  const uploadIcon = async (file) => {
    if (!file) return null
    
    setUploading(true)
    
    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      
      // Upload para o bucket 'badges'
      const { data, error } = await supabase.storage
        .from('badges')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (error) {
        console.error('Erro no upload:', error)
        toast({
          title: 'Erro no upload',
          description: 'Não foi possível fazer upload do ícone.',
          variant: 'destructive',
        })
        return null
      }
      
      // Obter URL pública do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from('badges')
        .getPublicUrl(fileName)
      
      return publicUrl
    } catch (error) {
      console.error('Erro no upload:', error)
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível fazer upload do ícone.',
        variant: 'destructive',
      })
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validar tipo de arquivo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Tipo de arquivo inválido',
        description: 'Por favor, selecione um arquivo PNG, JPG, SVG ou WebP.',
        variant: 'destructive',
      })
      return
    }
    
    // Validar tamanho do arquivo (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O arquivo deve ter no máximo 2MB.',
        variant: 'destructive',
      })
      return
    }
    
    setIconFile(file)
    
    // Criar preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setIconPreview(e.target?.result)
    }
    reader.readAsDataURL(file)
  }

  const clearIcon = () => {
    setIconFile(null)
    setIconPreview(null)
    // Limpar o input de arquivo
    const fileInput = document.getElementById('badgeIcon')
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const handleCreateOrUpdateBadge = async e => {
    e.preventDefault()
    
    let iconUrl = currentBadge?.icon_url || ''
    
    // Se há um novo arquivo para upload
    if (iconFile) {
      const uploadedUrl = await uploadIcon(iconFile)
      if (uploadedUrl) {
        iconUrl = uploadedUrl
      } else {
        // Se o upload falhou, não continuar
        return
      }
    }

    if (currentBadge?.id) {
      // Atualizar insígnia existente
      const updatedBadge = await updateBadge(
        currentBadge.id,
        currentBadge.name,
        currentBadge.description,
        iconUrl
      )
      if (updatedBadge) {
        fetchData()
        setIsBadgeModalOpen(false)
        setCurrentBadge(null)
        setIconFile(null)
        setIconPreview(null)
        toast({
          title: 'Insígnia atualizada',
          description: 'A insígnia foi atualizada com sucesso.',
        })
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível atualizar a insígnia.',
          variant: 'destructive',
        })
      }
    } else {
      // Criar nova insígnia
      const newBadge = await createBadge(
        currentBadge.name,
        currentBadge.description,
        iconUrl
      )
      if (newBadge) {
        fetchData()
        setIsBadgeModalOpen(false)
        setCurrentBadge(null)
        setIconFile(null)
        setIconPreview(null)
        toast({
          title: 'Insígnia criada',
          description: 'A nova insígnia foi criada com sucesso.',
        })
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível criar a insígnia.',
          variant: 'destructive',
        })
      }
    }
  }

  const handleDeleteBadge = async id => {
    // Verificação segura para SSR
    if (typeof window === 'undefined' || !window.confirm) {
      return
    }
    
    if (window.confirm('Tem certeza que deseja excluir esta insígnia?')) {
      const success = await deleteBadge(id)
      if (success) {
        fetchData()
        toast({
          title: 'Insígnia excluída',
          description: 'A insígnia foi removida com sucesso.',
        })
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível excluir a insígnia.',
          variant: 'destructive',
        })
      }
    }
  }

  const handleAssignBadge = async badgeId => {
    if (!selectedNutritionist || !adminUserId) {
      toast({
        title: 'Erro',
        description: 'Selecione um nutricionista e faça login como admin.',
        variant: 'destructive',
      })
      return
    }

    try {
      console.log('Attempting to assign badge:', {
        badgeId,
        nutritionistId: selectedNutritionist.id,
        adminUserId
      })

      const result = await assignBadgeToNutritionist(
        badgeId,
        selectedNutritionist.id,
        adminUserId
      )

      console.log('Assignment result:', result)

      fetchNutritionistBadges(selectedNutritionist.id)
      toast({
        title: 'Insígnia atribuída',
        description: 'Insígnia adicionada ao nutricionista.',
      })
    } catch (error) {
      console.error('Error assigning badge:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atribuir a insígnia.',
        variant: 'destructive',
      })
    }
  }

  const handleRemoveBadge = async badgeId => {
    if (!selectedNutritionist) return
    
    // Verificação segura para SSR
    if (typeof window === 'undefined' || !window.confirm) {
      return
    }
    
    if (
      window.confirm(
        'Tem certeza que deseja remover esta insígnia do nutricionista?'
      )
    ) {
      const success = await removeBadgeFromNutritionist(
        selectedNutritionist.id,
        badgeId
      )
      if (success) {
        fetchNutritionistBadges(selectedNutritionist.id)
        toast({
          title: 'Insígnia removida',
          description: 'Insígnia removida do nutricionista.',
        })
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível remover a insígnia.',
          variant: 'destructive',
        })
      }
    }
  }

  const fetchNutritionistBadges = async nutritionistId => {
    const badges = await getNutritionistBadges(nutritionistId)
    setNutritionistBadges(badges)
  }

  const handleSelectNutritionist = nutri => {
    setSelectedNutritionist(nutri)
    fetchNutritionistBadges(nutri.id)
    setIsAssignModalOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-500 mx-auto"></div>
        <p className="text-[#1E1D40]/70 font-medium ml-4">
          Carregando insígnias...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">
            Gerenciar Insígnias
          </h1>
          <p className="text-gray-600">
            Crie, edite e atribua insígnias de mérito aos nutricionistas.
          </p>
        </div>
        <Dialog open={isBadgeModalOpen} onOpenChange={setIsBadgeModalOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => setCurrentBadge({})}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Insígnia
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {currentBadge?.id ? 'Editar Insígnia' : 'Criar Nova Insígnia'}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleCreateOrUpdateBadge}
              className="grid gap-4 py-4"
            >
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="badgeName" className="text-right">
                  Nome
                </Label>
                <Input
                  id="badgeName"
                  value={currentBadge?.name || ''}
                  onChange={e =>
                    setCurrentBadge({ ...currentBadge, name: e.target.value })
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="badgeDescription" className="text-right">
                  Descrição
                </Label>
                <Textarea
                  id="badgeDescription"
                  value={currentBadge?.description || ''}
                  onChange={e =>
                    setCurrentBadge({
                      ...currentBadge,
                      description: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="badgeIcon" className="text-right">
                  Ícone
                </Label>
                <div className="col-span-3 space-y-3">
                  {/* Preview do ícone atual ou novo */}
                  {(iconPreview || currentBadge?.icon_url) && (
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                      <Image
                        src={iconPreview || currentBadge?.icon_url || '/placeholder.svg'}
                        alt="Preview do ícone"
                        width={40}
                        height={40}
                        className="rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {iconFile ? iconFile.name : 'Ícone atual'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {iconFile ? `${(iconFile.size / 1024).toFixed(1)} KB` : 'Arquivo existente'}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearIcon}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Input de arquivo */}
                  <div className="flex items-center gap-2">
                    <Input
                      id="badgeIcon"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('badgeIcon')?.click()}
                      disabled={uploading}
                      className="flex-1"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {iconFile ? 'Trocar Ícone' : 'Selecionar Ícone'}
                    </Button>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    Formatos aceitos: PNG, JPG, SVG, WebP (máx. 2MB)
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Seção de Insígnias Existentes */}
      <Card className="border-0 shadow-lg backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-emerald-600" /> Insígnias Criadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {badges.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Nenhuma insígnia criada ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Ícone</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {badges.map(badge => (
                  <TableRow key={badge.id}>
                    <TableCell>
                      <Image
                        src={
                          badge.icon_url ||
                          '/placeholder.svg?height=32&width=32&query=badge'
                        }
                        alt={badge.name}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{badge.name}</TableCell>
                    <TableCell className="text-gray-600">
                      {badge.description}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCurrentBadge(badge)
                          setIsBadgeModalOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBadge(badge.id)}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Seção de Atribuir Insígnias a Nutricionistas */}
      <Card className="border-0 shadow-lg backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-emerald-600" /> Atribuir Insígnias a
            Nutricionistas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Selecione um nutricionista para atribuir ou remover insígnias.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Nutricionista</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nutritionists.map(nutri => (
                <TableRow key={nutri.id}>
                  <TableCell className="font-medium">
                    {nutri.full_name}
                  </TableCell>
                  <TableCell className="text-gray-600">{nutri.email}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectNutritionist(nutri)}
                    >
                      <Award className="h-4 w-4 mr-2" /> Gerenciar Insígnias
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Atribuição de Insígnias */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Gerenciar Insígnias para {selectedNutritionist?.full_name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Insígnias Atribuídas
              </h3>
              {nutritionistBadges.length === 0 ? (
                <p className="text-gray-500">
                  Nenhuma insígnia atribuída a este nutricionista ainda.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {nutritionistBadges.map(nb => (
                    <div key={nb.id} className="flex items-center gap-2 pr-1">
                      {nb.badge?.icon_url && (
                        <Image
                          src={nb.badge.icon_url || '/placeholder.svg'}
                          alt={nb.badge.name || 'insígnia'}
                          width={20}
                          height={20}
                          className="rounded-full"
                        />
                      )}
                      {nb.badge?.name}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-full hover:bg-white/20"
                        onClick={() => handleRemoveBadge(nb.badge_id)}
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                Atribuir Nova Insígnia
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {badges.map(badge => {
                  const isAssigned = nutritionistBadges.some(
                    nb => nb.badge_id === badge.id
                  )
                  return (
                    <Button
                      key={badge.id}
                      variant={isAssigned ? 'secondary' : 'outline'}
                      onClick={() => handleAssignBadge(badge.id)}
                      disabled={isAssigned}
                      className="flex flex-col h-auto py-4 items-center justify-center text-center gap-2"
                    >
                      <Image
                        src={
                          badge.icon_url ||
                          '/placeholder.svg?height=32&width=32&query=badge'
                        }
                        alt={badge.name}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                      <span className="text-sm font-medium">{badge.name}</span>
                      {isAssigned && (
                        <span className="text-xs text-gray-500">
                          (Atribuída)
                        </span>
                      )}
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignModalOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
