'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement | null>(null)

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

  const filteredSpecialties = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return specialties
    return specialties.filter(s =>
      s.name.toLowerCase().includes(term) ||
      (s.description || '').toLowerCase().includes(term)
    )
  }, [ specialties, searchTerm ])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!open) return
      if (!containerRef.current) return
      const target = event.target as Node | null
      if (target && !containerRef.current.contains(target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [open])

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
    <div ref={containerRef} className={cn('space-y-2', className)}>
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
      <div className="relative">
        <Button
          variant="outline"
          type="button"
          onClick={() => setOpen(prev => !prev)}
          className={cn(
            'w-full h-11 justify-between',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          disabled={disabled}
        >
          <span className="text-left truncate">
            {selectedSpecialties.length === 0
              ? placeholder
              : `${selectedSpecialties.length} especialidade${selectedSpecialties.length > 1 ? 's' : ''} selecionada${selectedSpecialties.length > 1 ? 's' : ''}`}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>

        {open && (
          <div className="mt-2 p-3 border rounded-xl bg-white shadow-sm space-y-3">
            <Input
              placeholder="Buscar especialidade..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-10 text-sm"
            />
            <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {filteredSpecialties.map(esp => {
                  const active = selectedSpecialties.includes(esp.id)
                  const canSelect = active || canAddMore
                  const isDisabled = disabled || (!active && !canSelect)
                  return (
                    <button
                      key={esp.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        if (isDisabled) return
                        handleSpecialtyToggle(esp.id)
                        setOpen(false)
                      }}
                      disabled={isDisabled}
                      className={cn(
                        'w-full min-h-[52px] px-4 py-3 rounded-xl border text-left transition select-none touch-manipulation',
                        active
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-white text-gray-800 border-gray-300',
                        isDisabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {esp.name}
                    </button>
                  )
                })}
                {filteredSpecialties.length === 0 && (
                  <div className="text-xs text-gray-500 px-1 py-2">
                    Nenhuma especialidade encontrada.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

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
