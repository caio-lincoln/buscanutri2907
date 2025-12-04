export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly isOperational: boolean

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = isOperational
    this.name = this.constructor.name

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Dados inválidos') {
    super(message, 400, 'VALIDATION_ERROR')
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Não autorizado') {
    super(message, 401, 'AUTHENTICATION_ERROR')
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Acesso negado') {
    super(message, 403, 'AUTHORIZATION_ERROR')
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso não encontrado') {
    super(message, 404, 'NOT_FOUND_ERROR')
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflito de dados') {
    super(message, 409, 'CONFLICT_ERROR')
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Muitas requisições') {
    super(message, 429, 'RATE_LIMIT_ERROR')
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Erro no banco de dados') {
    super(message, 500, 'DATABASE_ERROR')
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string = 'Erro em serviço externo') {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR')
  }
}

// Teleconsulta specific errors
export class TeleconsultaError extends AppError {
  constructor(message: string, code: string = 'TELECONSULTA_ERROR') {
    super(message, 400, code)
  }
}

export class SessionNotFoundError extends TeleconsultaError {
  constructor(message: string = 'Sessão de teleconsulta não encontrada') {
    super(message, 'SESSION_NOT_FOUND')
  }
}

export class SessionExpiredError extends TeleconsultaError {
  constructor(message: string = 'Sessão de teleconsulta expirada') {
    super(message, 'SESSION_EXPIRED')
  }
}

export class SessionFullError extends TeleconsultaError {
  constructor(message: string = 'Sessão de teleconsulta lotada') {
    super(message, 'SESSION_FULL')
  }
}

export class InvalidSessionTokenError extends TeleconsultaError {
  constructor(message: string = 'Token de sessão inválido') {
    super(message, 'INVALID_SESSION_TOKEN')
  }
}

export class SchedulingConflictError extends TeleconsultaError {
  constructor(message: string = 'Conflito de agendamento') {
    super(message, 'SCHEDULING_CONFLICT')
  }
}

export class PaymentRequiredError extends AppError {
  constructor(message: string = 'Pagamento necessário') {
    super(message, 402, 'PAYMENT_REQUIRED')
  }
}

export class AvailabilityError extends TeleconsultaError {
  constructor(message: string = 'Horário não disponível') {
    super(message, 'AVAILABILITY_ERROR')
  }
}

// Error handler utility
export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    // Check for specific database errors
    if (error.message.includes('duplicate key')) {
      return new ConflictError('Dados duplicados')
    }

    if (error.message.includes('foreign key')) {
      return new ValidationError('Referência inválida')
    }

    if (error.message.includes('not found')) {
      return new NotFoundError()
    }

    // Generic error
    return new AppError(error.message)
  }

  // Unknown error type
  return new AppError('Erro desconhecido')
}

// Error response formatter
export function formatErrorResponse(error: AppError) {
  return {
    error: {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode
    }
  }
}

// Error logger
export function logError(error: AppError, context?: Record<string, any>) {
  const logData = {
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  }

  if (error.statusCode >= 500) {
    console.error('Server Error:', logData)
  } else {
    console.warn('Client Error:', logData)
  }
}

// Async error wrapper
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      const appError = handleError(error)
      logError(appError, { args })
      throw appError
    }
  }
}

// Error boundary utility function
export function createErrorBoundary() {
  return {
    handleError: (error: Error) => {
      console.error('Error caught by boundary:', error)
      return {
        hasError: true,
        error: error
      }
    },
    
    getErrorMessage: (error: Error) => {
      if (error instanceof AppError) {
        return error.message
      }
      return 'Ocorreu um erro inesperado. Tente novamente.'
    }
  }
}
