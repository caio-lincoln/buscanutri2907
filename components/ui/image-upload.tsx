"use client"

import React, { useState, useRef } from 'react'
import { Button } from './button'
import { Card } from './card'
import { uploadBlogImage, UploadResult } from '@/lib/image-upload'
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react'

interface ImageUploadProps {
  onImageUploaded: (url: string) => void
  onImageRemoved?: () => void
  currentImageUrl?: string
  userId: string
  className?: string
  disabled?: boolean
}

export function ImageUpload({
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file || disabled) return

    setIsUploading(true)
    setUploadError(null)

    try {
      const result: UploadResult = await uploadBlogImage(file, userId)
      
      if (result.success && result.url) {
        onImageUploaded(result.url)
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

  return (
    <div className={`space-y-4 ${className}`}>
      {currentImageUrl ? (
        <Card className="relative overflow-hidden">
          <div className="aspect-video relative">
            <img
              src={currentImageUrl}
              alt="Imagem selecionada"
              className="w-full h-full object-cover"
              key={currentImageUrl} // Force re-render when URL changes
              onLoad={() => console.log('Imagem carregada:', currentImageUrl)}
              onError={(e) => console.error('Erro ao carregar imagem:', currentImageUrl, e)}
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
                    PNG, JPG, WebP ou GIF até 5MB
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