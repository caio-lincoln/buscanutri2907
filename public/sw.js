const CACHE_NAME = 'buscanutri-cache-v1'
const BUILD_ID_KEY = 'buscanutri-build-id'

// Recursos para cache
const STATIC_RESOURCES = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/placeholder.svg',
  '/ícone.svg'
]

// Recursos dinâmicos que devem ser sempre atualizados
const DYNAMIC_RESOURCES = [
  '/api/',
  '/dashboard/',
  '/login',
  '/cadastro'
]

self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching static resources')
        return cache.addAll(STATIC_RESOURCES)
      })
      .then(() => {
        console.log('✅ Service Worker installed successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('❌ Service Worker installation failed:', error)
      })
  )
})

self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...')
  
  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      // Verificar se há nova versão do build
      checkBuildVersion(),
      // Tomar controle de todas as abas
      self.clients.claim()
    ])
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorar requests que não são do mesmo origin
  if (url.origin !== location.origin) {
    return
  }

  // Estratégia para recursos dinâmicos (sempre buscar na rede)
  if (DYNAMIC_RESOURCES.some(resource => url.pathname.startsWith(resource))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Verificar se há novo build ID no header
          const buildId = response.headers.get('X-Build-ID')
          if (buildId) {
            checkAndUpdateBuildId(buildId)
          }
          return response
        })
        .catch((error) => {
          console.error('❌ Network request failed:', error)
          return new Response('Offline', { status: 503 })
        })
    )
    return
  }

  // Estratégia para recursos estáticos (cache first)
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Verificar se o cache ainda é válido
          return isValidCache(cachedResponse).then((isValid) => {
            if (isValid) {
              return cachedResponse
            } else {
              // Cache inválido, buscar nova versão
              return fetchAndCache(request)
            }
          })
        }
        
        // Não está em cache, buscar e cachear
        return fetchAndCache(request)
      })
      .catch((error) => {
        console.error('❌ Cache match failed:', error)
        return fetch(request)
      })
  )
})

// Verificar versão do build
async function checkBuildVersion() {
  try {
    const response = await fetch('/api/admin/cache-flush?secret=check-build')
    if (response.ok) {
      const data = await response.json()
      const newBuildId = data.buildId
      
      const storedBuildId = await getStoredBuildId()
      
      if (storedBuildId && storedBuildId !== newBuildId) {
        console.log('🔄 New build detected, clearing cache...')
        await clearAllCaches()
        await storeBuildId(newBuildId)
        
        // Notificar todas as abas sobre a atualização
        const clients = await self.clients.matchAll()
        clients.forEach(client => {
          client.postMessage({
            type: 'BUILD_UPDATED',
            buildId: newBuildId,
            previousBuildId: storedBuildId
          })
        })
      } else if (!storedBuildId) {
        await storeBuildId(newBuildId)
      }
    }
  } catch (error) {
    console.error('❌ Failed to check build version:', error)
  }
}

// Verificar e atualizar build ID
async function checkAndUpdateBuildId(buildId) {
  const storedBuildId = await getStoredBuildId()
  
  if (storedBuildId !== buildId) {
    console.log('🔄 Build ID updated:', buildId)
    await storeBuildId(buildId)
    
    if (storedBuildId) {
      // Limpar cache se houve mudança de build
      await clearAllCaches()
      
      // Notificar sobre atualização
      const clients = await self.clients.matchAll()
      clients.forEach(client => {
        client.postMessage({
          type: 'BUILD_UPDATED',
          buildId: buildId,
          previousBuildId: storedBuildId
        })
      })
    }
  }
}

// Buscar e cachear recurso
async function fetchAndCache(request) {
  try {
    const response = await fetch(request)
    
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    console.error('❌ Fetch and cache failed:', error)
    throw error
  }
}

// Verificar se o cache ainda é válido
async function isValidCache(response) {
  const cacheDate = response.headers.get('date')
  const buildId = response.headers.get('X-Build-ID')
  const storedBuildId = await getStoredBuildId()
  
  // Se o build ID mudou, cache é inválido
  if (buildId && storedBuildId && buildId !== storedBuildId) {
    return false
  }
  
  // Verificar idade do cache (máximo 1 hora para recursos dinâmicos)
  if (cacheDate) {
    const cacheTime = new Date(cacheDate).getTime()
    const now = Date.now()
    const maxAge = 60 * 60 * 1000 // 1 hora
    
    return (now - cacheTime) < maxAge
  }
  
  return true
}

// Limpar todos os caches
async function clearAllCaches() {
  const cacheNames = await caches.keys()
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  )
  console.log('🗑️ All caches cleared')
}

// Armazenar build ID
async function storeBuildId(buildId) {
  const cache = await caches.open(CACHE_NAME)
  const response = new Response(buildId)
  await cache.put(BUILD_ID_KEY, response)
}

// Obter build ID armazenado
async function getStoredBuildId() {
  try {
    const cache = await caches.open(CACHE_NAME)
    const response = await cache.match(BUILD_ID_KEY)
    return response ? await response.text() : null
  } catch (error) {
    console.error('❌ Failed to get stored build ID:', error)
    return null
  }
}

// Listener para mensagens do cliente
self.addEventListener('message', (event) => {
  const { type, data } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true })
      })
      break
      
    case 'CHECK_UPDATE':
      checkBuildVersion().then(() => {
        event.ports[0].postMessage({ success: true })
      })
      break
      
    default:
      console.log('📨 Unknown message type:', type)
  }
})