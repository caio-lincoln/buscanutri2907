import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag, revalidatePath } from 'next/cache'

// Chave de segurança para acesso administrativo
const ADMIN_SECRET = process.env['ADMIN_SECRET'] || 'admin-secret-key'

export async function POST(request: NextRequest) {
  try {
    const { secret, type, target } = await request.json()

    // Verificar autorização
    if (secret !== ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const buildId = process.env['BUILD_ID'] || 'development'
    const timestamp = new Date().toISOString()

    switch (type) {
      case 'tag':
        if (!target) {
          return NextResponse.json(
            { error: 'Tag target is required' },
            { status: 400 }
          )
        }
        revalidateTag(target)
        // Cache flush by tag - operation completed
        return NextResponse.json({
          success: true,
          message: `Cache flushed successfully`,
          type,
          target,
          buildId,
          timestamp,
        })
        break

      case 'path':
        if (!target) {
          return NextResponse.json(
            { error: 'Path target is required' },
            { status: 400 }
          )
        }
        revalidatePath(target)
        // Cache flush by path - operation completed
        return NextResponse.json({
          success: true,
          message: `Cache flushed successfully`,
          type,
          target,
          buildId,
          timestamp,
        })
        break

      case 'all':
        // Flush de todas as tags comuns
        const commonTags = [
          'nutritionists',
          'specialties',
          'appointments',
          'profiles',
          'dashboard',
          'blog',
          'forum',
        ]

        commonTags.forEach(tag => revalidateTag(tag))

        // Flush de paths comuns
        const commonPaths = [
          '/',
          '/dashboard',
          '/nutricionistas',
          '/blog',
          '/api/specialties',
        ]

        commonPaths.forEach(path => revalidatePath(path))

        // Full cache flush - operation completed
        return NextResponse.json({
          success: true,
          message: `Cache flushed successfully`,
          type,
          target,
          buildId,
          timestamp,
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid flush type. Use: tag, path, or all' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: `Cache flushed successfully`,
      type,
      target,
      buildId,
      timestamp,
    })
  } catch (error) {
    // Cache flush error - handled silently
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const buildId = process.env['BUILD_ID'] || 'development'
  const nodeEnv = process.env.NODE_ENV || 'development'

  return NextResponse.json({
    status: 'Cache management endpoint active',
    buildId,
    environment: nodeEnv,
    timestamp: new Date().toISOString(),
    availableActions: [
      'POST /api/admin/cache-flush - Flush cache by tag, path, or all',
      'GET /api/admin/cache-flush - Get cache status',
    ],
  })
}
