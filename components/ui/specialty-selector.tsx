'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface Specialty {
  id: string
  name: string
  description?: string
}

interface SpecialtySelectorProps {
  selectedSpecialties: string[]
  onSpecialtiesChange: (specialties: string[]) => void
  disabled?: boolean
  required?: boolean
  maxSelections?: number
  placeholder?: string
  className?: string
}

export function SpecialtySelector({
  selectedSpecialties,
  onSpecialtiesChange,
  disabled = false,
  required = false,
  maxSelections = 5,
  placeholder = 'Selecione suas especialidades...',
  className,
}: SpecialtySelectorProps) {
  const [open, setOpen] = useState(false)
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carregar especialidades do banco
  useEffect(() => {
    const loadSpecialties = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/specialties')
        if (!response.ok) {
          throw new Error('Erro ao carregar especialidades')
        }

        const data = await response.json()
        setSpecialties(data.specialties || [])
      } catch (err) {
        // Silent error handling - error loading specialties
        setError('Erro ao carregar especialidades')
      } finally {
        setLoading(false)
      }
    }

    loadSpecialties()
  }, [])

  const handleSpecialtyToggle = (specialtyId: string) => {
    if (disabled) return

    const isSelected = selectedSpecialties.includes(specialtyId)

    if (isSelected) {
      // Remover especialidade
      onSpecialtiesChange(selectedSpecialties.filter(id => id !== specialtyId))
    } else {
      // Adicionar especialidade (respeitando limite máximo)
      if (selectedSpecialties.length < maxSelections) {
        onSpecialtiesChange([...selectedSpecialties, specialtyId])
      }
    }
  }

  const removeSpecialty = (specialtyId: string) => {
    if (disabled) return
    onSpecialtiesChange(selectedSpecialties.filter(id => id !== specialtyId))
  }

  const getSelectedSpecialtyNames = () => {
    return specialties
      .filter(specialty => selectedSpecialties.includes(specialty.id))
      .map(specialty => specialty.name)
  }

  const canAddMore = selectedSpecialties.length < maxSelections

  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        <Label>Especialidades {required && '*'}</Label>
        <div className="h-11 border border-gray-200 rounded-md flex items-center px-3 bg-gray-50">
          <span className="text-gray-500 text-sm">
            Carregando especialidades...
          </span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('space-y-2', className)}>
        <Label>Especialidades {required && '*'}</Label>
        <div className="h-11 border border-red-200 rounded-md flex items-center px-3 bg-red-50">
          <span className="text-red-500 text-sm">{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Label>
        Especialidades {required && '*'}
        <span className="text-xs text-gray-500 ml-2">
          (máximo {maxSelections} especialidades)
        </span>
      </Label>

      {/* Especialidades selecionadas */}
      {selectedSpecialties.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {getSelectedSpecialtyNames().map((name, index) => (
            <Badge
              key={selectedSpecialties[index]}
              variant="secondary"
              className="bg-[#4AB0D9]/10 text-[#4AB0D9] border-[#4AB0D9]/20 hover:bg-[#4AB0D9]/20"
            >
              {name}
              {!disabled && (
                <button
                  type="button"
                  className="ml-1 hover:bg-[#4AB0D9]/30 rounded-full p-0.5"
                  onClick={() => removeSpecialty(selectedSpecialties[index])}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Seletor de especialidades */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full h-11 justify-between',
              !canAddMore && 'opacity-50 cursor-not-allowed',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            disabled={disabled || !canAddMore}
          >
            <span className="text-left truncate">
              {selectedSpecialties.length === 0
                ? placeholder
                : `${selectedSpecialties.length} especialidade${selectedSpecialties.length > 1 ? 's' : ''} selecionada${selectedSpecialties.length > 1 ? 's' : ''}`}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar especialidade..." />
            <CommandEmpty>Nenhuma especialidade encontrada.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {specialties.map(specialty => {
                const isSelected = selectedSpecialties.includes(specialty.id)
                const canSelect = canAddMore || isSelected

                return (
                  <CommandItem
                    key={specialty.id}
                    value={specialty.name}
                    onSelect={() => handleSpecialtyToggle(specialty.id)}
                    className={cn(
                      'cursor-pointer',
                      !canSelect &&
                        !isSelected &&
                        'opacity-50 cursor-not-allowed'
                    )}
                    disabled={!canSelect && !isSelected}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{specialty.name}</div>
                      {specialty.description && (
                        <div className="text-xs text-gray-500 mt-1">
                          {specialty.description}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Informações adicionais */}
      <div className="text-xs text-gray-500">
        {selectedSpecialties.length > 0 && (
          <span>
            {selectedSpecialties.length}/{maxSelections} especialidades
            selecionadas
          </span>
        )}
        {!canAddMore && (
          <span className="text-amber-600 ml-2">Limite máximo atingido</span>
        )}
      </div>
    </div>
  )
}
