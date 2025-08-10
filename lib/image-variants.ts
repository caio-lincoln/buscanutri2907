/**
 * Utilitário para gerar URLs de imagem otimizadas com variantes
 * Suporta diferentes tamanhos e formatos para cover e avatar
 */

export interface ImageVariants {
  cover: {
    lg: string // 2000w
    md: string // 1400w
    sm: string // 800w
  }
  avatar: {
    large: string // 512px
    medium: string // 256px
    small: string // 96px
  }
}

export interface ImageVariantConfig {
  cover: {
    lg: { width: 2000; height: 625 } // 16:5 ratio
    md: { width: 1400; height: 437 } // 16:5 ratio
    sm: { width: 800; height: 250 } // 16:5 ratio
  }
  avatar: {
    large: { width: 512; height: 512 } // 1:1 ratio
    medium: { width: 256; height: 256 } // 1:1 ratio
    small: { width: 96; height: 96 } // 1:1 ratio
  }
}

/**
 * Gera URLs de variantes de imagem baseadas na URL original
 * @param originalUrl URL original da imagem
 * @param type Tipo da imagem (cover ou avatar)
 * @param updatedAt Timestamp para cache busting
 * @returns Objeto com URLs das variantes
 */
export function generateImageVariants(
  originalUrl: string | null | undefined,
  type: 'cover' | 'avatar',
  updatedAt?: string | null
): ImageVariants[typeof type] {
  if (!originalUrl) {
    // Retorna placeholders se não houver URL
    if (type === 'cover') {
      return {
        lg: '/placeholder.svg?height=625&width=2000&text=Capa',
        md: '/placeholder.svg?height=437&width=1400&text=Capa',
        sm: '/placeholder.svg?height=250&width=800&text=Capa',
      }
    } else {
      return {
        large: '/placeholder.svg?height=512&width=512&text=Avatar',
        medium: '/placeholder.svg?height=256&width=256&text=Avatar',
        small: '/placeholder.svg?height=96&width=96&text=Avatar',
      }
    }
  }

  // Adiciona versionamento para cache busting
  // Use a consistent hash instead of timestamp to avoid hydration mismatch
  const versionParam = updatedAt ? `?v=${updatedAt.replace(/[^0-9]/g, '').slice(-8)}` : ''

  // Se a URL já contém parâmetros de transformação (ex: Supabase Transform)
  const hasTransformParams = originalUrl.includes('transform=')
  const baseUrl = hasTransformParams ? originalUrl.split('?')[0] : originalUrl

  if (type === 'cover') {
    return {
      lg: `${baseUrl}?width=2000&height=625&resize=cover&quality=85${versionParam ? '&' + versionParam.slice(1) : ''}`,
      md: `${baseUrl}?width=1400&height=437&resize=cover&quality=85${versionParam ? '&' + versionParam.slice(1) : ''}`,
      sm: `${baseUrl}?width=800&height=250&resize=cover&quality=85${versionParam ? '&' + versionParam.slice(1) : ''}`,
    }
  } else {
    return {
      large: `${baseUrl}?width=512&height=512&resize=cover&quality=90${versionParam ? '&' + versionParam.slice(1) : ''}`,
      medium: `${baseUrl}?width=256&height=256&resize=cover&quality=90${versionParam ? '&' + versionParam.slice(1) : ''}`,
      small: `${baseUrl}?width=96&height=96&resize=cover&quality=90${versionParam ? '&' + versionParam.slice(1) : ''}`,
    }
  }
}

/**
 * Seleciona a melhor variante de avatar baseada na densidade de pixel e tamanho desejado
 * @param variants Variantes disponíveis do avatar
 * @param targetSize Tamanho alvo em pixels
 * @returns URL da melhor variante
 */
export function selectBestAvatarVariant(
  variants: ImageVariants['avatar'],
  targetSize: number = 256
): string {
  const pixelRatio =
    typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  const effectiveSize = targetSize * pixelRatio

  if (effectiveSize <= 96) {
    return variants.small
  } else if (effectiveSize <= 256) {
    return variants.medium
  } else {
    return variants.large
  }
}

/**
 * Seleciona a melhor variante de capa baseada na largura da viewport
 * @param variants Variantes disponíveis da capa
 * @param viewportWidth Largura da viewport (opcional, usa window.innerWidth se disponível)
 * @returns URL da melhor variante
 */
export function selectBestCoverVariant(
  variants: ImageVariants['cover'],
  viewportWidth?: number
): string {
  const width =
    viewportWidth || (typeof window !== 'undefined' ? window.innerWidth : 1200)

  if (width <= 768) {
    return variants.sm
  } else if (width <= 1200) {
    return variants.md
  } else {
    return variants.lg
  }
}

/**
 * Gera srcSet para imagens responsivas
 * @param variants Variantes da imagem
 * @param type Tipo da imagem
 * @returns String srcSet para uso em elementos img
 */
export function generateSrcSet(
  variants: ImageVariants['cover'] | ImageVariants['avatar'],
  type: 'cover' | 'avatar'
): string {
  if (type === 'cover') {
    const coverVariants = variants as ImageVariants['cover']
    return `${coverVariants.sm} 800w, ${coverVariants.md} 1400w, ${coverVariants.lg} 2000w`
  } else {
    const avatarVariants = variants as ImageVariants['avatar']
    return `${avatarVariants.small} 96w, ${avatarVariants.medium} 256w, ${avatarVariants.large} 512w`
  }
}

/**
 * Gera sizes attribute para imagens responsivas
 * @param type Tipo da imagem
 * @returns String sizes para uso em elementos img
 */
export function generateSizes(type: 'cover' | 'avatar'): string {
  if (type === 'cover') {
    return '(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw'
  } else {
    return '(max-width: 768px) 128px, 160px'
  }
}
