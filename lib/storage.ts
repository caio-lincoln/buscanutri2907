import { createSupabaseClient } from './supabase'

const supabase = createSupabaseClient()

/**
 * Helper para obter URL pública de um arquivo no storage
 */
export function publicUrlFromStoragePath(path: string, bucket: string = 'nutritionist_documents'): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data?.publicUrl ?? ''
}

/**
 * Verifica se um arquivo é uma imagem baseado na extensão
 */
export function isImageFile(fileName: string): boolean {
  const imageExtensions = [ '.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg' ]
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
  return imageExtensions.includes(extension)
}

/**
 * Mapeia tipos de documento para labels amigáveis
 */
export function getDocumentTypeLabel(documentType: string): string {
  const labels: Record<string, string> = {
    'crm_proof': 'Comprovante CRM',
    'diploma': 'Diploma',
    'identity': 'Documento de Identidade',
    'address_proof': 'Comprovante de Endereço',
    'professional_photo': 'Foto Profissional',
    'curriculum': 'Currículo',
    'other': 'Outros Documentos'
  }

  return labels[ documentType ] || documentType
}
