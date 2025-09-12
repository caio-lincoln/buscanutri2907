export type BRState = { ibge_id: number; uf: string; name: string; region: string | null }
export type BRCity = { ibge_id: number; name: string }

let cachedStates: BRState[] | null = null
console.log("🚀 ~ cachedStates:", cachedStates)
const cityCache = new Map<string, BRCity[]>()

export async function getStates(): Promise<BRState[]> {
  if (cachedStates && cachedStates.length > 0) return cachedStates
  const r = await fetch('/api/geo/states', { cache: 'force-cache' })
  const j = await r.json()
  cachedStates = j.states as BRState[]
  return cachedStates
}

export async function getCitiesByUF(uf: string): Promise<BRCity[]> {
  const key = uf.toUpperCase()
  if (cityCache.has(key)) return cityCache.get(key)!
  const r = await fetch(`/api/geo/cities/${key}`, { cache: 'force-cache' })
  const j = await r.json()
  const list = (j.cities || []) as BRCity[]
  cityCache.set(key, list)
  return list
}
