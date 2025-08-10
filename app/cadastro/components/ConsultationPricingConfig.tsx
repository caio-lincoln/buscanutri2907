'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, DollarSign, Users, Monitor } from 'lucide-react'

interface PricingConfig {
  inPerson: {
    enabled: boolean
    pricingType: 'combined' | 'separate'
    combinedPrice: string
    consultationPrice: string
    followupPrice: string
  }
  online: {
    enabled: boolean
    pricingType: 'combined' | 'separate'
    combinedPrice: string
    consultationPrice: string
    followupPrice: string
  }
}

interface ConsultationPricingConfigProps {
  pricingConfig: PricingConfig
  setPricingConfig: (config: PricingConfig) => void
}

export default function ConsultationPricingConfig({
  pricingConfig,
  setPricingConfig,
}: ConsultationPricingConfigProps) {
  const [errors, setErrors] = useState<string[]>([])

  // Função para formatar valor como moeda BRL
  const formatCurrency = (value: string): string => {
    if (!value) return ''
    const numericValue = value.replace(/\D/g, '')
    if (!numericValue) return ''
    const floatValue = parseFloat(numericValue) / 100
    return floatValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    })
  }

  // Função para converter valor formatado para número
  const parseCurrency = (value: string): number | null => {
    if (!value) return null
    const numericValue = value.replace(/[^\d,]/g, '').replace(',', '.')
    const parsed = parseFloat(numericValue)
    return isNaN(parsed) ? null : parsed
  }

  // Validação dos dados
  const validatePricing = (): string[] => {
    const validationErrors: string[] = []

    // Verificar se pelo menos uma modalidade está ativa
    if (!pricingConfig.inPerson.enabled && !pricingConfig.online.enabled) {
      validationErrors.push(
        'Pelo menos uma modalidade (Presencial ou Online) deve estar configurada.'
      )
    }

    // Validar preços presenciais
    if (pricingConfig.inPerson.enabled) {
      if (pricingConfig.inPerson.pricingType === 'combined') {
        const price = parseCurrency(pricingConfig.inPerson.combinedPrice)
        if (price === null || price < 0) {
          validationErrors.push(
            'Preço único presencial deve ser maior ou igual a R$ 0,00.'
          )
        }
      } else if (pricingConfig.inPerson.pricingType === 'separate') {
        const consultationPrice = parseCurrency(
          pricingConfig.inPerson.consultationPrice
        )
        const followupPrice = parseCurrency(
          pricingConfig.inPerson.followupPrice
        )

        if (consultationPrice === null || consultationPrice < 0) {
          validationErrors.push(
            'Preço da consulta presencial deve ser maior ou igual a R$ 0,00.'
          )
        }
        if (followupPrice === null || followupPrice < 0) {
          validationErrors.push(
            'Preço do retorno presencial deve ser maior ou igual a R$ 0,00.'
          )
        }
      }
    }

    // Validar preços online
    if (pricingConfig.online.enabled) {
      if (pricingConfig.online.pricingType === 'combined') {
        const price = parseCurrency(pricingConfig.online.combinedPrice)
        if (price === null || price < 0) {
          validationErrors.push(
            'Preço único online deve ser maior ou igual a R$ 0,00.'
          )
        }
      } else if (pricingConfig.online.pricingType === 'separate') {
        const consultationPrice = parseCurrency(
          pricingConfig.online.consultationPrice
        )
        const followupPrice = parseCurrency(pricingConfig.online.followupPrice)

        if (consultationPrice === null || consultationPrice < 0) {
          validationErrors.push(
            'Preço da consulta online deve ser maior ou igual a R$ 0,00.'
          )
        }
        if (followupPrice === null || followupPrice < 0) {
          validationErrors.push(
            'Preço do retorno online deve ser maior ou igual a R$ 0,00.'
          )
        }
      }
    }

    return validationErrors
  }

  // Atualizar configuração
  const updateConfig = (updates: Partial<PricingConfig>) => {
    const newConfig = { ...pricingConfig, ...updates }
    setPricingConfig(newConfig)

    const validationErrors = validatePricing()
    setErrors(validationErrors)
  }

  // Componente para input de preço
  const PriceInput = ({
    label,
    value,
    onChange,
    placeholder = 'R$ 0,00',
  }: {
    label: string
    value: string
    onChange: (value: string) => void
    placeholder?: string
  }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      const formatted = formatCurrency(inputValue)
      onChange(formatted)
    }

    return (
      <div className="space-y-2">
        <Label htmlFor={label.toLowerCase().replace(/\s+/g, '-')}>
          {label}
        </Label>
        <Input
          id={label.toLowerCase().replace(/\s+/g, '-')}
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className="text-right"
        />
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Configuração de Preços de Consulta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações importantes */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Configure os preços para suas consultas. Você pode escolher entre
            preço único (consulta + retorno) ou preços separados para cada
            modalidade. É obrigatório configurar pelo menos uma modalidade.
          </AlertDescription>
        </Alert>

        {/* Consultas Presenciais */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Consultas Presenciais</h3>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="in-person-enabled"
                checked={pricingConfig.inPerson.enabled}
                onCheckedChange={checked =>
                  updateConfig({
                    inPerson: {
                      ...pricingConfig.inPerson,
                      enabled: checked as boolean,
                    },
                  })
                }
              />
              <Label htmlFor="in-person-enabled">
                Ofereço consultas presenciais
              </Label>
            </div>
          </div>

          {pricingConfig.inPerson.enabled && (
            <>
              <RadioGroup
                value={pricingConfig.inPerson.pricingType}
                onValueChange={(value: 'combined' | 'separate') =>
                  updateConfig({
                    inPerson: {
                      ...pricingConfig.inPerson,
                      pricingType: value,
                    },
                  })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="combined" id="in-person-combined" />
                  <Label htmlFor="in-person-combined">
                    Preço único (consulta + retorno)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="separate" id="in-person-separate" />
                  <Label htmlFor="in-person-separate">Preços separados</Label>
                </div>
              </RadioGroup>

              {pricingConfig.inPerson.pricingType === 'combined' && (
                <div className="ml-6 space-y-4">
                  <PriceInput
                    label="Preço único (consulta + retorno)"
                    value={pricingConfig.inPerson.combinedPrice}
                    onChange={value =>
                      updateConfig({
                        inPerson: {
                          ...pricingConfig.inPerson,
                          combinedPrice: value,
                        },
                      })
                    }
                  />
                </div>
              )}

              {pricingConfig.inPerson.pricingType === 'separate' && (
                <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <PriceInput
                    label="Preço da consulta"
                    value={pricingConfig.inPerson.consultationPrice}
                    onChange={value =>
                      updateConfig({
                        inPerson: {
                          ...pricingConfig.inPerson,
                          consultationPrice: value,
                        },
                      })
                    }
                  />
                  <PriceInput
                    label="Preço do retorno"
                    value={pricingConfig.inPerson.followupPrice}
                    onChange={value =>
                      updateConfig({
                        inPerson: {
                          ...pricingConfig.inPerson,
                          followupPrice: value,
                        },
                      })
                    }
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Consultas Online */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold">Teleconsultas (Online)</h3>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="online-enabled"
                checked={pricingConfig.online.enabled}
                onCheckedChange={checked =>
                  updateConfig({
                    online: {
                      ...pricingConfig.online,
                      enabled: checked as boolean,
                    },
                  })
                }
              />
              <Label htmlFor="online-enabled">Ofereço teleconsultas</Label>
            </div>
          </div>

          {pricingConfig.online.enabled && (
            <>
              <RadioGroup
                value={pricingConfig.online.pricingType}
                onValueChange={(value: 'combined' | 'separate') =>
                  updateConfig({
                    online: {
                      ...pricingConfig.online,
                      pricingType: value,
                    },
                  })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="combined" id="online-combined" />
                  <Label htmlFor="online-combined">
                    Preço único (consulta + retorno)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="separate" id="online-separate" />
                  <Label htmlFor="online-separate">Preços separados</Label>
                </div>
              </RadioGroup>

              {pricingConfig.online.pricingType === 'combined' && (
                <div className="ml-6 space-y-4">
                  <PriceInput
                    label="Preço único (consulta + retorno)"
                    value={pricingConfig.online.combinedPrice}
                    onChange={value =>
                      updateConfig({
                        online: {
                          ...pricingConfig.online,
                          combinedPrice: value,
                        },
                      })
                    }
                  />
                </div>
              )}

              {pricingConfig.online.pricingType === 'separate' && (
                <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <PriceInput
                    label="Preço da consulta"
                    value={pricingConfig.online.consultationPrice}
                    onChange={value =>
                      updateConfig({
                        online: {
                          ...pricingConfig.online,
                          consultationPrice: value,
                        },
                      })
                    }
                  />
                  <PriceInput
                    label="Preço do retorno"
                    value={pricingConfig.online.followupPrice}
                    onChange={value =>
                      updateConfig({
                        online: {
                          ...pricingConfig.online,
                          followupPrice: value,
                        },
                      })
                    }
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Erros de validação */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Resumo dos preços configurados */}
        {(pricingConfig.inPerson.enabled || pricingConfig.online.enabled) && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">
              Resumo dos Preços Configurados:
            </h4>
            <div className="space-y-2 text-sm">
              {pricingConfig.inPerson.enabled && (
                <div>
                  <strong>Presencial:</strong>{' '}
                  {pricingConfig.inPerson.pricingType === 'combined' &&
                  pricingConfig.inPerson.combinedPrice
                    ? `Preço único: ${pricingConfig.inPerson.combinedPrice}`
                    : pricingConfig.inPerson.pricingType === 'separate'
                      ? `Consulta: ${pricingConfig.inPerson.consultationPrice || 'Não definido'}, Retorno: ${pricingConfig.inPerson.followupPrice || 'Não definido'}`
                      : 'Não configurado'}
                </div>
              )}
              {pricingConfig.online.enabled && (
                <div>
                  <strong>Online:</strong>{' '}
                  {pricingConfig.online.pricingType === 'combined' &&
                  pricingConfig.online.combinedPrice
                    ? `Preço único: ${pricingConfig.online.combinedPrice}`
                    : pricingConfig.online.pricingType === 'separate'
                      ? `Consulta: ${pricingConfig.online.consultationPrice || 'Não definido'}, Retorno: ${pricingConfig.online.followupPrice || 'Não definido'}`
                      : 'Não configurado'}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
