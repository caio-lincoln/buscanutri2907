'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { Button } from './button'
import { Card } from './card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './dialog'
import { Slider } from './slider'
import { Label } from './label'
import { uploadBlogImage, UploadResult } from '@/lib/image-upload'
import { createSupabaseClient } from '@/lib/supabase'
import ReactCrop, {
  Crop,
  PixelCrop,
  centerCrop,
  makeAspectCrop,
} from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import {
  Loader2,
  Upload,
  X,
  Image as ImageIcon,
  Crop as CropIcon,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Move,
  Download,
  Eye,
  RefreshCw,
} from 'lucide-react'

interface ImageCropUploadProps {
  onImageUploaded: (url: string) => void
  onImageRemoved?: () => void
  currentImageUrl?: string
  userId: string
  className?: string
  disabled?: boolean
  aspectRatio?: number // 16/5 para capa, 1 para avatar
  cropType: 'cover' | 'avatar'
  minWidth?: number
  minHeight?: number
  title?: string
  description?: string
}

interface CropState {
  crop: Crop
  completedCrop: PixelCrop | undefined
  scale: number
  rotate: number
}

export function ImageCropUpload({
  onImageUploaded,
  onImageRemoved,
  currentImageUrl,
  userId,
  className = '',
  disabled = false,
  aspectRatio = undefined,
  cropType,
  minWidth = 600,
  minHeight = 600,
  title = 'Upload de Imagem',
  description = 'Selecione uma imagem para fazer upload',
}: ImageCropUploadProps) {
  const supabase = createSupabaseClient()
  const [ isUploading, setIsUploading ] = useState(false)
  const [ uploadError, setUploadError ] = useState<string | null>(null)
  const [ uploadSuccess, setUploadSuccess ] = useState<string | null>(null)
  const [ dragActive, setDragActive ] = useState(false)
  const [ showCropModal, setShowCropModal ] = useState(false)
  const [ selectedFile, setSelectedFile ] = useState<File | null>(null)
  const [ imageSrc, setImageSrc ] = useState<string>('')
  const [ croppedImageUrl, setCroppedImageUrl ] = useState<string>('')

  const [ cropState, setCropState ] = useState<CropState>({
    crop: {
      unit: '%',
      width: 90,
      height: 90,
      x: 5,
      y: 5,
    },
    completedCrop: undefined,
    scale: 1,
    rotate: 0,
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Função para validar arquivo
  const validateFile = (file: File): string | null => {
    const allowedTypes = [ 'image/jpeg', 'image/jpg', 'image/png', 'image/webp' ]
    if (!allowedTypes.includes(file.type)) {
      return 'Formato nao suportado. Use JPEG, PNG ou WebP.'
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB
      return 'Arquivo muito grande. Maximo 5MB.'
    }

    return null
  }

  // Função para validar dimensões da imagem
  const validateImageDimensions = (img: HTMLImageElement): string | null => {
    if (cropType === 'cover') {
      if (img.naturalWidth < minWidth || img.naturalHeight < minHeight) {
        return `Dimensão mínima para capa: ${minWidth}x${minHeight}px. Sua imagem: ${img.naturalWidth}x${img.naturalHeight}px`
      }
    } else if (cropType === 'avatar') {
      if (img.naturalWidth < 600 || img.naturalHeight < 600) {
        return `Dimensão mínima para avatar: 600x600px. Sua imagem: ${img.naturalWidth}x${img.naturalHeight}px`
      }
    }
    return null
  }

  // Função para criar crop inicial
  const createInitialCrop = (imageWidth: number, imageHeight: number): Crop => {
    if (aspectRatio) {
      return centerCrop(
        makeAspectCrop({ unit: '%', width: 90 }, aspectRatio, imageWidth, imageHeight),
        imageWidth,
        imageHeight
      )
    }
    return centerCrop(
      { unit: '%', width: 90, height: 40, x: 5, y: 30 },
      imageWidth,
      imageHeight
    )
  }

  // Função para lidar com seleção de arquivo
  const handleFileSelect = async (file: File) => {
    if (!file || disabled) return

    const validationError = validateFile(file)
    if (validationError) {
      setUploadError(validationError)
      return
    }

    setSelectedFile(file)
    setUploadError(null)
    setUploadSuccess(null)

    // Criar URL da imagem
    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(reader.result as string)
      setShowCropModal(true)
    }
    reader.readAsDataURL(file)
  }

  // Função para lidar com carregamento da imagem no crop
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget

    // Validar dimensões
    const dimensionError = validateImageDimensions(e.currentTarget)
    if (dimensionError) {
      setUploadError(dimensionError)
      setShowCropModal(false)
      return
    }

    // Criar crop inicial
    const initialCrop = createInitialCrop(width, height)
    setCropState(prev => ({ ...prev, crop: initialCrop }))
  }

  // Função para gerar imagem cortada
  const getCroppedImg = useCallback(async (): Promise<File | null> => {
    if (!imageRef.current || !canvasRef.current || !cropState.completedCrop) {
      return null
    }

    const image = imageRef.current
    const canvas = canvasRef.current
    const crop = cropState.completedCrop

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    canvas.width = crop.width
    canvas.height = crop.height

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // Aplicar transformações
    ctx.save()

    // Aplicar rotação se houver
    if (cropState.rotate !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((cropState.rotate * Math.PI) / 180)
      ctx.translate(-canvas.width / 2, -canvas.height / 2)
    }

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    )

    ctx.restore()

    return new Promise(resolve => {
      canvas.toBlob(
        blob => {
          if (!blob || !selectedFile) {
            resolve(null)
            return
          }

          const croppedFile = new File([ blob ], selectedFile.name, {
            type: selectedFile.type,
            lastModified: Date.now(),
          })

          resolve(croppedFile)
        },
        selectedFile?.type || 'image/jpeg',
        0.9
      )
    })
  }, [ cropState.completedCrop, cropState.rotate, selectedFile ])

  // Função para fazer upload da imagem cortada
  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadError(null)
    setUploadSuccess(null)

    try {
      const croppedFile = await getCroppedImg()
      if (!croppedFile) {
        throw new Error('Erro ao processar a imagem')
      }

      // Obter sessão do usuário
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.access_token || !session?.user) {
        throw new Error('Usuario nao autenticado')
      }

      // Determinar tipo de usuário baseado no perfil
      let userType = 'patient' // padrão

      // Verificar se é nutricionista
      const { data: nutritionistProfile } = await supabase
        .from('nutritionist_profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single()

      if (nutritionistProfile) {
        userType = 'nutritionist'
      } else {
        // Verificar se é empresa
        const { data: companyProfile } = await supabase
          .from('company_profiles')
          .select('id')
          .eq('user_id', session.user.id)
          .single()

        if (companyProfile) {
          userType = 'company'
        }
      }

      // Preparar FormData
      const formData = new FormData()
      formData.append('file', croppedFile)
      formData.append('userId', session.user.id)
      formData.append('userType', userType)
      formData.append('imageType', cropType)
      formData.append('accessToken', session.access_token)

      // Fazer upload via API
      const response = await fetch('/api/upload-profile-image', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Erro no upload')
      }

      // Atualizar perfil no banco de dados
      const updateField =
        cropType === 'cover' ? 'cover_image_url' : 'profile_image_url'
      const tableName =
        userType === 'nutritionist'
          ? 'nutritionist_profiles'
          : userType === 'company'
            ? 'company_profiles'
            : 'patient_profiles'

      const { error: updateError } = await supabase
        .from(tableName)
        .update({ [ updateField ]: result.url })
        .eq('user_id', session.user.id)

      if (updateError) {
        // Silent error handling: Error updating profile
        // Não falhar completamente, pois a imagem foi enviada com sucesso
      }

      onImageUploaded(result.url)
      setUploadSuccess('Imagem enviada com sucesso!')
      setShowCropModal(false)
      setSelectedFile(null)
      setImageSrc('')
      setCroppedImageUrl('')

      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setUploadSuccess(null), 3000)
    } catch (error) {
      // Silent error handling: Upload error
      setUploadError(error instanceof Error ? error.message : 'Erro no upload')
    } finally {
      setIsUploading(false)
    }
  }

  // Função para remover imagem
  const handleRemove = () => {
    if (onImageRemoved) {
      onImageRemoved()
      setUploadSuccess('Imagem removida com sucesso!')
      setTimeout(() => setUploadSuccess(null), 3000)
    }
  }

  // Handlers para drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled) return

    const file = e.dataTransfer.files?.[ 0 ]
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file)
    }
  }

  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[ 0 ]
    if (file) {
      handleFileSelect(file)
    }
  }

  // Reset crop quando mudar a escala ou rotação
  useEffect(() => {
    if (imageRef.current) {
      const { width, height } = imageRef.current
      const newCrop = createInitialCrop(width, height)
      setCropState(prev => ({ ...prev, crop: newCrop }))
    }
  }, [ cropState.scale, cropState.rotate, aspectRatio ])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Preview da imagem atual */}
      {currentImageUrl && (
        <Card className="relative overflow-hidden">
          <div
            className={`relative ${cropType === 'cover' ? 'w-full' : 'aspect-square w-32 h-32 mx-auto'}`}
            style={cropType === 'cover' ? { height: 180 } : undefined} // altura fixa amigável
          >
            <Image
              src={currentImageUrl}
              alt={cropType === 'cover' ? 'Capa atual' : 'Avatar atual'}
              fill
              className={`object-cover ${cropType === 'avatar' ? 'rounded-full' : ''}`}
              key={currentImageUrl}
            />
          </div>
          <div className="absolute top-2 right-2 flex gap-2">
            <Button size="sm" variant="destructive" onClick={handleRemove} disabled={disabled}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Área de upload */}
      <Card
        className={`relative border-2 border-dashed transition-colors cursor-pointer ${dragActive
          ? 'border-primary bg-primary/5'
          : 'border-gray-300 hover:border-gray-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <div className="p-8 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{title}</p>
              <p className="text-xs text-gray-500">{description}</p>
              <p className="text-xs text-gray-400">
                {cropType === 'cover'
                  ? `Formatos: JPEG, PNG, WebP - Mín: ${minWidth}x${minHeight}px - Máx: 5MB`
                  : 'Formatos: JPEG, PNG, WebP - Min: 600x600px - Máx: 5MB'}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
            >
              <Upload className="h-4 w-4 mr-2" />
              Selecionar Arquivo
            </Button>
          </div>
        </div>
      </Card>

      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Mensagens de erro e sucesso */}
      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{uploadError}</p>
        </div>
      )}

      {uploadSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600">{uploadSuccess}</p>
        </div>
      )}

      {/* Modal de crop */}
      <Dialog open={showCropModal} onOpenChange={setShowCropModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {cropType === 'cover'
                ? 'Editar Capa do Perfil'
                : 'Editar Foto de Perfil'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Controles de transformação */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Zoom: {cropState.scale.toFixed(1)}x</Label>
                <Slider
                  value={[ cropState.scale ]}
                  onValueChange={([ value ]) =>
                    setCropState(prev => ({ ...prev, scale: value }))
                  }
                  min={0.5}
                  max={3}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Rotacao: {cropState.rotate} graus</Label>
                <Slider
                  value={[ cropState.rotate ]}
                  onValueChange={([ value ]) =>
                    setCropState(prev => ({ ...prev, rotate: value }))
                  }
                  min={-180}
                  max={180}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="flex items-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCropState(prev => ({
                      ...prev,
                      scale: 1,
                      rotate: 0,
                    }))
                  }
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>

            {/* Área de crop */}
            <div className="relative bg-gray-100 rounded-lg overflow-hidden">
              {imageSrc && (
                <ReactCrop
                  crop={cropState.crop}
                  onChange={(_, percentCrop) => setCropState(prev => ({ ...prev, crop: percentCrop }))}
                  onComplete={c => setCropState(prev => ({ ...prev, completedCrop: c }))}
                  aspect={aspectRatio ?? undefined}
                  minWidth={minWidth / 4}
                  minHeight={minHeight / 4}
                >
                  <img
                    ref={imageRef}
                    alt="Crop"
                    src={imageSrc}
                    style={{
                      transform: `scale(${cropState.scale}) rotate(${cropState.rotate}deg)`,
                      maxHeight: '400px',
                      width: 'auto',
                    }}
                    onLoad={onImageLoad}
                  />
                </ReactCrop>
              )}
            </div>

            {/* Preview do crop */}
            {cropState.completedCrop && (
              <div className="space-y-2">
                <Label>Preview:</Label>
                <div
                  className={`relative mx-auto ${cropType === 'cover' ? 'w-80 h-20' : 'w-24 h-24'
                    }`}
                >
                  <canvas
                    ref={canvasRef}
                    className={`w-full h-full border border-gray-300 ${cropType === 'avatar' ? 'rounded-full' : 'rounded'
                      }`}
                    style={{
                      width: cropType === 'cover' ? '320px' : '96px',
                      height: cropType === 'cover' ? '80px' : '96px',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCropModal(false)}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={isUploading || !cropState.completedCrop}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
