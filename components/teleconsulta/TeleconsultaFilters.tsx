'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, Filter, X, Search } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export interface TeleconsultaFilters {
  search?: string
  status?: 'all' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  dateFrom?: Date
  dateTo?: Date
  nutritionist?: string
  patient?: string
  priceMin?: number
  priceMax?: number
}

export interface TeleconsultaFiltersProps {
  filters: TeleconsultaFilters
  onFiltersChange: (filters: TeleconsultaFilters) => void
  userRole: 'nutritionist' | 'patient' | 'admin'
  nutritionists?: Array<{ id: string; name: string }>
  patients?: Array<{ id: string; name: string }>
  className?: string
  isExpanded: boolean
  setIsExpanded: (expanded: boolean) => void;
}

const statusOptions = [
  { value: 'all', label: 'Todos os status' },
  { value: 'scheduled', label: 'Agendadas' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'completed', label: 'Concluídas' },
  { value: 'cancelled', label: 'Canceladas' }
]

export function TeleconsultaFilters({
  filters,
  onFiltersChange,
  userRole,
  nutritionists = [],
  patients = [],
  className,
  isExpanded,
  setIsExpanded
}: TeleconsultaFiltersProps) {
  
  const [dateFromOpen, setDateFromOpen] = useState(false)
  const [dateToOpen, setDateToOpen] = useState(false)
 
  const updateFilter = (key: keyof TeleconsultaFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: 'all',
      dateFrom: undefined,
      dateTo: undefined,
      nutritionist: undefined,
      patient: undefined,
      priceMin: undefined,
      priceMax: undefined
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.status && filters.status !== 'all') count++
    if (filters.dateFrom) count++
    if (filters.dateTo) count++
    if (filters.nutritionist) count++
    if (filters.patient) count++
    if (filters.priceMin) count++
    if (filters.priceMax) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Menos' : 'Mais'} filtros
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtros básicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => updateFilter('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data de início */}
          <div className="space-y-2">
            <Label>Data de início</Label>
            <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateFrom ? (
                    format(filters.dateFrom, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  ) : (
                    "Selecionar data"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateFrom}
                  onSelect={(date) => {
                    updateFilter('dateFrom', date)
                    setDateFromOpen(false)
                  }}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Filtros expandidos */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Data final */}
              <div className="space-y-2">
                <Label>Data final</Label>
                <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateTo ? (
                        format(filters.dateTo, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                      ) : (
                        "Selecionar data"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateTo}
                      onSelect={(date) => {
                        updateFilter('dateTo', date)
                        setDateToOpen(false)
                      }}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Filtro por nutricionista (apenas para admin) */}
              {userRole === 'admin' && nutritionists.length > 0 && (
                <div className="space-y-2">
                  <Label>Nutricionista</Label>
                  <Select
                    value={filters.nutritionist || ''}
                    onValueChange={(value) => updateFilter('nutritionist', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os nutricionistas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os nutricionistas</SelectItem>
                      {nutritionists.map((nutritionist) => (
                        <SelectItem key={nutritionist.id} value={nutritionist.id}>
                          {nutritionist.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Filtro por paciente (apenas para admin) */}
              {userRole === 'admin' && patients.length > 0 && (
                <div className="space-y-2">
                  <Label>Paciente</Label>
                  <Select
                    value={filters.patient || ''}
                    onValueChange={(value) => updateFilter('patient', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os pacientes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os pacientes</SelectItem>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Filtros de preço */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preço mínimo (R$)</Label>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={filters.priceMin || ''}
                  onChange={(e) => updateFilter('priceMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
              <div className="space-y-2">
                <Label>Preço máximo (R$)</Label>
                <Input
                  type="number"
                  placeholder="999,00"
                  value={filters.priceMax || ''}
                  onChange={(e) => updateFilter('priceMax', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default TeleconsultaFilters
