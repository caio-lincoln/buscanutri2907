import { revalidateTag, revalidatePath } from 'next/cache'

export const CACHE_TAGS = {
  NUTRITIONISTS: 'nutritionists',
  SPECIALTIES: 'specialties',
  APPOINTMENTS: 'appointments',
  PROFILES: 'profiles',
  DASHBOARD: 'dashboard',
  BLOG: 'blog',
  FORUM: 'forum',
  COMPANIES: 'companies',
  PATIENTS: 'patients',
  RATINGS: 'ratings',
  NOTIFICATIONS: 'notifications',
} as const

export const CACHE_PATHS = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  NUTRITIONISTS: '/nutricionistas',
  BLOG: '/blog',
  FORUM: '/forum',
  COMPANIES: '/para-empresas',
  PATIENTS: '/para-pacientes',
} as const

export class CacheManager {
  private static buildId = process.env.BUILD_ID || 'development'

  /**
   * Revalida cache por tag específica
   */
  static revalidateByTag(tag: string) {
    try {
      revalidateTag(tag)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Revalida cache por path específico
   */
  static revalidateByPath(path: string) {
    try {
      revalidatePath(path)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Revalida múltiplas tags
   */
  static revalidateMultipleTags(tags: string[]) {
    const results = tags.map(tag => ({
      tag,
      success: this.revalidateByTag(tag),
    }))

    return results
  }

  /**
   * Revalida múltiplos paths
   */
  static revalidateMultiplePaths(paths: string[]) {
    const results = paths.map(path => ({
      path,
      success: this.revalidateByPath(path),
    }))

    return results
  }

  /**
   * Revalida cache relacionado a nutricionistas
   */
  static revalidateNutritionistData() {
    return this.revalidateMultipleTags([
      CACHE_TAGS.NUTRITIONISTS,
      CACHE_TAGS.SPECIALTIES,
      CACHE_TAGS.PROFILES,
      CACHE_TAGS.RATINGS,
    ])
  }

  /**
   * Revalida cache relacionado ao dashboard
   */
  static revalidateDashboardData() {
    return this.revalidateMultipleTags([
      CACHE_TAGS.DASHBOARD,
      CACHE_TAGS.APPOINTMENTS,
      CACHE_TAGS.PROFILES,
      CACHE_TAGS.NOTIFICATIONS,
    ])
  }

  /**
   * Revalida cache relacionado a empresas
   */
  static revalidateCompanyData() {
    return this.revalidateMultipleTags([
      CACHE_TAGS.COMPANIES,
      CACHE_TAGS.PROFILES,
      CACHE_TAGS.DASHBOARD,
    ])
  }

  /**
   * Flush completo de cache
   */
  static flushAll() {
    const allTags = Object.values(CACHE_TAGS)
    const allPaths = Object.values(CACHE_PATHS)

    const tagResults = this.revalidateMultipleTags(allTags)
    const pathResults = this.revalidateMultiplePaths(allPaths)

    return {
      tags: tagResults,
      paths: pathResults,
      buildId: this.buildId,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Gera chave de cache com build ID
   */
  static generateCacheKey(key: string): string {
    return `${key}-${this.buildId}`
  }

  /**
   * Verifica se o cache deve ser invalidado baseado no build ID
   */
  static shouldInvalidateCache(storedBuildId?: string): boolean {
    return !storedBuildId || storedBuildId !== this.buildId
  }
}

/**
 * Hook para invalidar cache local no browser
 */
export function invalidateBrowserCache() {
  if (typeof window !== 'undefined') {
    // Limpar localStorage relacionado ao cache
    const cacheKeys = Object.keys(localStorage).filter(
      key =>
        key.startsWith('cache-') ||
        key.startsWith('build-') ||
        key.includes('cached')
    )

    cacheKeys.forEach(key => {
      localStorage.removeItem(key)
    })

    // Limpar sessionStorage relacionado ao cache
    const sessionCacheKeys = Object.keys(sessionStorage).filter(
      key =>
        key.startsWith('cache-') ||
        key.startsWith('build-') ||
        key.includes('cached')
    )

    sessionCacheKeys.forEach(key => {
      sessionStorage.removeItem(key)
    })
  }
}

/**
 * Utilitário para fetch com cache inteligente
 */
export async function fetchWithCache<T>(
  url: string,
  options: RequestInit & {
    cacheKey?: string
    cacheTags?: string[]
    revalidate?: number
  } = {}
): Promise<T> {
  const { cacheKey, cacheTags, revalidate, ...fetchOptions } = options

  const headers = {
    ...fetchOptions.headers,
    'X-Build-ID': CacheManager.buildId,
  }

  if (cacheTags) {
    headers['X-Cache-Tags'] = cacheTags.join(',')
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    next: {
      tags: cacheTags,
      revalidate: revalidate || 60,
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}
