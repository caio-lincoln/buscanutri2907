import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface ApiError {
  message: string
  code?: string
  status: number
}

export class ApiException extends Error {
  public status: number
  public code?: string

  constructor(message: string, status: number = 500, code?: string) {
    super(message)
    this.status = status
    this.code = code
    this.name = 'ApiException'
  }
}

export function withErrorHandling(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(req, context)
    } catch (error) {
      console.error('API Error:', error)

      if (error instanceof ApiException) {
        return NextResponse.json(
          {
            error: {
              message: error.message,
              code: error.code,
              status: error.status
            }
          },
          { status: error.status }
        )
      }

      // Erro genérico
      return NextResponse.json(
        {
          error: {
            message: 'Erro interno do servidor',
            status: 500
          }
        },
        { status: 500 }
      )
    }
  }
}

export function withAuth(
  handler: (req: NextRequest, user: any, context?: any) => Promise<NextResponse>
) {
  return withErrorHandling(async (req: NextRequest, context?: any) => {
    const supabase = await createClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      throw new ApiException('Não autorizado', 401, 'UNAUTHORIZED')
    }

    return handler(req, user, context)
  })
}

export function withValidation<T>(
  schema: (data: any) => T,
  handler: (req: NextRequest, data: T, context?: any) => Promise<NextResponse>
) {
  return withErrorHandling(async (req: NextRequest, context?: any) => {
    try {
      const body = await req.json()
      const validatedData = schema(body)
      return handler(req, validatedData, context)
    } catch (error) {
      throw new ApiException('Dados inválidos', 400, 'VALIDATION_ERROR')
    }
  })
}

export function withRateLimit(
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutos
) {
  const requests = new Map<string, { count: number; resetTime: number }>()

  return (handler: (req: NextRequest, context?: any) => Promise<NextResponse>) => {
    return withErrorHandling(async (req: NextRequest, context?: any) => {
      const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
      const now = Date.now()
      
      const userRequests = requests.get(ip)
      
      if (!userRequests || now > userRequests.resetTime) {
        requests.set(ip, { count: 1, resetTime: now + windowMs })
      } else {
        userRequests.count++
        
        if (userRequests.count > maxRequests) {
          throw new ApiException('Muitas requisições', 429, 'RATE_LIMIT_EXCEEDED')
        }
      }

      return handler(req, context)
    })
  }
}

export function createApiResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({ data }, { status })
}

export function createErrorResponse(message: string, status: number = 400, code?: string) {
  return NextResponse.json(
    {
      error: {
        message,
        code,
        status
      }
    },
    { status }
  )
}