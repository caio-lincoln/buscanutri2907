'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from '@/components/ui/pagination'
import {
  User,
  Briefcase,
  Building,
  Shield,
  MoreHorizontal,
  Search,
  Filter,
  CheckCircle,
  Trash2,
  XCircle,
  Loader2,
  FileText,
  Eye,
  ExternalLink,
  Download,
  Undo2,
} from 'lucide-react'
import { type UserData, type NutritionistDocument, getAllUsers, getNutritionistDocuments, approveNutritionist, rejectNutritionist, unverifyNutritionist } from '@/lib/admin-data-service'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { usePermissions } from '@/components/ui/permission-wrapper'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDateOnlyBR } from '@/lib/utils/format-date'

const userTypeIcons = {
  paciente: User,
  nutricionista: Briefcase,
  empresa: Building,
  admin: Shield,
}

const userStatusColors = {
  ativo: 'bg-green-100 text-green-700',
  inativo: 'bg-gray-100 text-gray-700',
  pendente: 'bg-yellow-100 text-yellow-700',
  suspenso: 'bg-orange-100 text-orange-700',
  banido: 'bg-red-100 text-red-700',
}

function unlockUIHard() {
  if (typeof document === 'undefined') return
  try {
    document.body.style.overflow = 'auto'
    document.body.style.pointerEvents = 'auto'
  } catch {}
  try {
    document.documentElement.classList.remove('overflow-hidden')
    document.body.classList.remove('overflow-hidden', 'pointer-events-none')
  } catch {}
}

type SafeActionResult<T = unknown> = {
  ok: boolean
  data?: T
  error?: string
}

async function runSafeAction<T>(
  actionKey: string,
  fn: () => Promise<T>,
): Promise<SafeActionResult<T>> {
  if (typeof window === 'undefined') {
    try {
      const data = await fn()
      return { ok: true, data }
    } catch (e: any) {
      return { ok: false, error: e?.message || 'UNKNOWN_ERROR' }
    }
  }

  const anyWindow = window as any
  if (anyWindow.__ACTION_LOCKS__?.[actionKey]) {
    return { ok: false, error: 'ACTION_LOCKED' }
  }

  anyWindow.__ACTION_LOCKS__ = anyWindow.__ACTION_LOCKS__ || {}
  anyWindow.__ACTION_LOCKS__[actionKey] = true

  try {
    unlockUIHard()
    const data = await fn()
    return { ok: true, data }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'UNKNOWN_ERROR' }
  } finally {
    anyWindow.__ACTION_LOCKS__[actionKey] = false
    unlockUIHard()
  }
}

function checkOverlaysDev(source: string) {
  if (typeof document === 'undefined') return
  if (typeof window === 'undefined') return
  if (process.env.NODE_ENV === 'production') return
  try {
    const overlays = document.querySelectorAll('[data-overlay="true"]')
    if (overlays.length > 1) {
      // eslint-disable-next-line no-console
      console.warn('[overlay-check]', {
        source,
        count: overlays.length,
        overlays,
      })
    }
  } catch {}
}

type ModalAction = 'ban' | 'delete' | null

type VerificationStatus = 'pendente' | 'verificado' | 'reprovado'

function getVerificationStatusFromProfile(profile: any | null, user: UserData): VerificationStatus {
  const raw = (profile?.verification_status as string | undefined) || ''
  const normalized = raw.toLowerCase()
  if (normalized === 'aprovado' || normalized === 'verificado') {
    return 'verificado'
  }
  if (normalized === 'reprovado' || normalized === 'rejected') {
    return 'reprovado'
  }
  if (profile?.is_verified || user.is_verified) {
    return 'verificado'
  }
  return 'pendente'
}

export function UsersTab() {
  const { hasPermission } = usePermissions()
  const canManageUsers = hasPermission('manage_users')
  
  // Estado para todos os usuários (cache local)
  const [ allUsers, setAllUsers ] = useState<UserData[]>([])
  // Estado para usuários filtrados
  const [ filteredUsers, setFilteredUsers ] = useState<UserData[]>([])
  
  const [ loading, setLoading ] = useState(true)
  const [ searchTerm, setSearchTerm ] = useState('')
  const [ filterType, setFilterType ] = useState<UserData[ 'type' ] | 'all'>('all')
  const [ filterStatus, setFilterStatus ] = useState<UserData[ 'status' ] | 'all'>('all')
  const [ currentPage, setCurrentPage ] = useState(1)
  const usersPerPage = 10
  
  const [ verifyModalOpen, setVerifyModalOpen ] = useState(false)
  const [ verifyOpening, setVerifyOpening ] = useState(false)
  const [ selectedUser, setSelectedUser ] = useState<UserData | null>(null)
  const [ modalOpen, setModalOpen ] = useState(false)
  const [ modalAction, setModalAction ] = useState<ModalAction>(null)
  const [ modalSubmitting, setModalSubmitting ] = useState(false)
  const [ uiRefreshKey, setUiRefreshKey ] = useState(0)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const users = await getAllUsers()
      setAllUsers(users)
    } finally {
      setLoading(false)
    }
  }

  const refreshUsersAndUi = async () => {
    await fetchUsers()
    setUiRefreshKey(prev => prev + 1)
  }

  useEffect(() => {
    void fetchUsers()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const id = window.setInterval(() => {
      if (verifyModalOpen) return
      if (typeof document === 'undefined') return
      const overflow = document.body.style.overflow
      const pointerEvents = document.body.style.pointerEvents
      if (overflow === 'hidden' || pointerEvents === 'none') {
        document.body.style.overflow = 'auto'
        document.body.style.pointerEvents = 'auto'
      }
    }, 500)
    return () => {
      window.clearInterval(id)
    }
  }, [verifyModalOpen])

  // Filtragem local eficiente
  useEffect(() => {
    let result = allUsers

    // Filtro de texto (nome, email, id)
    if (searchTerm.trim()) {
      const lowerTerm = searchTerm.toLowerCase().trim()
      result = result.filter(user => 
        user.name.toLowerCase().includes(lowerTerm) ||
        user.email.toLowerCase().includes(lowerTerm) ||
        user.id.toLowerCase().includes(lowerTerm) ||
        (user as any)?.numericId?.toString().includes(lowerTerm)
      )
    }

    // Filtro de tipo
    if (filterType !== 'all') {
      result = result.filter(user => user.type === filterType)
    }

    // Filtro de status
    if (filterStatus !== 'all') {
      result = result.filter(user => user.status === filterStatus)
    }

    setFilteredUsers(result)
  }, [allUsers, searchTerm, filterType, filterStatus])

  // Resetar página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterType, filterStatus])

  // Ajustar página se os dados mudarem e a página atual ficar vazia
  useEffect(() => {
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage) || 1
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [filteredUsers, usersPerPage])

  // Paginação dos usuários filtrados
  const totalUsersCount = filteredUsers.length
  const totalPages = Math.ceil(totalUsersCount / usersPerPage)
  const offset = (currentPage - 1) * usersPerPage
  const currentUsers = filteredUsers.slice(offset, offset + usersPerPage)

  const parseAdminResponse = async (res: Response) => {
    const contentType = res.headers.get('content-type') || ''
    let body: any = null
    let message = ''
    try {
      if (contentType.includes('application/json')) {
        body = await res.json()
        message =
          body?.error?.message ||
          body?.message ||
          res.statusText ||
          'Falha ao executar ação.'
      } else {
        const text = await res.text()
        body = text
        const trimmed = String(text || '').trim()
        message = trimmed.length > 0 ? trimmed.slice(0, 500) : res.statusText || 'Falha ao executar ação.'
      }
    } catch {
      message = res.statusText || 'Falha ao executar ação.'
    }
    return { message, body, contentType }
  }

  const execAdmin = async (
    action: string,
    url: string,
    options: RequestInit
  ): Promise<{ ok: boolean; edited: boolean; rowsAffected: number }> => {
    try {
      const res = await fetch(url, { ...options, credentials: 'include' })

      if (res.ok) {
        try {
          const ct = res.headers.get('content-type') || ''
          if (ct.includes('application/json')) {
            const j = await res.json()
            const data = j?.data ?? j

            if (typeof data?.ok === 'boolean') {
              if (!data.ok) {
                const msg =
                  (data.error && (data.error.message || data.error)) ||
                  data.message ||
                  `Falha na ação: auth=${String(data?.auth || '-')}, db=${String(
                    data?.db || '-'
                  )}`
                alert(String(msg))
                return { ok: false, edited: false, rowsAffected: 0 }
              }
              const edited =
                typeof data.edited === 'boolean'
                  ? data.edited
                  : typeof data.success === 'boolean'
                    ? data.success
                    : true
              const rowsAffected =
                typeof data.rowsAffected === 'number'
                  ? data.rowsAffected
                  : edited
                    ? 1
                    : 0
              return { ok: true, edited, rowsAffected }
            }

            if (typeof data?.success === 'boolean') {
              if (!data.success) {
                const msg =
                  data?.error?.message ||
                  data?.error ||
                  `Falha na ação: auth=${String(data?.auth || '-')}, db=${String(
                    data?.db || '-'
                  )}`
                alert(String(msg))
                return { ok: false, edited: false, rowsAffected: 0 }
              }
              return { ok: true, edited: true, rowsAffected: 1 }
            }

            return { ok: true, edited: true, rowsAffected: 1 }
          }

          return { ok: true, edited: true, rowsAffected: 1 }
        } catch {
          return { ok: true, edited: true, rowsAffected: 1 }
        }
      }

      const { message, body, contentType } = await parseAdminResponse(res)
      console.warn('Erro ao executar ação administrativa', {
        action,
        url,
        status: res.status,
        contentType,
        response: body,
      })
      alert(message)
      return { ok: false, edited: false, rowsAffected: 0 }
    } catch (err: any) {
      console.warn('Erro de rede ao executar ação administrativa', {
        action,
        url,
        error: err?.message || String(err),
      })
      alert('Erro de rede ao executar ação.')
      return { ok: false, edited: false, rowsAffected: 0 }
    }
  }

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  const getUserIdForOps = (user: UserData): string => {
    if (
      typeof user.id === 'string' &&
      user.id.trim().toLowerCase() !== 'undefined' &&
      user.id.trim().toLowerCase() !== 'null'
    ) {
      return user.id.trim()
    }
    const numeric = (user as any)?.numericId
    if (typeof numeric === 'number' && Number.isFinite(numeric)) return String(numeric)
    return ''
  }

  const openActionModal = (action: ModalAction, user: UserData) => {
    setSelectedUser(user)
    setModalAction(action)
    setModalOpen(true)
  }

  const closeActionModal = () => {
    setModalOpen(false)
    setTimeout(() => {
      setModalSubmitting(false)
      setModalAction(null)
      setSelectedUser(prev => (verifyModalOpen ? prev : null))
    }, 0)
  }

  const handleOpenVerify = (user: UserData) => {
    if (verifyOpening) return
    setVerifyOpening(true)
    setSelectedUser(user)
    setVerifyModalOpen(true)
  }

  const handleDeleteUser = (user: UserData) => {
    openActionModal('delete', user)
  }

  const handleBanUser = (user: UserData) => {
    openActionModal('ban', user)
  }

  const handleVerifyModalClose = () => {
    setVerifyModalOpen(false)
    setSelectedUser(null)
    setVerifyOpening(false)
  }

  const handleUserUpdated = async () => {
    await refreshUsersAndUi()
  }
 
  const handleActionSuccess = async (edited: boolean) => {
    if (edited) {
      await refreshUsersAndUi()
    }
    closeActionModal()
  }

  const handleConfirmDelete = async () => {
    if (!selectedUser) return
    if (modalSubmitting) return
    setModalSubmitting(true)
    try {
      const idForOps = getUserIdForOps(selectedUser)
      if (!idForOps) {
        toast({
          title: 'ID inválido',
          description: 'ID do usuário inválido. Recarregue a página e tente novamente.',
          variant: 'destructive',
        })
        return
      }

      const actionKey = `delete-user-${idForOps}`

      await runSafeAction(actionKey, async () => {
        const url = `/api/admin/users/${idForOps}/delete`
        const options: RequestInit = {
          method: 'DELETE',
          headers: { 'x-production-auth': 'liberar_producao' },
        }
        const result = await execAdmin('delete', url, options)
        if (!result.ok) return
        if (result.edited) {
          toast({
            title: 'Usuário excluído',
            description: 'O usuário foi removido com sucesso.',
          })
        } else {
          toast({
            title: 'Nenhuma alteração aplicada',
            description: 'O usuário já estava excluído ou inativo.',
          })
        }
        await handleActionSuccess(result.edited)
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setModalSubmitting(false)
    }
  }

  const handleConfirmBan = async () => {
    if (!selectedUser) return
    if (modalSubmitting) return
    setModalSubmitting(true)
    try {
      const idForOps = getUserIdForOps(selectedUser)
      if (!idForOps) {
        toast({
          title: 'ID inválido',
          description: 'ID do usuário inválido. Recarregue a página e tente novamente.',
          variant: 'destructive',
        })
        return
      }

      const isCurrentlyBanned = selectedUser.is_banned || selectedUser.status === 'banido'
      const action: 'ban' | 'unban' = isCurrentlyBanned ? 'unban' : 'ban'
      const actionKey = `ban-user-${idForOps}`

      await runSafeAction(actionKey, async () => {
        const res = await fetch('/api/admin/users/ban-toggle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            userId: idForOps,
            action,
          }),
        })

        const json = await res.json().catch(() => null)
        const data = json?.data ?? json

        if (!res.ok || (data && data.ok === false)) {
          const message =
            data?.error?.message ||
            data?.message ||
            (action === 'ban'
              ? 'Falha ao banir usuário. Tente novamente.'
              : 'Falha ao desbanir usuário. Tente novamente.')
          toast({
            title: 'Erro',
            description: message,
            variant: 'destructive',
          })
          return
        }

        toast({
          title: action === 'ban' ? 'Usuário banido' : 'Usuário desbanido',
          description:
            action === 'ban'
              ? 'O usuário foi banido e não poderá mais acessar a plataforma.'
              : 'O usuário foi desbanido e poderá voltar a acessar a plataforma.',
        })

        await handleActionSuccess(true)
      })
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setModalSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-[#1E1D40]">
          Gerenciamento de Usuários
        </h2>
        <Card className="border-0 shadow-lg">
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando usuários...
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-[#1E1D40]">
        Gerenciamento de Usuários
      </h2>

      <Card key={uiRefreshKey} className="border-0 shadow-lg">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4">
          <CardTitle className="text-xl font-semibold text-[#1E1D40]">
            Lista de Usuários ({totalUsersCount} total)
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1">
              <Input
                placeholder="Buscar por nome, email ou ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-lg border border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <Select
              value={filterType}
              onValueChange={value =>
                setFilterType(value as UserData[ 'type' ] | 'all')
              }
            >
              <SelectTrigger className="w-full sm:w-[180px] rounded-lg border border-gray-200 focus:ring-emerald-500 focus:border-emerald-500">
                <Filter className="h-4 w-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Filtrar por Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="paciente">Paciente</SelectItem>
                <SelectItem value="nutricionista">Nutricionista</SelectItem>
                <SelectItem value="empresa">Empresa</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filterStatus}
              onValueChange={value =>
                setFilterStatus(value as UserData[ 'status' ] | 'all')
              }
            >
              <SelectTrigger className="w-full sm:w-[180px] rounded-lg border border-gray-200 focus:ring-emerald-500 focus:border-emerald-500">
                <Filter className="h-4 w-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Filtrar por Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="suspenso">Suspenso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Verificado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-gray-500"
                    >
                      {allUsers.length > 0
                        ? 'Nenhum usuário encontrado com os filtros aplicados.'
                        : 'Nenhum usuário encontrado.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentUsers.map(user => {
                    const IconComponent = userTypeIcons[ user.type ]
                    return (
                      <TableRow key={user.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-700">
                          {typeof (user as any)?.numericId === 'number'
                            ? (user as any).numericId
                            : `${user.id.substring(0, 8)}...`}
                        </TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="capitalize flex items-center gap-1 w-fit"
                          >
                            <IconComponent className="h-3 w-3" />
                            {user.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`capitalize ${userStatusColors[user.status] || userStatusColors.ativo}`}
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {formatDateOnlyBR(user.createdAt)}
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {user.type === 'nutricionista' ? (
                            (() => {
                              const vStatus = getVerificationStatusFromProfile(user.nutritionist_profiles || null, user)
                              if (vStatus === 'verificado') {
                                return (
                                  <Badge className="bg-green-100 text-green-700">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verificado
                                  </Badge>
                                )
                              }
                              if (vStatus === 'reprovado') {
                                return (
                                  <Badge className="bg-red-100 text-red-700">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Reprovado
                                  </Badge>
                                )
                              }
                              return (
                                <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                                  Pendente
                                </Badge>
                              )
                            })()
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {canManageUsers && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleOpenVerify(user)}
                                  disabled={verifyModalOpen || verifyOpening}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" /> Verificar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleBanUser(user)}>
                                  <XCircle
                                    className={`h-4 w-4 mr-2 ${user.is_banned || user.status === 'banido' ? 'text-green-500' : 'text-red-500'}`}
                                  />
                                  {user.is_banned || user.status === 'banido' ? 'Desbanir' : 'Banir'}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteUser(user)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {totalUsersCount > usersPerPage && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={
                      currentPage === 1 ? 'pointer-events-none opacity-50' : ''
                    }
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      onClick={() => handlePageChange(i + 1)}
                      isActive={currentPage === i + 1}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={
                      currentPage === totalPages
                        ? 'pointer-events-none opacity-50'
                        : ''
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>

      {verifyModalOpen && selectedUser && (
        <AdminUserVerifyPanel
          open={verifyModalOpen}
          onOpenChange={open => {
            if (!open) handleVerifyModalClose()
            else if (!verifyModalOpen) setVerifyModalOpen(true)
          }}
          user={selectedUser}
          onUpdated={handleUserUpdated}
        />
      )}

      {modalOpen && selectedUser && modalAction && (
        <Dialog
          open={modalOpen}
          onOpenChange={open => {
            if (!open) closeActionModal()
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {modalAction === 'ban'
                  ? selectedUser.is_banned || selectedUser.status === 'banido'
                    ? 'Desbanir Usuário'
                    : 'Banir Usuário'
                  : 'Excluir Usuário'}
              </DialogTitle>
              <DialogDescription>
                {modalAction === 'ban' &&
                  (selectedUser.is_banned || selectedUser.status === 'banido'
                    ? 'Confirme o desbanimento do usuário. Ele poderá voltar a acessar a plataforma.'
                    : 'Confirme o banimento do usuário. Ele não poderá mais acessar a plataforma.')}
                {modalAction === 'delete' &&
                  'Confirme a exclusão do usuário. Esta ação é irreversível.'}
              </DialogDescription>
            </DialogHeader>

            {modalAction === 'ban' && (
              <div className="space-y-4 py-2">
                <p className="text-sm text-muted-foreground">
                  {selectedUser.is_banned || selectedUser.status === 'banido' ? (
                    <>
                      Tem certeza que deseja desbanir{' '}
                      <span className="font-semibold">{selectedUser.name}</span>? O usuário
                      poderá voltar a acessar a plataforma.
                    </>
                  ) : (
                    <>
                      Tem certeza que deseja banir{' '}
                      <span className="font-semibold">{selectedUser.name}</span>? O usuário
                      não poderá mais acessar a plataforma.
                    </>
                  )}
                </p>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={closeActionModal}
                    disabled={modalSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant={selectedUser.is_banned || selectedUser.status === 'banido' ? 'default' : 'destructive'}
                    onClick={handleConfirmBan}
                    disabled={modalSubmitting}
                  >
                    {modalSubmitting
                      ? selectedUser.is_banned || selectedUser.status === 'banido'
                        ? 'Desbanindo...'
                        : 'Processando...'
                      : selectedUser.is_banned || selectedUser.status === 'banido'
                        ? 'Confirmar desbanimento'
                        : 'Confirmar banimento'}
                  </Button>
                </div>
              </div>
            )}

            {modalAction === 'delete' && (
              <div className="space-y-4 py-2">
                <p className="text-sm text-muted-foreground">
                  Tem certeza que deseja excluir{' '}
                  <span className="font-semibold">{selectedUser.name}</span>? Esta ação
                  é irreversível.
                </p>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={closeActionModal}
                    disabled={modalSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleConfirmDelete}
                    disabled={modalSubmitting}
                  >
                    {modalSubmitting ? 'Excluindo...' : 'Confirmar exclusão'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

type AdminUserVerifyPanelProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserData
  onUpdated: () => Promise<void> | void
}

function AdminUserVerifyPanel({ open, onOpenChange, user, onUpdated }: AdminUserVerifyPanelProps) {
  const [tab, setTab] = useState<'summary' | 'edit' | 'docs'>('summary')
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('pendente')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [fullName, setFullName] = useState(user.name || '')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [userType, setUserType] = useState<UserData['type']>(user.type)
  const [password, setPassword] = useState('')
  const [docs, setDocs] = useState<NutritionistDocument[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [docsError, setDocsError] = useState<string | null>(null)
  const [docsLoaded, setDocsLoaded] = useState(false)
  const [crnApproveLoading, setCrnApproveLoading] = useState(false)
  const [crnUnverifyLoading, setCrnUnverifyLoading] = useState(false)
  const [crnRejectLoading, setCrnRejectLoading] = useState(false)
  const [crnReason, setCrnReason] = useState('')
  const [docStatusLoadingId, setDocStatusLoadingId] = useState<string | null>(null)
  const [viewerDoc, setViewerDoc] = useState<NutritionistDocument | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [initialValues, setInitialValues] = useState<{
    fullName: string
    phone: string
    location: string
    userType: UserData['type']
  } | null>(null)

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
      document.body.style.pointerEvents = 'auto'
    }
  }, [])

  useEffect(() => {
    if (!open) {
      setProfile(null)
      setProfileError(null)
      setErrors({})
      setSaving(false)
      setPassword('')
      setDocs([])
      setDocsError(null)
      setDocsLoaded(false)
      setLoadingDocs(false)
      setIsEditing(false)
      setInitialValues(null)
      return
    }

    setTab('summary')
    setFullName(user.name || '')
    setUserType(user.type)
    setPhone('')
    setLocation('')
    setPassword('')
    setErrors({})

    const fetchProfile = async () => {
      setLoadingProfile(true)
      setProfileError(null)
      try {
        const idForOps =
          typeof user.id === 'string' &&
          user.id.trim().toLowerCase() !== 'undefined' &&
          user.id.trim().toLowerCase() !== 'null'
            ? user.id.trim()
            : typeof (user as any).numericId === 'number' && Number.isFinite((user as any).numericId)
              ? String((user as any).numericId)
              : ''

        if (!idForOps) {
          setProfileError('ID de usuário inválido')
          return
        }

        const url = `/api/admin/users/${idForOps}/profile`
        const res = await fetch(url, { credentials: 'include' })
        if (!res.ok) {
          setProfileError('Falha ao carregar perfil do usuário')
          return
        }

        const json = await res.json().catch(() => null)
        const data = json?.data ?? json
        if (!data) {
          setProfileError('Resposta inválida ao carregar perfil')
          return
        }

        if (data.error) {
          setProfileError(typeof data.error === 'string' ? data.error : data.error.message || 'Erro ao carregar perfil')
          return
        }

        const nextProfile = data.profile || null
        setProfile(nextProfile)

        const baseName =
          data.profile?.full_name || data.profile?.company_name || user.name || user.email.split('@')[0] || ''
        const profilePhone = data.profile?.phone || ''
        const formattedPhone = formatPhoneDisplay(profilePhone)
        const profileLocation =
          data.profile?.location || data.profile?.address || data.profile?.city || data.profile?.state || ''

        setFullName(baseName)
        setPhone(formattedPhone)
        setLocation(profileLocation || '')
        setInitialValues({
          fullName: baseName,
          phone: formattedPhone,
          location: profileLocation || '',
          userType: user.type,
        })
        setVerificationStatus(getVerificationStatusFromProfile(nextProfile, user))
      } catch (e) {
        setProfileError('Falha ao carregar perfil do usuário. Tente novamente.')
      } finally {
        setLoadingProfile(false)
      }
    }

    fetchProfile()
  }, [open, user.id, user.email, user.name, user.type])

  useEffect(() => {
    if (!open) return
    if (tab !== 'docs') return
    if (userType !== 'nutricionista') return
    if (docsLoaded) return

    const loadDocs = async () => {
      setLoadingDocs(true)
      setDocsError(null)
      try {
        const idForOps =
          typeof user.id === 'string' &&
          user.id.trim().toLowerCase() !== 'undefined' &&
          user.id.trim().toLowerCase() !== 'null'
            ? user.id.trim()
            : typeof (user as any).numericId === 'number' && Number.isFinite((user as any).numericId)
              ? String((user as any).numericId)
              : ''

        if (!idForOps) {
          setDocsError('ID de usuário inválido')
          return
        }

        const documents = await getNutritionistDocuments(idForOps)
        setDocs(documents)
        setDocsLoaded(true)
      } catch {
        setDocsError('Falha ao carregar documentos do usuário. Tente novamente.')
      } finally {
        setLoadingDocs(false)
      }
    }

    void loadDocs()
  }, [open, tab, user.id, userType, docsLoaded])

  const handleClose = () => {
    if (saving) return
    onOpenChange(false)
  }

  const displayStatus = useMemo(() => {
    if (user.status === 'banido') return 'Banido'
    if (user.status === 'inativo') return 'Inativo'
    if (user.status === 'pendente') return 'Pendente'
    return 'Ativo'
  }, [user.status])

  const displayType = useMemo(() => {
    if (userType === 'nutricionista') return 'Nutricionista'
    if (userType === 'paciente') return 'Paciente'
    if (userType === 'empresa') return 'Empresa'
    return userType
  }, [userType])

  const profileDocs = useMemo(() => {
    if (!profile) return []
    const items: { key: string; label: string; url: string }[] = []
    if (profile.identity_document_url) {
      items.push({ key: 'identity', label: 'Documento de identidade', url: profile.identity_document_url as string })
    }
    if (profile.rg_document_url) {
      items.push({ key: 'rg', label: 'RG', url: profile.rg_document_url as string })
    }
    if (profile.cpf_document_url) {
      items.push({ key: 'cpf', label: 'CPF', url: profile.cpf_document_url as string })
    }
    if (profile.crn_document_url) {
      items.push({ key: 'crn', label: 'Documento CRN', url: profile.crn_document_url as string })
    }
    if (profile.curriculum_pdf_url) {
      items.push({ key: 'cv', label: 'Currículo', url: profile.curriculum_pdf_url as string })
    }
    return items
  }, [profile])

  const crnStatusLabel = useMemo(() => {
    if (!profile) return 'Indisponível'
    if (verificationStatus === 'verificado') return 'Verificado'
    if (verificationStatus === 'reprovado') return 'Reprovado'
    return 'Pendente'
  }, [profile, verificationStatus])

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneDisplay(value)
    setPhone(formatted)
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    const trimmedName = fullName.trim()
    const nameWords = trimmedName.split(/\s+/).filter(Boolean)
    const nameChars = trimmedName.replace(/\s+/g, '')
    if (!trimmedName || nameWords.length < 2 || nameChars.length < 3) {
      nextErrors.name = 'Informe nome completo com pelo menos 2 palavras'
    }

    const digits = phone.replace(/\D/g, '')
    if (!digits) {
      nextErrors.phone = 'Informe o telefone'
    } else if (digits.length < 10 || digits.length > 11) {
      nextErrors.phone = 'Telefone inválido'
    }

    if (!location || location.trim().length < 2) {
      nextErrors.location = 'Informe a localização'
    }

    if (!userType) {
      nextErrors.userType = 'Selecione o tipo de usuário'
    }

    if (password) {
      const hasLetter = /[A-Za-z]/.test(password)
      const hasNumber = /\d/.test(password)
      if (password.length < 8 || !hasLetter || !hasNumber) {
        nextErrors.password = 'Senha deve ter ao menos 8 caracteres, letra e número'
      }
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleStartEdit = () => {
    setIsEditing(true)
    setTab('edit')
    setInitialValues({
      fullName,
      phone,
      location,
      userType,
    })
    setErrors({})
    setPassword('')
  }

  const handleCancelEdit = () => {
    if (initialValues) {
      setFullName(initialValues.fullName)
      setPhone(initialValues.phone)
      setLocation(initialValues.location)
      setUserType(initialValues.userType)
    }
    setErrors({})
    setPassword('')
    setIsEditing(false)
    setTab('summary')
  }

  const handleSave = async () => {
    if (!validate()) return
    const idForOps =
      typeof user.id === 'string' &&
      user.id.trim().toLowerCase() !== 'undefined' &&
      user.id.trim().toLowerCase() !== 'null'
        ? user.id.trim()
        : typeof (user as any).numericId === 'number' && Number.isFinite((user as any).numericId)
          ? String((user as any).numericId)
          : ''

    if (!idForOps) {
      setErrors(prev => ({ ...prev, root: 'ID de usuário inválido' }))
      return
    }

    setSaving(true)
    setErrors(prev => {
      const { root: _root, ...rest } = prev
      return rest
    })

    try {
      const actionKey = `update-user-${idForOps}`

      await runSafeAction(actionKey, async () => {
        const phoneDigits = phone.replace(/\D/g, '')
        const payload: any = {
          name: fullName.trim(),
          user_type: userType,
          phone: phoneDigits || undefined,
          location: location.trim() || undefined,
        }

        const res = await fetch(`/api/admin/users/${idForOps}/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        })

        const json = await res.json().catch(() => null)
        const data = json?.data ?? json

        if (!res.ok || (data && (data.ok === false || data.success === false))) {
          const message =
            data?.error?.message ||
            data?.error ||
            data?.message ||
            'Falha ao atualizar usuário. Tente novamente.'
          console.error('Erro ao atualizar usuário', { status: res.status, data })
          toast({
            title: 'Erro ao salvar',
            description: message,
            variant: 'destructive',
          })
          setSaving(false)
          return
        }

        if (password) {
          const resPassword = await fetch(`/api/admin/users/${idForOps}/password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ password }),
          })

          const jsonPassword = await resPassword.json().catch(() => null)
          const dataPassword = jsonPassword?.data ?? jsonPassword

          if (!resPassword.ok || (dataPassword && (dataPassword.ok === false || dataPassword.success === false))) {
            const message =
              dataPassword?.error?.message ||
              dataPassword?.error ||
              dataPassword?.message ||
              'Falha ao alterar senha. Tente novamente.'
            console.error('Erro ao alterar senha do usuário', { status: resPassword.status, data: dataPassword })
            toast({
              title: 'Erro ao alterar senha',
              description: message,
              variant: 'destructive',
            })
            setSaving(false)
            return
          }
        }

        toast({
          title: 'Usuário atualizado',
          description: password ? 'Dados e senha atualizados com sucesso.' : 'Dados atualizados com sucesso.',
        })

        try {
          await onUpdated()
        } catch (e) {}

        setPassword('')
        setInitialValues({
          fullName: fullName.trim(),
          phone,
          location: location.trim(),
          userType,
        })
        setIsEditing(false)
        setTab('summary')
        setSaving(false)
      })
    } catch (e) {
      toast({
        title: 'Erro ao salvar',
        description: 'Falha ao atualizar usuário. Tente novamente.',
        variant: 'destructive',
      })
      setSaving(false)
    }
  }

  const handleOpenDoc = (doc: NutritionistDocument) => {
    if (!doc.public_url) return
    setViewerDoc(doc)
    setViewerOpen(true)
  }

  const handleOpenDocInNewTab = (doc: NutritionistDocument) => {
    if (!doc.public_url) return
    try {
      window.open(doc.public_url, '_blank', 'noopener,noreferrer')
    } catch {
    }
  }

  const updateDocStatus = async (docId: string, status: 'pending' | 'verified' | 'rejected') => {
    setDocStatusLoadingId(docId)
    try {
      const actionKey = `doc-status-${docId}`
      await runSafeAction(actionKey, async () => {
        const res = await fetch(`/api/admin/documents/${docId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ status }),
        })
        const json = await res.json().catch(() => null)
        if (!res.ok || !json?.ok) {
          const message = json?.message || 'Falha ao atualizar status do documento.'
          toast({
            title: 'Erro ao atualizar documento',
            description: message,
            variant: 'destructive',
          })
          return
        }
        const updated = json.document as NutritionistDocument
        setDocs(prev =>
          prev.map(doc => (doc.id === docId ? { ...doc, ...updated, public_url: doc.public_url || updated.public_url } : doc)),
        )
      })
    } catch (e) {
      toast({
        title: 'Erro ao atualizar documento',
        description: 'Falha ao atualizar status do documento. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setDocStatusLoadingId(null)
    }
  }

  const handleCrnApprove = async () => {
    if (!profile?.id) return
    try {
      setCrnApproveLoading(true)
      const actionKey = `crn-approve-${profile.id as string}`
      await runSafeAction(actionKey, async () => {
        const ok = await approveNutritionist(profile.id as string)
        if (!ok) {
          toast({
            title: 'Erro ao aprovar nutricionista',
            description: 'Falha ao aprovar nutricionista. Tente novamente.',
            variant: 'destructive',
          })
          return
        }
        toast({
          title: 'Nutricionista aprovado',
          description: 'O nutricionista foi marcado como verificado.',
        })
        setProfile(prev => (prev ? { ...prev, is_verified: true, verification_status: 'aprovado' } : prev))
        setVerificationStatus('verificado')
        try {
          await onUpdated()
        } catch (e) {}
      })
    } finally {
      setCrnApproveLoading(false)
      checkOverlaysDev('crn-approve')
    }
  }

  const handleCrnUnverify = async () => {
    if (!profile?.id) return
    try {
      setCrnUnverifyLoading(true)
      const actionKey = `crn-unverify-${profile.id as string}`
      await runSafeAction(actionKey, async () => {
        const ok = await unverifyNutritionist(profile.id as string)
        if (!ok) {
          toast({
            title: 'Erro ao alterar status',
            description: 'Falha ao voltar para pendente. Tente novamente.',
            variant: 'destructive',
          })
          return
        }
        toast({
          title: 'Status atualizado',
          description: 'O nutricionista foi marcado como pendente.',
        })
        setProfile(prev => (prev ? { ...prev, is_verified: false, verification_status: 'pendente' } : prev))
        setVerificationStatus('pendente')
        try {
          await onUpdated()
        } catch (e) {}
      })
    } finally {
      setCrnUnverifyLoading(false)
      checkOverlaysDev('crn-unverify')
    }
  }

  const handleCrnReject = async () => {
    if (!profile?.id) return
    try {
      setCrnRejectLoading(true)
      const actionKey = `crn-reject-${profile.id as string}`
      await runSafeAction(actionKey, async () => {
        const reason = crnReason.trim() || 'Sem motivo informado'
        const ok = await rejectNutritionist(profile.id as string, reason)
        if (!ok) {
          toast({
            title: 'Erro ao rejeitar nutricionista',
            description: 'Falha ao rejeitar nutricionista. Tente novamente.',
            variant: 'destructive',
          })
          return
        }
        toast({
          title: 'Nutricionista rejeitado',
          description: 'A rejeição foi registrada.',
        })
        setProfile(prev => (prev ? { ...prev, is_verified: false, verification_status: 'reprovado' } : prev))
        setVerificationStatus('reprovado')
        try {
          await onUpdated()
        } catch (e) {}
      })
    } finally {
      setCrnRejectLoading(false)
      checkOverlaysDev('crn-reject')
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Verificar usuário</SheetTitle>
          <SheetDescription>Revise e edite os dados antes de concluir a verificação.</SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {user.is_banned && (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
              <div className="font-semibold mb-1">Este usuário está BANIDO do sistema.</div>
              <div className="text-xs space-y-1">
                {user.banned_at && (
                  <div>
                    Banido em: <span className="font-medium">{formatDateOnlyBR(user.banned_at)}</span>
                  </div>
                )}
                {user.banned_reason && (
                  <div>
                    Motivo: <span className="font-medium">{user.banned_reason}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 border rounded-md p-3 bg-muted/50">
            <div className="text-sm font-medium">{fullName || user.name || user.email}</div>
            <div className="text-xs text-muted-foreground break-all">{user.email}</div>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">{displayType}</Badge>
              <Badge variant={user.is_banned || user.status === 'banido' ? 'destructive' : 'secondary'}>
                {displayStatus}
              </Badge>
              {user.type === 'nutricionista' && (
                <Badge variant={verificationStatus === 'verificado' ? 'default' : verificationStatus === 'reprovado' ? 'destructive' : 'outline'}>
                  {verificationStatus === 'verificado'
                    ? 'Verificado'
                    : verificationStatus === 'reprovado'
                      ? 'Reprovado'
                      : 'Pendente'}
                </Badge>
              )}
            </div>
          </div>

          <Tabs value={tab} onValueChange={v => setTab(v as 'summary' | 'edit' | 'docs')}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="summary">1. Resumo</TabsTrigger>
              <TabsTrigger value="edit">2. Editar</TabsTrigger>
              <TabsTrigger value="docs">3. Documentos</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="mt-4 space-y-4">
              {loadingProfile ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              ) : profileError ? (
                <Alert variant="destructive">
                  <AlertTitle>Erro ao carregar</AlertTitle>
                  <AlertDescription>{profileError}</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Nome completo</span>
                    <span className="font-medium max-w-[60%] text-right truncate">
                      {fullName || user.name || 'Não informado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Telefone</span>
                    <span className="font-medium max-w-[60%] text-right truncate">
                      {phone || profile?.phone || 'Não informado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Localização</span>
                    <span className="font-medium max-w-[60%] text-right truncate">
                      {location ||
                        profile?.location ||
                        profile?.address ||
                        profile?.city ||
                        profile?.state ||
                        'Não informado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tipo de usuário</span>
                    <span className="font-medium">{displayType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">E-mail</span>
                    <span className="font-medium max-w-[60%] text-right truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium">{displayStatus}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Criado em</span>
                    <span className="font-medium">{formatDateOnlyBR(user.createdAt)}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between gap-2 pt-4">
                <Button variant="outline" onClick={handleClose}>
                  Fechar
                </Button>
                <Button onClick={handleStartEdit}>Editar dados</Button>
              </div>
            </TabsContent>

            <TabsContent value="edit" className="mt-4 space-y-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="fullName">Nome completo</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    disabled={saving || !isEditing}
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={e => handlePhoneChange(e.target.value)}
                    disabled={saving || !isEditing}
                    placeholder="(11) 99999-9999"
                  />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="location">Localização</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    disabled={saving || !isEditing}
                    placeholder="Cidade/estado ou endereço"
                  />
                  {errors.location && <p className="text-xs text-destructive">{errors.location}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="userType">Tipo de usuário</Label>
                  <Select
                    value={userType}
                    onValueChange={value => setUserType(value as UserData['type'])}
                    disabled={saving || !isEditing}
                  >
                    <SelectTrigger id="userType">
                      <SelectValue placeholder="Selecione um tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paciente">Paciente</SelectItem>
                      <SelectItem value="nutricionista">Nutricionista</SelectItem>
                      <SelectItem value="empresa">Empresa</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.userType && <p className="text-xs text-destructive">{errors.userType}</p>}
                </div>

                <Separator />

                <div className="space-y-1">
                  <Label htmlFor="password">Nova senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={saving || !isEditing}
                    placeholder="Deixe em branco para não alterar"
                  />
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>
              </div>

              {errors.root && <p className="text-xs text-destructive">{errors.root}</p>}

              <div className="flex justify-between gap-2 pt-4">
                <Button variant="outline" type="button" onClick={handleCancelEdit} disabled={saving}>
                  Cancelar edição
                </Button>
                <Button type="button" onClick={handleSave} disabled={saving || !isEditing}>
                  {saving ? 'Salvando...' : 'Salvar alterações'}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="docs" className="mt-4 space-y-4">
              {userType !== 'nutricionista' && !profile && (
                <p className="text-sm text-muted-foreground">
                  Documentos detalhados ainda não estão configurados para este tipo de usuário.
                </p>
              )}

              <Accordion type="multiple" className="w-full">
                <AccordionItem value="user-docs">
                  <AccordionTrigger>Documentos do usuário</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {profile && (profile.profile_image_url || profile.avatar_url) && (
                        <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage
                                src={
                                  (profile.profile_image_url as string | undefined) ||
                                  (profile.avatar_url as string | undefined) ||
                                  undefined
                                }
                              />
                              <AvatarFallback>
                                {(profile.full_name as string | undefined)?.[0]?.toUpperCase() ||
                                  (user.name?.[0]?.toUpperCase() ?? user.email[0]?.toUpperCase() ?? 'U')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">Foto de perfil</div>
                              <div className="text-xs text-muted-foreground">Imagem atual do perfil do usuário</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                            >
                              <a
                                href={
                                  ((profile.profile_image_url as string | undefined) ||
                                    (profile.avatar_url as string | undefined) ||
                                    '') as string
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="mr-1 h-3 w-3" />
                                Abrir
                              </a>
                            </Button>
                          </div>
                        </div>
                      )}

                      {profileDocs.length === 0 && !(profile && (profile.profile_image_url || profile.avatar_url)) ? (
                        <p className="text-sm text-muted-foreground">Nenhum documento cadastrado no perfil.</p>
                      ) : null}

                      {profileDocs.length > 0 && (
                        <div className="space-y-2">
                          {profileDocs.map(doc => (
                            <div
                              key={doc.key}
                              className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span>{doc.label}</span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  asChild
                                >
                                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-1 h-3 w-3" />
                                    Abrir
                                  </a>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {userType === 'nutricionista' && (
                  <AccordionItem value="crn">
                    <AccordionTrigger>Registro profissional (CRN)</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">CRN</span>
                          <span className="font-medium">{profile?.crn || 'Não informado'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Status de verificação</span>
                          <Badge variant={verificationStatus === 'verificado' ? 'default' : 'outline'}>
                            {crnStatusLabel}
                          </Badge>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                <AccordionItem value="addresses">
                  <AccordionTrigger>Endereços</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Endereço principal</span>
                        <span className="max-w-[70%] text-right font-medium">
                          {profile?.location ||
                            profile?.address ||
                            profile?.city ||
                            profile?.state ||
                            location ||
                            'Não informado'}
                        </span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {userType === 'nutricionista' && (
                  <AccordionItem value="attachments">
                    <AccordionTrigger>Anexos e certificados</AccordionTrigger>
                    <AccordionContent>
                      {loadingDocs ? (
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-2/3" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      ) : docsError ? (
                        <Alert variant="destructive">
                          <AlertTitle>Erro ao carregar documentos</AlertTitle>
                          <AlertDescription>{docsError}</AlertDescription>
                        </Alert>
                      ) : docs.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Nenhum documento foi enviado pelo nutricionista até o momento.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {docs.map(doc => {
                            const statusLabel =
                              doc.is_verified === true
                                ? 'Verificado'
                                : doc.verification_notes
                                  ? 'Reprovado'
                                  : 'Pendente'
                            return (
                              <div
                                key={doc.id}
                                className="flex flex-col gap-2 rounded-md border p-3 text-sm"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <div className="font-medium">
                                        {doc.title || doc.file_name}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {doc.document_type === 'crn_proof'
                                          ? 'Comprovante CRN'
                                          : 'Certificado'}
                                      </div>
                                    </div>
                                  </div>
                                  <Badge variant="outline">{statusLabel}</Badge>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                                  {doc.created_at && (
                                    <span>Envio: {formatDateOnlyBR(doc.created_at)}</span>
                                  )}
                                  {typeof doc.file_size === 'number' && (
                                    <span>Tamanho: {formatFileSize(doc.file_size)}</span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 pt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    type="button"
                                    onClick={() => handleOpenDoc(doc)}
                                    disabled={!doc.public_url}
                                  >
                                    <Eye className="mr-1 h-3 w-3" />
                                    Visualizar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    type="button"
                                    onClick={() => handleOpenDocInNewTab(doc)}
                                    disabled={!doc.public_url}
                                  >
                                    <ExternalLink className="mr-1 h-3 w-3" />
                                    Abrir em nova guia
                                  </Button>
                                  {doc.public_url && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      asChild
                                    >
                                      <a
                                        href={doc.public_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download
                                      >
                                        <Download className="mr-1 h-3 w-3" />
                                        Baixar
                                      </a>
                                    </Button>
                                  )}
                                  <div className="ml-auto flex gap-2">
                                    <Button
                                      size="sm"
                                      type="button"
                                      variant="outline"
                                      onClick={() => updateDocStatus(doc.id, 'pending')}
                                      disabled={docStatusLoadingId === doc.id}
                                    >
                                      Pendente
                                    </Button>
                                    <Button
                                      size="sm"
                                      type="button"
                                      variant="outline"
                                      onClick={() => updateDocStatus(doc.id, 'verified')}
                                      disabled={docStatusLoadingId === doc.id}
                                    >
                                      Verificar
                                    </Button>
                                    <Button
                                      size="sm"
                                      type="button"
                                      variant="destructive"
                                      onClick={() => updateDocStatus(doc.id, 'rejected')}
                                      disabled={docStatusLoadingId === doc.id}
                                    >
                                      Reprovar
                                    </Button>
                                  </div>
                                </div>
                                {doc.verification_notes && (
                                  <p className="text-xs text-muted-foreground">
                                    Observação: {doc.verification_notes}
                                  </p>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>

              {userType === 'nutricionista' && (
                <div className="sticky bottom-0 mt-4 pt-4 bg-background border-t">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Ações de verificação</div>
                      <div className="text-xs text-muted-foreground">
                        Status atual:{' '}
                        {verificationStatus === 'pendente'
                          ? 'Pendente'
                          : verificationStatus === 'verificado'
                            ? 'Verificado'
                            : 'Reprovado'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <Label htmlFor="crnReason">Motivo/observação (para rejeição)</Label>
                        <Input
                          id="crnReason"
                          value={crnReason}
                          onChange={e => setCrnReason(e.target.value)}
                          disabled={crnApproveLoading || crnUnverifyLoading || crnRejectLoading}
                          placeholder="Opcional"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        {verificationStatus === 'pendente' && (
                          <>
                            <Button
                              size="lg"
                              type="button"
                              onClick={handleCrnApprove}
                              disabled={crnApproveLoading || crnUnverifyLoading || crnRejectLoading}
                              className="flex-1 justify-center"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              {crnApproveLoading ? 'Processando...' : 'Aprovar usuário'}
                            </Button>
                            <Button
                              size="lg"
                              type="button"
                              variant="destructive"
                              onClick={handleCrnReject}
                              disabled={crnApproveLoading || crnUnverifyLoading || crnRejectLoading}
                              className="flex-1 justify-center"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              {crnRejectLoading ? 'Processando...' : 'Reprovar usuário'}
                            </Button>
                          </>
                        )}
                        {(verificationStatus === 'verificado' || verificationStatus === 'reprovado') && (
                          <Button
                            size="lg"
                            type="button"
                            variant="outline"
                            onClick={handleCrnUnverify}
                            disabled={crnApproveLoading || crnUnverifyLoading || crnRejectLoading}
                            className="flex-1 justify-center"
                          >
                            <Undo2 className="mr-2 h-4 w-4" />
                            {crnUnverifyLoading ? 'Processando...' : 'Voltar para pendente'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>{viewerDoc?.title || viewerDoc?.file_name || 'Documento'}</DialogTitle>
                  </DialogHeader>
                  {viewerDoc?.public_url && (
                    <div className="mt-2 h-[60vh]">
                      {viewerDoc.public_url.toLowerCase().includes('.pdf') ? (
                        <iframe
                          src={viewerDoc.public_url}
                          className="h-full w-full rounded-md border"
                        />
                      ) : (
                        <img
                          src={viewerDoc.public_url}
                          alt={viewerDoc.title || viewerDoc.file_name}
                          className="h-full w-full rounded-md object-contain"
                        />
                      )}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function formatPhoneDisplay(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function formatFileSize(bytes: number | null | undefined) {
  if (!bytes || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`
}
