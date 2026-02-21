'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Edit,
  Trash2,
  XCircle,
  Loader2,
} from 'lucide-react'
import { type UserData } from '@/lib/admin-data-service'
import { VerifyNutritionistModal } from './VerifyNutritionistModal'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { usePermissions } from '@/components/ui/permission-wrapper'
import { getAllUsers } from '@/lib/admin-data-service'

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
  suspenso: 'bg-red-100 text-red-700',
}

type ModalAction = 'edit' | 'ban' | 'delete' | null

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
  const [ selectedUser, setSelectedUser ] = useState<UserData | null>(null)
  const [ modalOpen, setModalOpen ] = useState(false)
  const [ modalAction, setModalAction ] = useState<ModalAction>(null)
  const [ modalSubmitting, setModalSubmitting ] = useState(false)
  const [ uiRefreshKey, setUiRefreshKey ] = useState(0)

  const [ modalEmail, setModalEmail ] = useState('')
  const [ modalName, setModalName ] = useState('')
  const [ modalType, setModalType ] = useState<UserData['type']>('paciente')
  const [ modalVerified, setModalVerified ] = useState(false)

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
    if (modalOpen && modalAction === 'edit' && selectedUser) {
      setModalEmail(selectedUser.email || '')
      setModalName(selectedUser.name || '')
      setModalType(selectedUser.type)
      const initialVerified =
        selectedUser.type === 'nutricionista'
          ? !!selectedUser.nutritionist_profiles?.is_verified
          : selectedUser.type === 'empresa'
            ? !!(selectedUser as any).is_verified
            : false
      setModalVerified(initialVerified)
    }
  }, [modalOpen, modalAction, selectedUser])

  const nameLabel = useMemo(() => {
    switch (modalType) {
      case 'empresa':
        return 'Nome da empresa'
      case 'nutricionista':
        return 'Nome completo'
      default:
        return 'Nome completo'
    }
  }, [modalType])

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
    setSelectedUser(user)
    setVerifyModalOpen(true)
  }

  const handleEditUser = (user: UserData) => {
    openActionModal('edit', user)
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
    setUiRefreshKey(prev => prev + 1)
    document.body.classList.remove('overflow-hidden', 'modal-open')
    document.body.style.pointerEvents = 'auto'
    document.body.style.overflow = 'auto'
    setTimeout(() => {
      document.body.classList.remove('overflow-hidden', 'modal-open')
      document.body.style.pointerEvents = 'auto'
      document.body.style.overflow = 'auto'
    }, 100)
  }

  const handleUserApproved = async () => {
    await refreshUsersAndUi()
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

  const handleConfirmEdit = async () => {
    if (!selectedUser) return

    const hasChanges =
      (modalEmail && modalEmail !== selectedUser.email) ||
      (modalName && modalName !== selectedUser.name) ||
      (modalType && modalType !== selectedUser.type) ||
      (modalType === 'nutricionista' || modalType === 'empresa'
        ? modalVerified !==
          (modalType === 'nutricionista'
            ? !!selectedUser.nutritionist_profiles?.is_verified
            : !!(selectedUser as any).is_verified)
        : false)

    if (!hasChanges) {
      toast({
        title: 'Nenhuma alteração detectada',
        description: 'Os dados do usuário já estavam iguais.',
      })
      closeActionModal()
      return
    }

    setModalSubmitting(true)
    try {
      const payload: Record<string, any> = {}
      if (modalEmail && modalEmail !== selectedUser.email) payload['email'] = modalEmail
      if (modalType && modalType !== selectedUser.type) payload['user_type'] = modalType
      if (modalName && modalName !== selectedUser.name) payload['name'] = modalName
      if (modalType === 'nutricionista' || modalType === 'empresa') payload['is_verified'] = modalVerified
      payload['production_auth'] = 'liberar_producao'

      const res = await fetch(`/api/admin/users/${selectedUser.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-production-auth': 'liberar_producao' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const j = await res.json().catch(() => ({}))
      const data = j?.data ?? j

      if (!res.ok) {
        const msg =
          (j?.error && (j?.error?.message || j?.error)) ||
          j?.message ||
          data?.error ||
          'Falha ao atualizar usuário'
        throw new Error(String(msg))
      }

      if (data && data.ok === false) {
        const msg =
          (data.error && (data.error.message || data.error)) ||
          data.message ||
          'Falha ao atualizar usuário'
        throw new Error(String(msg))
      }

      const edited =
        typeof data?.edited === 'boolean'
          ? data.edited
          : typeof data?.success === 'boolean'
            ? data.success
            : true

      if (edited) {
        toast({
          title: 'Usuário atualizado',
          description: 'As alterações foram salvas com sucesso.',
        })
      } else {
        toast({
          title: 'Nenhuma alteração detectada',
          description: 'Os dados do usuário já estavam iguais.',
        })
      }

      await handleActionSuccess(edited)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setModalSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedUser) return
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
      const url = `/api/admin/users/${idForOps}/deactivate`
      const options: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-production-auth': 'liberar_producao',
        },
        body: JSON.stringify({ duration: '720h', production_auth: 'liberar_producao' }),
      }
      const result = await execAdmin('deactivate', url, options)
      if (!result.ok) return
      if (result.edited) {
        toast({
          title: 'Usuário banido',
          description: 'O usuário foi desativado e não poderá mais acessar a plataforma.',
        })
      } else {
        toast({
          title: 'Nenhuma alteração aplicada',
          description: 'O status de acesso do usuário já estava igual.',
        })
      }
      await handleActionSuccess(result.edited)
    } catch (err: any) {
      toast({
        title: 'Erro ao banir',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setModalSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
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
                            className={`capitalize ${userStatusColors[ user.status ]}`}
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {user.type === 'nutricionista' ? (
                            user?.nutritionist_profiles?.is_verified ? (
                              <Badge className="bg-green-100 text-green-700">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verificado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                                Pendente
                              </Badge>
                            )
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
                                <DropdownMenuItem onClick={() => handleOpenVerify(user)}>
                                  <CheckCircle className="h-4 w-4 mr-2" /> Verificar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                  <Edit className="h-4 w-4 mr-2" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleBanUser(user)}>
                                  <XCircle className="h-4 w-4 mr-2 text-red-500" /> Banir
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

      {selectedUser && verifyModalOpen && (
        <VerifyNutritionistModal
          key={selectedUser.id}
          open={verifyModalOpen}
          onOpenChange={handleVerifyModalClose}
          user={{
            id: selectedUser.id,
            email: selectedUser.email,
            name: selectedUser.name,
            type: selectedUser.type,
            nutritionistProfileId: selectedUser.nutritionist_profiles?.id,
          }}
          onApproved={handleUserApproved}
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
                {modalAction === 'edit'
                  ? 'Editar Usuário'
                  : modalAction === 'ban'
                    ? 'Banir Usuário'
                    : 'Excluir Usuário'}
              </DialogTitle>
              <DialogDescription>
                {modalAction === 'edit' &&
                  'Atualize informações básicas e status de verificação.'}
                {modalAction === 'ban' &&
                  'Confirme o banimento do usuário. Ele não poderá mais acessar a plataforma.'}
                {modalAction === 'delete' &&
                  'Confirme a exclusão do usuário. Esta ação é irreversível.'}
              </DialogDescription>
            </DialogHeader>

            {modalAction === 'edit' && (
              <div className="space-y-4 py-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="admin-user-email">
                    Email
                  </label>
                  <Input
                    id="admin-user-email"
                    value={modalEmail}
                    onChange={e => setModalEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="admin-user-name">
                    {nameLabel}
                  </label>
                  <Input
                    id="admin-user-name"
                    value={modalName}
                    onChange={e => setModalName(e.target.value)}
                    placeholder={nameLabel}
                  />
                </div>
                <div className="grid gap-2">
                  <span className="text-sm font-medium">Tipo de usuário</span>
                  <Select value={modalType} onValueChange={v => setModalType(v as UserData['type'])}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paciente">Paciente</SelectItem>
                      <SelectItem value="nutricionista">Nutricionista</SelectItem>
                      <SelectItem value="empresa">Empresa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(modalType === 'nutricionista' || modalType === 'empresa') && (
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <span className="text-sm font-medium">Verificado</span>
                      <p className="text-xs text-muted-foreground">
                        Controla a verificação de nutricionistas/empresas.
                      </p>
                    </div>
                    <Switch checked={modalVerified} onCheckedChange={setModalVerified} />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={closeActionModal}
                    disabled={modalSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleConfirmEdit} disabled={modalSubmitting}>
                    {modalSubmitting ? 'Salvando...' : 'Salvar alterações'}
                  </Button>
                </div>
              </div>
            )}

            {modalAction === 'ban' && (
              <div className="space-y-4 py-2">
                <p className="text-sm text-muted-foreground">
                  Tem certeza que deseja banir{' '}
                  <span className="font-semibold">{selectedUser.name}</span>? O usuário
                  não poderá mais acessar a plataforma.
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
                    onClick={handleConfirmBan}
                    disabled={modalSubmitting}
                  >
                    {modalSubmitting ? 'Processando...' : 'Confirmar banimento'}
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
