import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

// Tipos de erro customizados
export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso não encontrado') {
    super(message, 404)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Não autorizado') {
    super(message, 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Acesso negado') {
    super(message, 403)
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflito de dados') {
    super(message, 409)
  }
}

// Função para tratar erros de forma padronizada
export function handleError(error: unknown): NextResponse {
  // console.error('API Error:', error)

  // Erro de validação do Zod
  if (error instanceof ZodError) {
    const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
    return NextResponse.json(
      { error: `Dados inválidos: ${errorMessage}` },
      { status: 400 }
    )
  }

  // Erros customizados da aplicação
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    )
  }

  // Erros do Supabase
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as any
    
    switch (supabaseError.code) {
      case '23505': // Violação de constraint única
        return NextResponse.json(
          { error: 'Dados duplicados. Este registro já existe.' },
          { status: 409 }
        )
      case '23503': // Violação de chave estrangeira
        return NextResponse.json(
          { error: 'Referência inválida. Verifique os dados relacionados.' },
          { status: 400 }
        )
      case '42501': // Permissão insuficiente
        return NextResponse.json(
          { error: 'Permissão insuficiente para realizar esta operação.' },
          { status: 403 }
        )
      default:
        return NextResponse.json(
          { error: supabaseError.message || 'Erro no banco de dados' },
          { status: 500 }
        )
    }
  }

  // Erro genérico
  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  // Erro desconhecido
  return NextResponse.json(
    { error: 'Erro interno do servidor' },
    { status: 500 }
  )
}

// Wrapper para handlers de API com tratamento de erro automático
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleError(error)
    }
  }
}

// Função para validar autenticação
export function validateAuth(userId: string | null): string {
  if (!userId) {
    throw new UnauthorizedError('Usuário não autenticado')
  }
  return userId
}

// Função para validar permissões
export function validatePermission(condition: boolean, message?: string): void {
  if (!condition) {
    throw new ForbiddenError(message)
  }
}

// Função para validar existência de recurso
export function validateResourceExists<T>(resource: T | null, message?: string): T {
  if (!resource) {
    throw new NotFoundError(message)
  }
  return resource
}