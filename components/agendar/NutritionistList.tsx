'use client'

import { useState, useMemo } from 'react'
import { useNutritionists } from '@/hooks/useNutritionists'
import { NutritionistCard } from './NutritionistCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { SearchX, UserX, Search, FilterX, MapPin, Award } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function NutritionistList() {
  const { nutritionists, loading, error, refetch } = useNutritionists()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('all')
  const [selectedLocation, setSelectedLocation] = useState('all')

  // Helper to normalize location strings
  const normalizeLocation = (loc: string | undefined | null): string | null => {
    if (!loc) return null
    let cleaned = loc.trim()
    
    // "City/State" -> "City - State"
    const slashMatch = cleaned.match(/^([^/]+)\s*\/\s*([A-Z]{2})$/i)
    if (slashMatch) return `${slashMatch[1].trim()} - ${slashMatch[2].toUpperCase()}`

    // "City, State" -> "City - State"
    const commaMatch = cleaned.match(/^([^,]+)\s*,\s*([A-Z]{2})$/i)
    if (commaMatch) return `${commaMatch[1].trim()} - ${commaMatch[2].toUpperCase()}`
    
    // "City - State" -> "City - State" (standardize spacing)
    const dashMatch = cleaned.match(/^([^-]+)\s*-\s*([A-Z]{2})$/i)
    if (dashMatch) return `${dashMatch[1].trim()} - ${dashMatch[2].toUpperCase()}`

    return cleaned
  }

  // Extract unique specialties
  const uniqueSpecialties = useMemo(() => {
    const specialties = new Set<string>()
    nutritionists.forEach(n => {
      if (Array.isArray(n.specialties)) {
        n.specialties.forEach(s => s && specialties.add(s))
      } else if (typeof n.specialties === 'string') {
        n.specialties.split(',').map(s => s.trim()).forEach(s => s && specialties.add(s))
      }
    })
    return Array.from(specialties).sort()
  }, [nutritionists])

  // Extract unique locations
  const uniqueLocations = useMemo(() => {
    const locations = new Set<string>()
    nutritionists.forEach(n => {
      // Try location first
      const loc = normalizeLocation(n.location)
      if (loc) {
        locations.add(loc)
      } else if (n.address) {
        // Fallback to address if short enough or looks like city/state
        const addr = normalizeLocation(n.address)
        if (addr && addr.length < 50) { // Avoid adding full long addresses
          locations.add(addr)
        }
      }
    })
    return Array.from(locations).sort()
  }, [nutritionists])

  // Filter nutritionists
  const filteredNutritionists = useMemo(() => {
    return nutritionists.filter(n => {
      // Name filter
      const matchesName = n.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Specialty filter
      let matchesSpecialty = true
      if (selectedSpecialty !== 'all') {
        if (Array.isArray(n.specialties)) {
          matchesSpecialty = n.specialties.includes(selectedSpecialty)
        } else if (typeof n.specialties === 'string') {
          matchesSpecialty = n.specialties.includes(selectedSpecialty)
        } else {
          matchesSpecialty = false
        }
      }

      // Location filter
      let matchesLocation = true
      if (selectedLocation !== 'all') {
        const nLoc = normalizeLocation(n.location)
        const nAddr = normalizeLocation(n.address)
        
        // Match against normalized location or address
        // Also check if address contains the selected location (e.g. "Aracaju - SE")
        const locMatch = nLoc === selectedLocation
        const addrMatch = nAddr === selectedLocation || (n.address && n.address.includes(selectedLocation.split(' - ')[0])) // naive check for city name in address

        matchesLocation = !!(locMatch || addrMatch)
      }

      return matchesName && matchesSpecialty && matchesLocation
    })
  }, [nutritionists, searchTerm, selectedSpecialty, selectedLocation])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedSpecialty('all')
    setSelectedLocation('all')
  }

  const hasActiveFilters = searchTerm || selectedSpecialty !== 'all' || selectedLocation !== 'all'

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Filter Skeleton */}
        <div className="bg-card p-4 rounded-xl border shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-[200px] w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button variant="outline" className="mt-2" onClick={refetch}>
          Tentar novamente
        </Button>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-card p-4 rounded-xl border shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <Search className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">Filtros de Busca</h2>
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-auto text-xs font-normal">
              Filtros ativos
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Name */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Nome do profissional</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Specialty Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Especialidade</label>
            <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Todas as especialidades" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as especialidades</SelectItem>
                {uniqueSpecialties.map((spec) => (
                  <SelectItem key={spec} value={spec}>
                    {spec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Localização</label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Todas as localizações" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as localizações</SelectItem>
                {uniqueLocations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
            >
              <FilterX className="mr-2 h-4 w-4" />
              Limpar Filtros
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      {filteredNutritionists.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
          <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">Nenhum nutricionista encontrado</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mt-2">
            Tente ajustar seus termos de busca ou remover os filtros para ver mais resultados.
          </p>
          <Button 
            variant="link" 
            onClick={clearFilters}
            className="mt-4 text-primary"
          >
            Limpar todos os filtros
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredNutritionists.map((nutritionist) => (
            <NutritionistCard key={nutritionist.id} nutritionist={nutritionist} />
          ))}
        </div>
      )}
    </div>
  )
}
