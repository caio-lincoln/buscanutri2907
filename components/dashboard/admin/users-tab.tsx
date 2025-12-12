'use client'

import { useState, useEffect } from 'react'
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
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react'
import { type UserData } from '@/lib/admin-data-service'
import { createSupabaseClient } from '@/lib/supabase'
import { VerifyNutritionistModal } from './VerifyNutritionistModal'
import EditUserModal, { EditUserData } from './EditUserModal'
import ViewUserProfileModal, { ViewUserProfileData } from './ViewUserProfileModal'
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

export function UsersTab() {
  const { hasPermission } = usePermissions()
  const canManageUsers = hasPermission('manage_users')
  const [ users, setUsers ] = useState<UserData[]>([])
  const [ loading, setLoading ] = useState(true)
  const [ searchTerm, setSearchTerm ] = useState('')
  const [ filterType, setFilterType ] = useState<UserData[ 'type' ] | 'all'>('all')
  const [ filterStatus, setFilterStatus ] = useState<UserData[ 'status' ] | 'all'>(
    'all'
  )
  const [ currentPage, setCurrentPage ] = useState(1)
  const usersPerPage = 10
  const [ totalUsersCount, setTotalUsersCount ] = useState(0)
  const [ verifyModalOpen, setVerifyModalOpen ] = useState(false)
  const [ selectedUser, setSelectedUser ] = useState<{
    id: string
    email: string
    name?: string | null
    nutritionistProfileId: string
  } | null>(null)
  const [ editModalOpen, setEditModalOpen ] = useState(false)
  const [ editUser, setEditUser ] = useState<EditUserData | null>(null)
  const [ viewModalOpen, setViewModalOpen ] = useState(false)
  const [ viewUser, setViewUser ] = useState<ViewUserProfileData | null>(null)

  const loadUsersDirect = async (page: number) => {
    setLoading(true)
    try {
      const all = await getAllUsers()
      const filtered = all.filter(user => {
        const matchesSearch =
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.id.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesType = filterType === 'all' || user.type === filterType
        const matchesStatus = filterStatus === 'all' || user.status === filterStatus
        return matchesSearch && matchesType && matchesStatus
      })
      const offset = (page - 1) * usersPerPage
      const paged = filtered.slice(offset, offset + usersPerPage)
      setUsers(paged)
      setTotalUsersCount(filtered.length)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadUsersDirect(currentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ filterType, filterStatus, currentPage, searchTerm ])

  const totalPages = Math.ceil(totalUsersCount / usersPerPage)
  const currentUsers = users

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

  const execAdmin = async (action: string, url: string, options: RequestInit) => {
    try {
      const res = await fetch(url, { ...options, credentials: 'include' })
      if (res.ok) {
        // Validar conteúdo quando OK para detectar sucesso lógico
        try {
          const ct = res.headers.get('content-type') || ''
          if (ct.includes('application/json')) {
            const j = await res.json()
            const data = j?.data ?? j
            // Quando resposta tem 'success' explícito
            if (typeof data?.success === 'boolean') {
              if (data.success) return true
              const msg =
                data?.error?.message ||
                data?.error ||
                `Falha na ação: auth=${String(data?.auth || '-')}, db=${String(data?.db || '-')}`
              alert(String(msg))
              return false
            }
            // Sem campo 'success', consideramos OK
            return true
          }
          // Conteúdo não JSON: considerar sucesso
          return true
        } catch {
          return true
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
      return false
    } catch (err: any) {
      console.warn('Erro de rede ao executar ação administrativa', {
        action,
        url,
        error: err?.message || String(err),
      })
      alert('Erro de rede ao executar ação.')
      return false
    }
  }

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  const handleAction = (action: string, user: UserData) => {
    console.log("🚀 ~ handleAction ~ user:", user)
    if (action === 'verify' && user.type === 'nutricionista' && user.nutritionist_profiles?.id) {
      setSelectedUser({
        id: user.id,
        email: user.email,
        name: user.name,
        nutritionistProfileId: user?.nutritionist_profiles?.id
      })
      setVerifyModalOpen(true)
    } else {
      if (action === 'edit') {
        const base = {
          id: user.id,
          email: user.email,
          name: user.name,
          type: user.type,
          status: user.status,
        } as any
        const payload = user.nutritionist_profiles
          ? { ...base, nutritionist_profiles: user.nutritionist_profiles }
          : base
        setEditUser(payload)
        setEditModalOpen(true)
        return
      }
      if (action === 'view') {
        setViewUser({
          id: user.id,
          email: user.email,
          name: user.name,
          type: user.type as ViewUserProfileData['type'],
        })
        setViewModalOpen(true)
        return
      }
      const exec = async () => {
        try {
          setLoading(true)
          let url = ''
          let options: RequestInit = { method: 'POST' }
          const idForOps = (() => {
            const numeric = (user as any)?.numericId
            if (typeof numeric === 'number' && Number.isFinite(numeric)) return String(numeric)
            if (typeof user.id === 'string' && user.id.trim().toLowerCase() !== 'undefined' && user.id.trim().toLowerCase() !== 'null') {
              return user.id.trim()
            }
            return ''
          })()
          if (!idForOps) {
            alert('ID do usuário inválido. Recarregue a página e tente novamente.')
            return
          }
          if (action === 'deactivate') {
            url = `/api/admin/users/${idForOps}/deactivate`
            options = { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-production-auth': 'liberar_producao' }, body: JSON.stringify({ duration: '720h', production_auth: 'liberar_producao' }) }
          } else if (action === 'activate') {
            url = `/api/admin/users/${idForOps}/activate`
            options = { method: 'POST', headers: { 'x-production-auth': 'liberar_producao' } }
          } else if (action === 'delete') {
            if (!window.confirm(`Tem certeza que deseja excluir ${user.name}?`)) {
              return
            }
            url = `/api/admin/users/${idForOps}/delete`
            options = { method: 'DELETE', headers: { 'x-production-auth': 'liberar_producao' } }
          } else {
            alert(`Ação não suportada: ${action}`)
            return
          }
          const ok = await execAdmin(action, url, options)
          if (!ok) return
          // Recarregar lista
          await loadUsersDirect(currentPage)
        } catch (err) {
          console.warn('Erro executando ação admin:', err)
          alert('Erro ao executar ação.')
        } finally {
          setLoading(false)
        }
      }
      exec()
    }
  }

  const handleVerifyModalClose = () => {
    setVerifyModalOpen(false)
    setSelectedUser(null)
  }

  const handleUserApproved = async () => {
    // Recarregar dados após aprovação
    try {
      setLoading(true)
      const refreshed = await getAllUsers()
      setUsers(refreshed)
    } catch {
      // Silent error handling: Error reloading users
    } finally {
      setLoading(false)
    }
  }

  const handleUserUpdated = async () => {
    // Recarregar dados após atualização via modal de edição
    try {
      setLoading(true)
      const refreshed = await getAllUsers()
      setUsers(refreshed)
    } catch {
      // Silent error handling: Error reloading users
    } finally {
      setLoading(false)
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

      <Card className="border-0 shadow-lg">
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
                      {users.length === 0 && (totalUsersCount || 0) > 0
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
                          <div className="flex justify-end gap-2">
                            {canManageUsers && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAction('view', user)}
                                >
                                  <Eye className="mr-2 h-4 w-4" /> Ver Detalhe
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleAction('edit', user)}
                                >
                                  <Edit className="mr-2 h-4 w-4" /> Editar
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleAction('delete', user)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Excluir conta
                                </Button>
                              </>
                            )}
                          </div>
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
          key={selectedUser?.id}  
          open={verifyModalOpen}
          onOpenChange={handleVerifyModalClose}
          user={selectedUser}
          onApproved={handleUserApproved}
        />
      )}

      <EditUserModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        user={editUser}
        onUpdated={handleUserUpdated}
      />

      <ViewUserProfileModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        user={viewUser}
      />
    </div>
  )
}
