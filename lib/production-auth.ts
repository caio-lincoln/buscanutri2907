/**
 * Utilitário para verificação de autorização em ambiente de produção
 * Baseado nas regras de workspace para operações críticas
 */

import { NextRequest } from 'next/server'

/**
 * Verifica se está em ambiente de produção
 */
export function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Verifica se a requisição tem autorização para operações críticas em produção
 * Procura pelo flag #liberar_producao no header ou body da requisição
 */
export function hasProductionAuthorization(request: NextRequest, body?: any): boolean {
  // Se não está em produção, sempre autoriza
  if (!isProductionEnvironment()) {
    return true
  }

  // Verifica no header da requisição
  const authHeader = request.headers.get('x-production-auth')
  if (authHeader === 'liberar_producao') {
    return true
  }

  // Verifica no body da requisição
  if (body && (body.production_auth === 'liberar_producao' || body.liberar_producao === true)) {
    return true
  }

  // Verifica variável de ambiente para casos especiais
  if (process.env.FORCE_PRODUCTION_OPERATIONS === 'true') {
    return true
  }

  return false
}

/**
 * Classe de erro para operações não autorizadas em produção
 */
export class ProductionAuthorizationError extends Error {
  constructor(operation: string) {
    super(`Tentativa de ${operation} em produção sem autorização. Adicione 'x-production-auth: liberar_producao' no header ou 'production_auth: "liberar_producao"' no body da requisição.`)
    this.name = 'ProductionAuthorizationError'
  }
}

/**
 * Middleware para verificar autorização de produção
 * Deve ser chamado antes de operações críticas (CREATE, UPDATE, DELETE)
 */
export function requireProductionAuth(request: NextRequest, body: any, operation: string): void {
  if (!hasProductionAuthorization(request, body)) {
    throw new ProductionAuthorizationError(operation)
  }
}

/**
 * Log de operações críticas em produção
 */
export function logProductionOperation(operation: string, resourceId: string, userId: string): void {
  if (isProductionEnvironment()) {
    console.log(`[PRODUCTION_OPERATION] ${new Date().toISOString()} - ${operation} - Resource: ${resourceId} - User: ${userId}`)
  }
}