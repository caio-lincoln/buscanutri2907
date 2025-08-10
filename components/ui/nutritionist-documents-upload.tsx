"use client"

import React, { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Upload, FileText, AlertCircle, CheckCircle, Plus, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Certificate {
  id?: string
  title: string
  file: File | null
  fileName?: string
  fileUrl?: string
  fileSize?: number
  isUploaded?: boolean
}

interface NutritionistDocumentsUploadProps {
  // Props para CRN
  crnNumber: string
  onCrnNumberChange: (value: string) => void
  crnProofFile: File | null
  onCrnProofFileChange: (file: File | null) => void
  crnProofUrl?: string
  
  // Props para certificados
  certificates: Certificate[]
  onCertificatesChange: (certificates: Certificate[]) => void
  
  // Props gerais
  isRequired?: boolean
  disabled?: boolean
  className?: string
}

export function NutritionistDocumentsUpload({
  crnNumber,
  onCrnNumberChange,
  crnProofFile,
  onCrnProofFileChange,
  crnProofUrl,
  certificates,
  onCertificatesChange,
  isRequired = true,
  disabled = false,
  className = ""
}: NutritionistDocumentsUploadProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [dragOver, setDragOver] = useState<string | null>(null)
  
  const crnFileInputRef = useRef<HTMLInputElement>(null)
  const certificateFileInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  // Validação de arquivo
  const validateFile = useCallback((file: File): string | null => {
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"]
    
    if (!allowedTypes.includes(file.type)) {
      return "Formato inválido. Aceitos: PDF, JPG, PNG"
    }
    
    if (file.size > maxSize) {
      return "Arquivo muito grande. Máximo: 5MB"
    }
    
    return null
  }, [])

  // Formatação de tamanho de arquivo
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }, [])

  // Handlers para CRN
  const handleCrnFileSelect = useCallback((file: File) => {
    const error = validateFile(file)
    if (error) {
      setErrors(prev => ({ ...prev, crnProof: error }))
      return
    }
    
    setErrors(prev => ({ ...prev, crnProof: "" }))
    onCrnProofFileChange(file)
  }, [validateFile, onCrnProofFileChange])

  const handleCrnFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(null)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleCrnFileSelect(files[0])
    }
  }, [handleCrnFileSelect])

  const handleCrnFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleCrnFileSelect(files[0])
    }
  }, [handleCrnFileSelect])

  // Handlers para certificados
  const addCertificate = useCallback(() => {
    const newCertificate: Certificate = {
      title: "",
      file: null
    }
    onCertificatesChange([...certificates, newCertificate])
  }, [certificates, onCertificatesChange])

  const removeCertificate = useCallback((index: number) => {
    const newCertificates = certificates.filter((_, i) => i !== index)
    onCertificatesChange(newCertificates)
    
    // Limpar erros do certificado removido
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[`certificate_${index}_title`]
      delete newErrors[`certificate_${index}_file`]
      return newErrors
    })
  }, [certificates, onCertificatesChange])

  const updateCertificateTitle = useCallback((index: number, title: string) => {
    const newCertificates = [...certificates]
    newCertificates[index] = { ...newCertificates[index], title }
    onCertificatesChange(newCertificates)
    
    // Limpar erro de título se preenchido
    if (title.trim()) {
      setErrors(prev => ({ ...prev, [`certificate_${index}_title`]: "" }))
    }
  }, [certificates, onCertificatesChange])

  const updateCertificateFile = useCallback((index: number, file: File) => {
    const error = validateFile(file)
    if (error) {
      setErrors(prev => ({ ...prev, [`certificate_${index}_file`]: error }))
      return
    }
    
    const newCertificates = [...certificates]
    newCertificates[index] = { ...newCertificates[index], file }
    onCertificatesChange(newCertificates)
    
    setErrors(prev => ({ ...prev, [`certificate_${index}_file`]: "" }))
  }, [certificates, onCertificatesChange, validateFile])

  const handleCertificateFileDrop = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOver(null)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      updateCertificateFile(index, files[0])
    }
  }, [updateCertificateFile])

  const handleCertificateFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const files = e.target.files
    if (files && files.length > 0) {
      updateCertificateFile(index, files[0])
    }
  }, [updateCertificateFile])

  // Validação geral
  const isValid = useCallback(() => {
    // CRN obrigatório
    if (isRequired && (!crnNumber.trim() || !crnProofFile)) {
      return false
    }
    
    // Verificar erros
    const hasErrors = Object.values(errors).some(error => error.trim() !== "")
    if (hasErrors) {
      return false
    }
    
    // Validar certificados (se tiver título, deve ter arquivo e vice-versa)
    for (const cert of certificates) {
      if (cert.title.trim() && !cert.file) {
        return false
      }
      if (!cert.title.trim() && cert.file) {
        return false
      }
    }
    
    return true
  }, [isRequired, crnNumber, crnProofFile, errors, certificates])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Seção CRN */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            CRN - Conselho Regional de Nutricionistas
            {isRequired && <Badge variant="destructive">Obrigatório</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Número do CRN */}
          <div className="space-y-2">
            <Label htmlFor="crn-number">
              Número do CRN *
            </Label>
            <Input
              id="crn-number"
              type="text"
              placeholder="Ex: 12345"
              value={crnNumber}
              onChange={(e) => onCrnNumberChange(e.target.value)}
              disabled={disabled}
              className={errors.crnNumber ? "border-red-500" : ""}
            />
            {errors.crnNumber && (
              <p className="text-sm text-red-500">{errors.crnNumber}</p>
            )}
          </div>

          {/* Upload do Comprovante */}
          <div className="space-y-2">
            <Label>Comprovante do CRN *</Label>
            <div
              className={`
                border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                ${dragOver === "crn" ? "border-blue-500 bg-blue-50" : "border-gray-300"}
                ${errors.crnProof ? "border-red-500" : ""}
                ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-gray-400"}
              `}
              onDragOver={(e) => {
                e.preventDefault()
                if (!disabled) setDragOver("crn")
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => !disabled && handleCrnFileDrop(e)}
              onClick={() => !disabled && crnFileInputRef.current?.click()}
            >
              <input
                ref={crnFileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleCrnFileInputChange}
                className="hidden"
                disabled={disabled}
              />
              
              {crnProofFile || crnProofUrl ? (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">
                    {crnProofFile?.name || "Comprovante enviado"}
                  </span>
                  {crnProofFile && (
                    <span className="text-xs text-gray-500">
                      ({formatFileSize(crnProofFile.size)})
                    </span>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Clique ou arraste o arquivo aqui</p>
                    <p className="text-xs text-gray-500">PDF, JPG, PNG - Máx: 5MB</p>
                  </div>
                </div>
              )}
            </div>
            {errors.crnProof && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.crnProof}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Seção Certificados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Certificados
              <Badge variant="secondary">Opcional</Badge>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCertificate}
              disabled={disabled}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {certificates.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Nenhum certificado adicionado. Clique em "Adicionar" para incluir certificados.
            </p>
          ) : (
            certificates.map((certificate, index) => (
              <Card key={index} className="border border-gray-200">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Certificado {index + 1}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCertificate(index)}
                      disabled={disabled}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Título do certificado */}
                  <div className="space-y-2">
                    <Label htmlFor={`cert-title-${index}`}>Título</Label>
                    <Input
                      id={`cert-title-${index}`}
                      type="text"
                      placeholder="Ex: Especialização em Nutrição Esportiva"
                      value={certificate.title}
                      onChange={(e) => updateCertificateTitle(index, e.target.value)}
                      disabled={disabled}
                      className={errors[`certificate_${index}_title`] ? "border-red-500" : ""}
                    />
                    {errors[`certificate_${index}_title`] && (
                      <p className="text-sm text-red-500">{errors[`certificate_${index}_title`]}</p>
                    )}
                  </div>

                  {/* Upload do arquivo */}
                  <div className="space-y-2">
                    <Label>Arquivo</Label>
                    <div
                      className={`
                        border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                        ${dragOver === `cert-${index}` ? "border-blue-500 bg-blue-50" : "border-gray-300"}
                        ${errors[`certificate_${index}_file`] ? "border-red-500" : ""}
                        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-gray-400"}
                      `}
                      onDragOver={(e) => {
                        e.preventDefault()
                        if (!disabled) setDragOver(`cert-${index}`)
                      }}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={(e) => !disabled && handleCertificateFileDrop(e, index)}
                      onClick={() => !disabled && certificateFileInputRefs.current[index]?.click()}
                    >
                      <input
                        ref={(el) => certificateFileInputRefs.current[index] = el}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleCertificateFileInputChange(e, index)}
                        className="hidden"
                        disabled={disabled}
                      />
                      
                      {certificate.file || certificate.fileUrl ? (
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">
                            {certificate.file?.name || certificate.fileName || "Arquivo enviado"}
                          </span>
                          {certificate.file && (
                            <span className="text-xs text-gray-500">
                              ({formatFileSize(certificate.file.size)})
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Upload className="h-6 w-6 mx-auto text-gray-400" />
                          <div>
                            <p className="text-sm">Clique ou arraste o arquivo</p>
                            <p className="text-xs text-gray-500">PDF, JPG, PNG - Máx: 5MB</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {errors[`certificate_${index}_file`] && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{errors[`certificate_${index}_file`]}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Informações importantes */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> O número do CRN e o comprovante são obrigatórios para concluir o cadastro. 
          Os certificados são opcionais e podem ser adicionados ou removidos posteriormente no seu painel.
        </AlertDescription>
      </Alert>
    </div>
  )
}