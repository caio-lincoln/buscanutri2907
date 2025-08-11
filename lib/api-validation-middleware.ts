/**
 * Middleware de validação para APIs
 * Rejeita payloads com strings que parecem JSON e garante tipos corretos
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateStructuredPayload } from './structured-data-utils'

// Campos que devem ser arrays/objetos estruturados
const STRUCTURED_FIELDS = [
  'languages',
  'specialties',
  'services',
  'certifications',
  'achievements',
  'available_times',
  'social_media',
  'working_hours',
  'testimonials',
  'education',
  'addresses',
  'prices',
  'dietary_preferences',
  'payment_methods',
  'consultation_languages',
]

/**
 * Interface para resultado de validação
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  normalizedPayload?: any
}

/**
 * Valida um payload de API para campos estruturados
 */
export function validateApiPayload(payload: any): ValidationResult {
  const errors: string[] = []
  const normalizedPayload = { ...payload }

  for (const fieldName of STRUCTURED_FIELDS) {
    if (payload.hasOwnProperty(fieldName)) {
      const validation = validateStructuredPayload(payload, fieldName)

      if (!validation.isValid) {
        errors.push(validation.error!)
      } else if (validation.normalizedValue !== undefined) {
        normalizedPayload[fieldName] = validation.normalizedValue
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    normalizedPayload: errors.length === 0 ? normalizedPayload : undefined,
  }
}

/**
 * Middleware para validação automática de APIs
 */
export function withApiValidation(
  handler: (req: NextRequest, validatedPayload: any) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Só valida métodos que enviam dados
      if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
        return handler(req, null)
      }

      const payload = await req.json()
      const validation = validateApiPayload(payload)

      if (!validation.isValid) {
        return NextResponse.json(
          {
            error: 'Payload inválido',
            details: validation.errors,
            message:
              'Campos estruturados devem ser enviados como arrays/objetos, não como strings JSON.',
          },
          { status: 400 }
        )
      }

      // Criar nova request com payload normalizado
      const normalizedReq = new NextRequest(req.url, {
        method: req.method,
        headers: req.headers,
        body: JSON.stringify(validation.normalizedPayload),
      })

      return handler(normalizedReq, validation.normalizedPayload)
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Erro ao processar payload',
          message: 'Formato de dados inválido',
        },
        { status: 400 }
      )
    }
  }
}

/**
 * Validador específico para perfis de nutricionista
 */
export function validateNutritionistPayload(payload: any): ValidationResult {
  const baseValidation = validateApiPayload(payload)
  const errors = [...baseValidation.errors]

  // Validações específicas para nutricionista
  if (payload.crn && typeof payload.crn !== 'string') {
    errors.push('CRN deve ser uma string')
  }

  if (
    payload.consultation_price &&
    typeof payload.consultation_price !== 'number'
  ) {
    errors.push('Preço da consulta deve ser um número')
  }

  if (
    payload.experience_years &&
    typeof payload.experience_years !== 'number'
  ) {
    errors.push('Anos de experiência deve ser um número')
  }

  return {
    isValid: errors.length === 0,
    errors,
    normalizedPayload:
      errors.length === 0 ? baseValidation.normalizedPayload : undefined,
  }
}

/**
 * Validador específico para perfis de paciente
 */
export function validatePatientPayload(payload: any): ValidationResult {
  const baseValidation = validateApiPayload(payload)
  const errors = [...baseValidation.errors]

  // Validações específicas para paciente
  if (payload.birth_date && !isValidDate(payload.birth_date)) {
    errors.push('Data de nascimento deve estar em formato válido')
  }

  if (payload.weight && typeof payload.weight !== 'number') {
    errors.push('Peso deve ser um número')
  }

  if (payload.height && typeof payload.height !== 'number') {
    errors.push('Altura deve ser um número')
  }

  return {
    isValid: errors.length === 0,
    errors,
    normalizedPayload:
      errors.length === 0 ? baseValidation.normalizedPayload : undefined,
  }
}

/**
 * Validador específico para perfis de empresa
 */
export function validateCompanyPayload(payload: any): ValidationResult {
  const baseValidation = validateApiPayload(payload)
  const errors = [...baseValidation.errors]

  // Validações específicas para empresa
  if (payload.cnpj && typeof payload.cnpj !== 'string') {
    errors.push('CNPJ deve ser uma string')
  }

  if (payload.employee_count && typeof payload.employee_count !== 'number') {
    errors.push('Número de funcionários deve ser um número')
  }

  return {
    isValid: errors.length === 0,
    errors,
    normalizedPayload:
      errors.length === 0 ? baseValidation.normalizedPayload : undefined,
  }
}

/**
 * Utilitário para validar datas
 */
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime())
}

/**
 * Middleware para logging de tentativas de payload inválido
 */
export function logInvalidPayloadAttempt(
  fieldName: string,
  value: any,
  context: any = {}
) {
  console.warn('payload_invalid_json_wrapped_blocked', {
    field: fieldName,
    valueType: typeof value,
    valuePreview:
      typeof value === 'string' ? value.substring(0, 100) + '...' : value,
    timestamp: new Date().toISOString(),
    context,
  })
}

/**
 * Cria um response de erro padronizado para validação
 */
export function createValidationErrorResponse(
  errors: string[],
  statusCode: number = 400
): NextResponse {
  return NextResponse.json(
    {
      error: 'Dados inválidos',
      details: errors,
      message: 'Verifique os dados enviados e tente novamente.',
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  )
}
