import { z } from 'zod'

export type CourseStatus = 'draft' | 'published' | 'archived'

export interface Course {
  id: string
  nutritionist_id?: string | null
  title: string
  description?: string | null
  price?: number | null
  duration_hours?: number | null
  thumbnail_url?: string | null
  redirect_url?: string | null
  is_published?: boolean | null
  enrollments_count?: number | null
  created_at?: string | null
  updated_at?: string | null
  category?: string | null
  status?: CourseStatus | null
  instructor_name?: string | null
  instructor_bio?: string | null
  level?: string | null
  certificate_available?: boolean | null
  rating?: number | null
}

export const createCourseSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  duration_hours: z.number().min(0).optional(),
  thumbnail_url: z.string().url().optional(),
  redirect_url: z.string().url().optional(),
  is_published: z.boolean().optional(),
  category: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  instructor_name: z.string().optional(),
  instructor_bio: z.string().optional(),
  level: z.string().optional(),
  certificate_available: z.boolean().optional(),
})

export const updateCourseSchema = createCourseSchema.partial()

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const rawErr = (data as any)?.error ?? (data as any)?.message
    const msg = Array.isArray(rawErr)
      ? rawErr.map((e: any) => (e?.message || e?.toString?.() || '')).filter(Boolean).join('; ')
      : rawErr
    throw new Error(msg || 'Erro na requisição')
  }
  return data as T
}

export const AdminCoursesService = {
  async list(status?: CourseStatus): Promise<Course[]> {
    const url = new URL('/api/admin/courses', typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
    if (status) url.searchParams.set('status', status)
    const res = await fetch(url.toString(), { method: 'GET' })
    return handleResponse<Course[]>(res)
  },

  async create(payload: z.infer<typeof createCourseSchema>, opts?: { productionAuth?: string }): Promise<Course> {
    const res = await fetch('/api/admin/courses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(opts?.productionAuth ? { 'x-production-auth': opts.productionAuth } : {}),
      },
      body: JSON.stringify({ ...payload, production_auth: opts?.productionAuth }),
    })
    return handleResponse<Course>(res)
  },

  async update(id: string, payload: z.infer<typeof updateCourseSchema>, opts?: { productionAuth?: string }): Promise<Course> {
    const res = await fetch(`/api/admin/courses/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(opts?.productionAuth ? { 'x-production-auth': opts.productionAuth } : {}),
      },
      body: JSON.stringify({ ...payload, production_auth: opts?.productionAuth }),
    })
    return handleResponse<Course>(res)
  },

  async archive(id: string, opts?: { productionAuth?: string }): Promise<Course> {
    return this.update(id, { status: 'archived', is_published: false }, opts)
  },

  async unarchive(id: string, opts?: { productionAuth?: string }): Promise<Course> {
    return this.update(id, { status: 'draft' }, opts)
  },

  async delete(id: string, opts?: { productionAuth?: string }): Promise<{ success: boolean }> {
    const res = await fetch(`/api/admin/courses/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(opts?.productionAuth ? { 'x-production-auth': opts.productionAuth } : {}),
      },
      body: JSON.stringify({ production_auth: opts?.productionAuth })
    })
    return handleResponse<{ success: boolean }>(res)
  },
}

export default AdminCoursesService
