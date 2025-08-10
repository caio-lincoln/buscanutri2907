'use client'

import { useState, useCallback, useEffect } from 'react'
import Image, { ImageProps } from 'next/image'
import { User, ImageIcon, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageFallbackProps extends Omit<ImageProps, 'src' | 'alt'> {
  src: string | null | undefined
  alt: string
  fallbackSrc?: string
  fallbackType?: 'user' | 'image' | 'error' | 'custom'
  fallbackComponent?: React.ReactNode
  retryAttempts?: number
  retryDelay?: number
  onError?: (error: string) => void
  onRetry?: (attempt: number) => void
  onFallback?: () => void
  className?: string
  fallbackClassName?: string
  showErrorMessage?: boolean
  cacheKey?: string
}

const DEFAULT_FALLBACKS = {
  user: '/images/default-avatar.svg',
  image: '/images/default-image.svg',
  error: '/images/error-image.svg',
}

// Cache para URLs que falharam
const failedUrls = new Set<string>()
const retryCount = new Map<string, number>()

export function ImageFallback({
  src,
  alt,
  fallbackSrc,
  fallbackType = 'image',
  fallbackComponent,
  retryAttempts = 2,
  retryDelay = 1000,
  onError,
  onRetry,
  onFallback,
  className,
  fallbackClassName,
  showErrorMessage = false,
  cacheKey,
  ...props
}: ImageFallbackProps) {
  const [currentSrc, setCurrentSrc] = useState<string | null>(src || null)
  const [hasError, setHasError] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const [attempts, setAttempts] = useState(0)

  const cacheKeyToUse = cacheKey || src || 'unknown'

  // Verificar se a URL já falhou antes
  useEffect(() => {
    if (src && failedUrls.has(src)) {
      setHasError(true)
      setCurrentSrc(null)
    } else if (src) {
      setCurrentSrc(src)
      setHasError(false)
      setAttempts(0)
    }
  }, [src])

  // Função para tentar novamente
  const retryLoad = useCallback(
    async (url: string, attempt: number) => {
      if (attempt >= retryAttempts) {
        failedUrls.add(url)
        retryCount.set(cacheKeyToUse, attempt)
        setIsRetrying(false)
        setHasError(true)
        setCurrentSrc(null)
        onFallback?.()
        return
      }

      setIsRetrying(true)
      onRetry?.(attempt + 1)

      // Aguardar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, retryDelay))

      // Tentar carregar a imagem
      const img = new window.Image()

      img.onload = () => {
        setCurrentSrc(url)
        setHasError(false)
        setIsRetrying(false)
        setAttempts(attempt + 1)
        // Remover da lista de falhas se carregar com sucesso
        failedUrls.delete(url)
        retryCount.delete(cacheKeyToUse)
      }

      img.onerror = () => {
        setAttempts(attempt + 1)
        retryLoad(url, attempt + 1)
      }

      // Adicionar cache busting para retry
      const cacheBustUrl = `${url}${url.includes('?') ? '&' : '?'}retry=${attempt}&t=${Date.now()}`
      img.src = cacheBustUrl
    },
    [retryAttempts, retryDelay, onRetry, onFallback, cacheKeyToUse]
  )

  // Handler para erro de carregamento
  const handleError = useCallback(() => {
    const errorMessage = `Failed to load image: ${currentSrc}`
    // Silent error handling: Failed to load image
    onError?.(errorMessage)

    if (currentSrc && attempts < retryAttempts) {
      retryLoad(currentSrc, attempts)
    } else {
      setHasError(true)
      setCurrentSrc(null)
      if (currentSrc) {
        failedUrls.add(currentSrc)
      }
      onFallback?.()
    }
  }, [currentSrc, attempts, retryAttempts, retryLoad, onError, onFallback])

  // Função para limpar cache de falhas
  const clearFailureCache = useCallback(() => {
    failedUrls.clear()
    retryCount.clear()
    if (src) {
      setCurrentSrc(src)
      setHasError(false)
      setAttempts(0)
    }
  }, [src])

  // Expor função de limpeza globalmente
  useEffect(() => {
    // @ts-ignore
    window.clearImageFailureCache = clearFailureCache
  }, [clearFailureCache])

  // Determinar o fallback a ser usado
  const getFallbackSrc = useCallback(() => {
    if (fallbackSrc) return fallbackSrc
    return DEFAULT_FALLBACKS[fallbackType] || DEFAULT_FALLBACKS.image
  }, [fallbackSrc, fallbackType])

  // Renderizar componente de fallback customizado
  if (hasError && fallbackComponent) {
    return (
      <div
        className={cn('flex items-center justify-center', fallbackClassName)}
      >
        {fallbackComponent}
      </div>
    )
  }

  // Renderizar ícone de fallback
  if (hasError && !fallbackSrc && !DEFAULT_FALLBACKS[fallbackType]) {
    const IconComponent =
      fallbackType === 'user'
        ? User
        : fallbackType === 'error'
          ? AlertCircle
          : ImageIcon

    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center bg-gray-100 text-gray-400 rounded',
          fallbackClassName,
          className
        )}
      >
        <IconComponent className="w-8 h-8 mb-2" />
        {showErrorMessage && (
          <span className="text-xs text-center px-2">
            Imagem não disponível
          </span>
        )}
        {isRetrying && (
          <span className="text-xs text-blue-500 mt-1">
            Tentando novamente...
          </span>
        )}
      </div>
    )
  }

  // Renderizar imagem ou fallback
  const imageSrc = currentSrc || getFallbackSrc()

  if (!imageSrc) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-100 text-gray-400 rounded',
          fallbackClassName,
          className
        )}
      >
        <ImageIcon className="w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="relative">
      <Image
        {...props}
        src={imageSrc}
        alt={alt}
        className={cn(className, isRetrying && 'opacity-50')}
        onError={handleError}
        // Adicionar cache busting se estiver retrying
        key={isRetrying ? `${imageSrc}-${Date.now()}` : imageSrc}
      />

      {isRetrying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded">
          <div className="bg-white px-2 py-1 rounded text-xs text-gray-600">
            Carregando... ({attempts + 1}/{retryAttempts + 1})
          </div>
        </div>
      )}
    </div>
  )
}

// Hook para gerenciar cache de imagens
export function useImageCache() {
  const clearCache = useCallback(() => {
    failedUrls.clear()
    retryCount.clear()
    // @ts-ignore
    if (typeof window !== 'undefined' && window.clearImageFailureCache) {
      // @ts-ignore
      window.clearImageFailureCache()
    }
  }, [])

  const getFailedUrls = useCallback(() => {
    return Array.from(failedUrls)
  }, [])

  const getRetryCount = useCallback((url: string) => {
    return retryCount.get(url) || 0
  }, [])

  const preloadImage = useCallback((url: string): Promise<boolean> => {
    return new Promise(resolve => {
      const img = new window.Image()
      img.onload = () => resolve(true)
      img.onerror = () => {
        failedUrls.add(url)
        resolve(false)
      }
      img.src = url
    })
  }, [])

  return {
    clearCache,
    getFailedUrls,
    getRetryCount,
    preloadImage,
    failedCount: failedUrls.size,
  }
}

// Componente específico para avatar de usuário
export function UserAvatar({
  src,
  name,
  size = 40,
  className,
  ...props
}: {
  src?: string | null
  name: string
  size?: number
  className?: string
} & Omit<ImageFallbackProps, 'src' | 'alt' | 'fallbackType'>) {
  return (
    <ImageFallback
      src={src}
      alt={`Avatar de ${name}`}
      fallbackType="user"
      width={size}
      height={size}
      className={cn('rounded-full object-cover', className)}
      fallbackClassName="rounded-full"
      {...props}
    />
  )
}

// Componente específico para imagens de conteúdo
export function ContentImage({
  src,
  alt,
  className,
  ...props
}: {
  src?: string | null
  alt: string
  className?: string
} & Omit<ImageFallbackProps, 'fallbackType'>) {
  return (
    <ImageFallback
      src={src}
      alt={alt}
      fallbackType="image"
      className={cn('object-cover', className)}
      showErrorMessage={true}
      {...props}
    />
  )
}
