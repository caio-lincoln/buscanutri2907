'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Camera,
  Upload,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  Loader2,
  Check,
  X,
  AlertCircle,
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { useProfile } from '@/contexts/profile-context'

type Props = {
  initialUser: Pick<SupabaseUser, 'id' | 'email' | 'user_metadata' | 'app_metadata'>
}

interface ProfileData {
  full_name: string
  email: string
  avatar_url?: string
}

export function ProfileTab({ initialUser }: Props) {
  const { profileData, updateProfile } = useProfile()
  
  const [isEditing, setIsEditing] = useState({
    name: false,
    email: false,
    password: false,
  })
  
  const [formData, setFormData] = useState({
    full_name: profileData.full_name,
    email: profileData.email,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  
  const [loading, setLoading] = useState({
    photo: false,
    name: false,
    email: false,
    password: false,
  })
  
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createSupabaseClient()

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  // Upload file to Supabase Storage
  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB')
      return
    }

    setLoading(prev => ({ ...prev, photo: true }))

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${initialUser.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath)

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      })

      if (updateError) throw updateError

      updateProfile({ avatar_url: publicUrl })
      toast.success('Foto de perfil atualizada com sucesso!')
      
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error)
      toast.error('Erro ao atualizar foto de perfil')
    } finally {
      setLoading(prev => ({ ...prev, photo: false }))
    }
  }

  // Update full name
  const handleUpdateName = async () => {
    if (!formData.full_name.trim()) {
      toast.error('Nome não pode estar vazio')
      return
    }

    setLoading(prev => ({ ...prev, name: true }))

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: formData.full_name }
      })

      if (error) throw error

      updateProfile({ full_name: formData.full_name })
      setIsEditing(prev => ({ ...prev, name: false }))
      toast.success('Nome atualizado com sucesso!')
      
    } catch (error: any) {
      console.error('Erro ao atualizar nome:', error)
      toast.error('Erro ao atualizar nome')
    } finally {
      setLoading(prev => ({ ...prev, name: false }))
    }
  }

  // Update email
  const handleUpdateEmail = async () => {
    if (!formData.email.trim()) {
      toast.error('Email não pode estar vazio')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Por favor, insira um email válido')
      return
    }

    setLoading(prev => ({ ...prev, email: true }))

    try {
      const { error } = await supabase.auth.updateUser({
        email: formData.email
      })

      if (error) throw error

      updateProfile({ email: formData.email })
      setIsEditing(prev => ({ ...prev, email: false }))
      toast.success('Email atualizado! Verifique sua caixa de entrada para confirmar.')
      
    } catch (error: any) {
      console.error('Erro ao atualizar email:', error)
      toast.error('Erro ao atualizar email')
    } finally {
      setLoading(prev => ({ ...prev, email: false }))
    }
  }

  // Update password
  const handleUpdatePassword = async () => {
    if (!formData.newPassword || !formData.confirmPassword) {
      toast.error('Preencha todos os campos de senha')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    if (formData.newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setLoading(prev => ({ ...prev, password: true }))

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      })

      if (error) throw error

      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }))
      setIsEditing(prev => ({ ...prev, password: false }))
      toast.success('Senha atualizada com sucesso!')
      
    } catch (error: any) {
      console.error('Erro ao atualizar senha:', error)
      toast.error('Erro ao atualizar senha')
    } finally {
      setLoading(prev => ({ ...prev, password: false }))
    }
  }

  // Cancel editing
  const handleCancelEdit = (field: keyof typeof isEditing) => {
    setIsEditing(prev => ({ ...prev, [field]: false }))
    setFormData(prev => ({
      ...prev,
      full_name: profileData.full_name,
      email: profileData.email,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center">
          <User className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1E1D40]">Meu Perfil</h1>
          <p className="text-gray-600">Gerencie suas informações pessoais</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Photo Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Foto de Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-32 h-32">
                <AvatarImage src={profileData.avatar_url} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                  {profileData.full_name?.charAt(0)?.toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>

              <div
                className={`relative w-full border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-300 hover:border-emerald-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {loading.photo ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                    <p className="text-sm text-gray-600">Enviando...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Arraste uma imagem ou{' '}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        clique aqui
                      </button>
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG até 5MB</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nome Completo
              </Label>
              <div className="flex items-center gap-2">
                {isEditing.name ? (
                  <>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Digite seu nome completo"
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={handleUpdateName}
                      disabled={loading.name}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {loading.name ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancelEdit('name')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Input
                      value={profileData.full_name}
                      readOnly
                      className="flex-1 bg-gray-50"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(prev => ({ ...prev, name: true }))
                        setFormData(prev => ({ ...prev, full_name: profileData.full_name }))
                      }}
                    >
                      Editar
                    </Button>
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <div className="flex items-center gap-2">
                {isEditing.email ? (
                  <>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Digite seu email"
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={handleUpdateEmail}
                      disabled={loading.email}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {loading.email ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancelEdit('email')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Input
                      value={profileData.email}
                      readOnly
                      className="flex-1 bg-gray-50"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(prev => ({ ...prev, email: true }))
                        setFormData(prev => ({ ...prev, email: profileData.email }))
                      }}
                    >
                      Editar
                    </Button>
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* Password */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Senha
              </Label>
              
              {!isEditing.password ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="password"
                    value="••••••••"
                    readOnly
                    className="flex-1 bg-gray-50"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(prev => ({ ...prev, password: true }))}
                  >
                    Alterar Senha
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <Input
                      type={showPasswords.new ? 'text' : 'password'}
                      placeholder="Nova senha"
                      value={formData.newPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  <div className="relative">
                    <Input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      placeholder="Confirmar nova senha"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleUpdatePassword}
                      disabled={loading.password}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {loading.password ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Salvar Senha
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleCancelEdit('password')}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status da Conta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium text-[#1E1D40]">Conta Ativa</p>
                <p className="text-sm text-gray-600">Administrador do sistema</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
              Admin
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
