'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Filter, MoreHorizontal, Edit, Archive, Trash2, PlusCircle, RefreshCw } from 'lucide-react'
import AdminCoursesService, { type Course, type CourseStatus, createCourseSchema } from '@/lib/admin-courses-service'
import { z } from 'zod'
import { AdvancedImageUpload } from '@/components/ui/advanced-image-upload'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'

type CreateForm = z.infer<typeof createCourseSchema>

export function AdminCoursesTab() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<CourseStatus | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const [isNewOpen, setIsNewOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [form, setForm] = useState<CreateForm>({ title: '', description: '', category: '', level: 'Júnior', is_published: false, redirect_url: '' as any })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const filteredCourses = useMemo(() => {
    let data = courses
    if (statusFilter !== 'all') {
      data = data.filter(c => (c.status || 'draft') === statusFilter)
    }
    if (searchTerm.trim().length > 0) {
      const q = searchTerm.toLowerCase()
      data = data.filter(c =>
        (c.title || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q) ||
        (c.category || '').toLowerCase().includes(q)
      )
    }
    return data
  }, [courses, statusFilter, searchTerm])

  const loadCourses = async () => {
    setLoading(true)
    try {
      const status = statusFilter === 'all' ? undefined : statusFilter
      const data = await AdminCoursesService.list(status)
      setCourses(data || [])
    } catch (e) {
      // Silent error handling to avoid UX disruption
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCourses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const openNew = () => {
    setForm({ title: '', description: '', category: '', level: 'Júnior', is_published: false, redirect_url: '' as any })
    setSubmitError(null)
    setIsNewOpen(true)
  }

  const openEdit = (course: Course) => {
    setEditingCourse(course)
    setForm({
      title: course.title || '',
      description: course.description || '',
      price: course.price ?? undefined,
      duration_hours: course.duration_hours ?? undefined,
      thumbnail_url: course.thumbnail_url ?? undefined,
      is_published: !!course.is_published,
      category: course.category || '',
      status: (course.status as CourseStatus) || 'draft',
      instructor_name: course.instructor_name || '',
      instructor_bio: course.instructor_bio || '',
      level: course.level || 'Júnior',
      certificate_available: !!course.certificate_available,
      redirect_url: course.redirect_url || '',
    })
    setSubmitError(null)
    setIsEditOpen(true)
  }

  const handleCreate = async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const allowedLevels = ['Estagiário', 'Júnior', 'Pleno', 'Sênior', 'Gerente'] as const
      const normalizedLevel = allowedLevels.includes((form.level || '') as any) ? (form.level as typeof allowedLevels[number]) : 'Júnior'
      const payload = {
        title: (form.title || '').trim(),
        description: form.description?.trim() ? form.description.trim() : undefined,
        category: form.category?.trim() ? form.category.trim() : undefined,
        instructor_name: form.instructor_name?.trim() ? form.instructor_name.trim() : undefined,
        instructor_bio: form.instructor_bio?.trim() ? form.instructor_bio.trim() : undefined,
        level: normalizedLevel,
        thumbnail_url: form.thumbnail_url?.trim() ? form.thumbnail_url.trim() : undefined,
        price: form.price ?? undefined,
        duration_hours: form.duration_hours ?? undefined,
      is_published: form.is_published ?? undefined,
      certificate_available: form.certificate_available ?? undefined,
      redirect_url: form.redirect_url?.trim() ? form.redirect_url.trim() : undefined,
    }
      // Ajuste: mapear status automaticamente conforme is_published
      if (payload.is_published === true) {
        (payload as any).status = 'published'
      } else if (payload.is_published === false) {
        (payload as any).status = 'draft'
      }
      await AdminCoursesService.create(payload, { productionAuth: 'liberar_producao' })
      setIsNewOpen(false)
      await loadCourses()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao criar curso'
      setSubmitError(msg)
      toast({ title: 'Erro ao criar curso', description: msg, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingCourse) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const allowedLevels = ['Estagiário', 'Júnior', 'Pleno', 'Sênior', 'Gerente'] as const
      const normalizedLevel = allowedLevels.includes((form.level || '') as any) ? (form.level as typeof allowedLevels[number]) : 'Júnior'
      const payload = {
        title: (form.title || '').trim(),
        description: form.description?.trim() ? form.description.trim() : undefined,
        category: form.category?.trim() ? form.category.trim() : undefined,
        instructor_name: form.instructor_name?.trim() ? form.instructor_name.trim() : undefined,
        instructor_bio: form.instructor_bio?.trim() ? form.instructor_bio.trim() : undefined,
        level: normalizedLevel,
        thumbnail_url: form.thumbnail_url?.trim() ? form.thumbnail_url.trim() : undefined,
        price: form.price ?? undefined,
        duration_hours: form.duration_hours ?? undefined,
      is_published: form.is_published ?? undefined,
      certificate_available: form.certificate_available ?? undefined,
      redirect_url: form.redirect_url?.trim() ? form.redirect_url.trim() : undefined,
    }
      // Ajuste: mapear status automaticamente conforme is_published
      if (payload.is_published === true) {
        (payload as any).status = 'published'
      } else if (payload.is_published === false) {
        (payload as any).status = 'draft'
      }
      await AdminCoursesService.update(editingCourse.id, payload, { productionAuth: 'liberar_producao' })
      setIsEditOpen(false)
      setEditingCourse(null)
      await loadCourses()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao atualizar curso'
      setSubmitError(msg)
      toast({ title: 'Erro ao atualizar curso', description: msg, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleArchive = async (course: Course) => {
    try {
      await AdminCoursesService.archive(course.id)
      await loadCourses()
    } catch {}
  }

  const handleDelete = async (course: Course) => {
    try {
      await AdminCoursesService.delete(course.id)
      await loadCourses()
    } catch {}
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-xl">Gerenciar Cursos</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadCourses} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
            </Button>
            <Button onClick={openNew}>
              <PlusCircle className="h-4 w-4 mr-2" /> Novo Curso
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, descrição ou categoria"
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
                <SelectItem value="archived">Arquivado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Instrutor</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.title}</TableCell>
                    <TableCell>{course.category || '-'}</TableCell>
                    <TableCell>{course.instructor_name || '-'}</TableCell>
                    <TableCell>{course.duration_hours ? `${course.duration_hours}h` : '-'}</TableCell>
                    <TableCell>{typeof course.price === 'number' ? `R$ ${course.price.toFixed(2)}` : '-'}</TableCell>
                    <TableCell>
                      <Badge variant={course.status === 'published' ? 'default' : course.status === 'archived' ? 'secondary' : 'outline'}>
                        {course.status || 'draft'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(course)}>
                            <Edit className="h-4 w-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleArchive(course)}>
                            <Archive className="h-4 w-4 mr-2" /> Arquivar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(course)}>
                            <Trash2 className="h-4 w-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {loading && (
              <div className="p-4 text-sm text-muted-foreground">Carregando cursos…</div>
            )}
            {!loading && filteredCourses.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">Nenhum curso encontrado.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Novo Curso */}
      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
        <DialogContent className="w-full sm:max-w-lg md:max-w-2xl lg:max-w-3xl max-h-[85vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>Novo Curso</DialogTitle>
            <DialogDescription>Preencha as informações do curso.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <Label>Título</Label>
              <Input value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Categoria</Label>
              <Input value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div>
              <Label>Nível</Label>
              <Select value={form.level || 'Júnior'} onValueChange={(v) => setForm({ ...form, level: v as any })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Estagiário">Estagiário</SelectItem>
                  <SelectItem value="Júnior">Júnior</SelectItem>
                  <SelectItem value="Pleno">Pleno</SelectItem>
                  <SelectItem value="Sênior">Sênior</SelectItem>
                  <SelectItem value="Gerente">Gerente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Instrutor</Label>
              <Input value={form.instructor_name || ''} onChange={(e) => setForm({ ...form, instructor_name: e.target.value })} />
            </div>
            <div>
              <Label>Preço (R$)</Label>
              <Input type="number" step="0.01" value={form.price?.toString() || ''} onChange={(e) => setForm({ ...form, price: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
            <div>
              <Label>Duração (horas)</Label>
              <Input type="number" value={form.duration_hours?.toString() || ''} onChange={(e) => setForm({ ...form, duration_hours: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
            <div className="md:col-span-2">
              <Label>Descrição</Label>
              <Textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Thumbnail do Curso</Label>
              <AdvancedImageUpload
                userId={user?.id || ''}
                currentImageUrl={form.thumbnail_url || ''}
                onImageUploaded={(url) => setForm({ ...form, thumbnail_url: url })}
                onImageRemoved={() => setForm({ ...form, thumbnail_url: undefined })}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Link de Redirecionamento (Kiwify/Hotmart)</Label>
              <Input
                placeholder="https://..."
                value={(form as any).redirect_url || ''}
                onChange={(e) => setForm({ ...form, redirect_url: e.target.value as any })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={!!form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
              <Label>Publicado</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={!!form.certificate_available} onCheckedChange={(v) => setForm({ ...form, certificate_available: v })} />
              <Label>Certificado disponível</Label>
            </div>
          </div>
          {submitError && (
            <div className="text-sm text-destructive border border-destructive/30 rounded-md p-2 bg-destructive/5">
              {submitError}
            </div>
          )}
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsNewOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={submitting}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editar Curso */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="w-full sm:max-w-lg md:max-w-2xl lg:max-w-3xl max-h-[85vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>Editar Curso</DialogTitle>
            <DialogDescription>Atualize as informações do curso.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <Label>Título</Label>
              <Input value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Categoria</Label>
              <Input value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div>
              <Label>Nível</Label>
              <Select value={form.level || 'Júnior'} onValueChange={(v) => setForm({ ...form, level: v as any })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Estagiário">Estagiário</SelectItem>
                  <SelectItem value="Júnior">Júnior</SelectItem>
                  <SelectItem value="Pleno">Pleno</SelectItem>
                  <SelectItem value="Sênior">Sênior</SelectItem>
                  <SelectItem value="Gerente">Gerente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Instrutor</Label>
              <Input value={form.instructor_name || ''} onChange={(e) => setForm({ ...form, instructor_name: e.target.value })} />
            </div>
            <div>
              <Label>Preço (R$)</Label>
              <Input type="number" step="0.01" value={form.price?.toString() || ''} onChange={(e) => setForm({ ...form, price: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
            <div>
              <Label>Duração (horas)</Label>
              <Input type="number" value={form.duration_hours?.toString() || ''} onChange={(e) => setForm({ ...form, duration_hours: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
            <div className="md:col-span-2">
              <Label>Descrição</Label>
              <Textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Thumbnail do Curso</Label>
              <AdvancedImageUpload
                userId={user?.id || ''}
                currentImageUrl={form.thumbnail_url || ''}
                onImageUploaded={(url) => setForm({ ...form, thumbnail_url: url })}
                onImageRemoved={() => setForm({ ...form, thumbnail_url: undefined })}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Link de Redirecionamento (Kiwify/Hotmart)</Label>
              <Input
                placeholder="https://..."
                value={(form as any).redirect_url || ''}
                onChange={(e) => setForm({ ...form, redirect_url: e.target.value as any })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={!!form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
              <Label>Publicado</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={!!form.certificate_available} onCheckedChange={(v) => setForm({ ...form, certificate_available: v })} />
              <Label>Certificado disponível</Label>
            </div>
          </div>
          {submitError && (
            <div className="text-sm text-destructive border border-destructive/30 rounded-md p-2 bg-destructive/5">
              {submitError}
            </div>
          )}
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdate} disabled={submitting}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminCoursesTab
