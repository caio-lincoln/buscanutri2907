"use client"

import React, { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Button } from './button'
import { Card } from './card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './dialog'
import { Slider } from './slider'
import { Label } from './label'
import { uploadBlogImage, UploadResult } from '@/lib/image-upload'
import { 
  Loader2, 
  Upload, 
  X, 
  Image as ImageIcon, 
  Edit3, 
  RotateCw, 
  ZoomIn, 
  ZoomOut,
  Move,
  Crop,
  Download,
  Eye
} from 'lucide-react'

interface ImageUploadProps {
  onImageUploaded: (url: string) => void
  onImageRemoved?: () => void
  currentImageUrl?: string
  userId: string
  className?: string
  disabled?: boolean
}

interface ImageEditState {
  scale: number
  rotation: number
  x: number
  y: number
  brightness: number
  contrast: number
  saturation: number
}

interface CompressedImageResult {
  file: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
}

export function AdvancedImageUpload({
  onImageUploaded,
  onImageRemoved,
  currentImageUrl,
  userId,
  className = "",
  disabled = false
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [compressedImage, setCompressedImage] = useState<CompressedImageResult | null>(null)
  
  const [editState, setEditState] = useState<ImageEditState>({
    scale: 1,
    rotation: 0,
    x: 0,
    y: 0,
    brightness: 100,
    contrast: 100,
    saturation: 100
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Função para comprimir imagem
  const compressImage = useCallback(async (file: File, quality: number = 0.8): Promise<CompressedImageResult> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()

      img.onload = () => {
        // Calcular dimensões otimizadas
        let { width, height } = img
        const maxWidth = 1920
        const maxHeight = 1080

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width *= ratio
          height *= ratio
        }

        canvas.width = width
        canvas.height = height

        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height)

        // Converter para blob com compressão
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type === 'image/png' ? 'image/webp' : file.type,
              lastModified: Date.now()
            })

            resolve({
              file: compressedFile,
              originalSize: file.size,
              compressedSize: blob.size,
              compressionRatio: Math.round((1 - blob.size / file.size) * 100)
            })
          }
        }, file.type === 'image/png' ? 'image/webp' : file.type, quality)
      }

      img.src = URL.createObjectURL(file)
    })
  }, [])

  // Função para aplicar edições na imagem
  const applyImageEdits = useCallback(async (): Promise<File | null> => {
    if (!selectedFile || !canvasRef.current || !imageRef.current) return null

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    const img = imageRef.current

    // Configurar canvas
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight

    // Aplicar transformações
    ctx.save()
    
    // Centralizar e aplicar transformações
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((editState.rotation * Math.PI) / 180)
    ctx.scale(editState.scale, editState.scale)
    ctx.translate(-canvas.width / 2, -canvas.height / 2)
    ctx.translate(editState.x, editState.y)

    // Aplicar filtros
    ctx.filter = `brightness(${editState.brightness}%) contrast(${editState.contrast}%) saturate(${editState.saturation}%)`

    // Desenhar imagem
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    ctx.restore()

    // Converter para blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const editedFile = new File([blob], selectedFile.name, {
            type: selectedFile.type,
            lastModified: Date.now()
          })
          resolve(editedFile)
        } else {
          resolve(null)
        }
      }, selectedFile.type, 0.9)
    })
  }, [selectedFile, editState])

  const handleFileSelect = async (file: File) => {
    if (!file || disabled) return

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Formato não suportado. Use JPEG, PNG, WebP, AVIF ou GIF.')
      return
    }

    // Validar tamanho
    if (file.size > 10 * 1024 * 1024) { // 10MB
      setUploadError('Arquivo muito grande. Máximo 10MB.')
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setUploadError(null)

    // Comprimir automaticamente
    try {
      const compressed = await compressImage(file)
      setCompressedImage(compressed)
    } catch (error) {
      console.error('Erro na compressão:', error)
    }

    setShowPreview(true)
  }

  const handleUpload = async (fileToUpload?: File) => {
    const file = fileToUpload || compressedImage?.file || selectedFile
    if (!file) return

    setIsUploading(true)
    setUploadError(null)

    try {
      const result: UploadResult = await uploadBlogImage(file, userId)
      
      if (result.success && result.url) {
        onImageUploaded(result.url)
        setShowPreview(false)
        setShowEditor(false)
        setSelectedFile(null)
        setPreviewUrl("")
        setCompressedImage(null)
      } else {
        setUploadError(result.error || 'Erro ao fazer upload da imagem')
      }
    } catch (error) {
      setUploadError('Erro inesperado ao fazer upload')
      console.error('Erro no upload:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleEditAndUpload = async () => {
    const editedFile = await applyImageEdits()
    if (editedFile) {
      const compressed = await compressImage(editedFile)
      await handleUpload(compressed.file)
    }
  }

  const resetEditState = () => {
    setEditState({
      scale: 1,
      rotation: 0,
      x: 0,
      y: 0,
      brightness: 100,
      contrast: 100,
      saturation: 100
    })
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled) return

    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file)
    }
  }

  const handleRemoveImage = () => {
    if (onImageRemoved) {
      onImageRemoved()
    }
    setUploadError(null)
  }

  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {currentImageUrl ? (
        <Card className="relative overflow-hidden">
          <div className="aspect-video relative">
            <Image
              src={currentImageUrl}
              alt="Imagem selecionada"
              fill
              className="object-cover"
              key={currentImageUrl}
            />
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleRemoveImage}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="p-2 text-xs text-gray-500 text-center truncate">
            {currentImageUrl}
          </div>
        </Card>
      ) : (
        <Card
          className={`
            border-2 border-dashed p-8 text-center cursor-pointer transition-colors
            ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <div className="flex flex-col items-center space-y-4">
            {isUploading ? (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-sm text-gray-600">Fazendo upload...</p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Clique para selecionar ou arraste uma imagem
                  </p>
                  <p className="text-xs text-gray-500">
                    JPEG, PNG, WebP, AVIF ou GIF até 10MB
                  </p>
                  <p className="text-xs text-blue-600">
                    ✨ Com compressão automática e editor integrado
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" disabled={disabled}>
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar Imagem
                </Button>
              </>
            )}
          </div>
        </Card>
      )}

      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{uploadError}</p>
        </div>
      )}

      {/* Dialog de Pré-visualização */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pré-visualização da Imagem</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {previewUrl && (
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={previewUrl}
                  alt="Pré-visualização"
                  fill
                  className="object-contain"
                />
              </div>
            )}

            {compressedImage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">Compressão Automática Aplicada</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Tamanho original:</span>
                    <p className="font-medium">{formatFileSize(compressedImage.originalSize)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Tamanho otimizado:</span>
                    <p className="font-medium text-green-600">{formatFileSize(compressedImage.compressedSize)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Redução:</span>
                    <p className="font-medium text-green-600">{compressedImage.compressionRatio}%</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={() => handleUpload()} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Enviar Imagem
                  </>
                )}
              </Button>
              
              <Button variant="outline" onClick={() => setShowEditor(true)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Editar Imagem
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog do Editor */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editor de Imagem</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Área de edição */}
            <div className="lg:col-span-2 space-y-4">
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                {previewUrl && (
                  <>
                    <img
                      ref={imageRef}
                      src={previewUrl}
                      alt="Editor"
                      className="w-full h-full object-contain"
                      style={{
                        transform: `scale(${editState.scale}) rotate(${editState.rotation}deg) translate(${editState.x}px, ${editState.y}px)`,
                        filter: `brightness(${editState.brightness}%) contrast(${editState.contrast}%) saturate(${editState.saturation}%)`
                      }}
                    />
                    <canvas ref={canvasRef} className="hidden" />
                  </>
                )}
              </div>
            </div>

            {/* Controles */}
            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium">Transformações</Label>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label className="text-xs text-gray-600">Escala: {editState.scale.toFixed(2)}x</Label>
                    <Slider
                      value={[editState.scale]}
                      onValueChange={([value]) => setEditState(prev => ({ ...prev, scale: value }))}
                      min={0.1}
                      max={3}
                      step={0.1}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-gray-600">Rotação: {editState.rotation}°</Label>
                    <Slider
                      value={[editState.rotation]}
                      onValueChange={([value]) => setEditState(prev => ({ ...prev, rotation: value }))}
                      min={-180}
                      max={180}
                      step={15}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-gray-600">Posição X: {editState.x}px</Label>
                    <Slider
                      value={[editState.x]}
                      onValueChange={([value]) => setEditState(prev => ({ ...prev, x: value }))}
                      min={-200}
                      max={200}
                      step={10}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-gray-600">Posição Y: {editState.y}px</Label>
                    <Slider
                      value={[editState.y]}
                      onValueChange={([value]) => setEditState(prev => ({ ...prev, y: value }))}
                      min={-200}
                      max={200}
                      step={10}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Ajustes de Cor</Label>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label className="text-xs text-gray-600">Brilho: {editState.brightness}%</Label>
                    <Slider
                      value={[editState.brightness]}
                      onValueChange={([value]) => setEditState(prev => ({ ...prev, brightness: value }))}
                      min={50}
                      max={150}
                      step={5}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-gray-600">Contraste: {editState.contrast}%</Label>
                    <Slider
                      value={[editState.contrast]}
                      onValueChange={([value]) => setEditState(prev => ({ ...prev, contrast: value }))}
                      min={50}
                      max={150}
                      step={5}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-gray-600">Saturação: {editState.saturation}%</Label>
                    <Slider
                      value={[editState.saturation]}
                      onValueChange={([value]) => setEditState(prev => ({ ...prev, saturation: value }))}
                      min={0}
                      max={200}
                      step={10}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={resetEditState} size="sm">
                  Resetar
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditor(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditAndUpload} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Aplicando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Aplicar e Enviar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  )
}