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
import { getAllUsers, type UserData } from '@/lib/admin-data-service'

interface UserData {
  id: string
  name: string
  email: string
  type: 'paciente' | 'nutricionista' | 'empresa' | 'admin'
  status: 'ativo' | 'inativo' | 'pendente' | 'suspenso'
  registeredAt: string
}

const mockUsers: UserData[] = [
  {
    id: 'usr001',
    name: 'Ana Paula Silva',
    email: 'ana.silva@example.com',
    type: 'paciente',
    status: 'ativo',
    registeredAt: '2023-01-15',
  },
  {
    id: 'usr002',
    name: 'Dr. Carlos Mendes',
    email: 'carlos.mendes@example.com',
    type: 'nutricionista',
    status: 'ativo',
    registeredAt: '2023-02-20',
  },
  {
    id: 'usr003',
    name: 'NutriTech Solutions',
    email: 'contato@nutritech.com',
    type: 'empresa',
    status: 'ativo',
    registeredAt: '2023-03-10',
  },
  {
    id: 'usr004',
    name: 'Iris Admin',
    email: 'iris@buscanutri.com',
    type: 'admin',
    status: 'ativo',
    registeredAt: '2022-11-01',
  },
  {
    id: 'usr005',
    name: 'Bruno Costa',
    email: 'bruno.costa@example.com',
    type: 'paciente',
    status: 'inativo',
    registeredAt: '2023-04-05',
  },
  {
    id: 'usr006',
    name: 'Dra. Fernanda Lima',
    email: 'fernanda.lima@example.com',
    type: 'nutricionista',
    status: 'pendente',
    registeredAt: '2023-05-12',
  },
  {
    id: 'usr007',
    name: 'Healthy Foods Ltda.',
    email: 'rh@healthyfoods.com',
    type: 'empresa',
    status: 'suspenso',
    registeredAt: '2023-06-01',
  },
  {
    id: 'usr008',
    name: 'Gabriela Santos',
    email: 'gabriela.santos@example.com',
    type: 'paciente',
    status: 'ativo',
    registeredAt: '2023-07-18',
  },
  {
    id: 'usr009',
    name: 'Dr. Ricardo Alves',
    email: 'ricardo.alves@example.com',
    type: 'nutricionista',
    status: 'ativo',
    registeredAt: '2023-08-25',
  },
  {
    id: 'usr010',
    name: 'Bem Estar Corporativo',
    email: 'info@bemestar.com',
    type: 'empresa',
    status: 'ativo',
    registeredAt: '2023-09-01',
  },
]

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
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<UserData['type'] | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<UserData['status'] | 'all'>(
    'all'
  )
  const [currentPage, setCurrentPage] = useState(1)
  const usersPerPage = 10

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true)
        const userData = await getAllUsers()
        setUsers(userData)
      } catch (error) {
        // Silent error handling - error loading users
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || user.type === filterType
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
  const indexOfLastUser = currentPage * usersPerPage
  const indexOfFirstUser = indexOfLastUser - usersPerPage
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser)

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  const handleAction = (action: string, user: UserData) => {
    // Implementar lógica real para cada ação (e.g., abrir modal de edição, chamar API)
    alert(`Ação: ${action} para ${user.name} (${user.type})`)
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
            Lista de Usuários ({users.length} total)
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
                setFilterType(value as UserData['type'] | 'all')
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
                setFilterStatus(value as UserData['status'] | 'all')
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
                  <TableHead>Último Login</TableHead>
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
                      {filteredUsers.length === 0 && users.length > 0
                        ? 'Nenhum usuário encontrado com os filtros aplicados.'
                        : 'Nenhum usuário encontrado.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentUsers.map(user => {
                    const IconComponent = userTypeIcons[user.type]
                    return (
                      <TableRow key={user.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-700">
                          {user.id.substring(0, 8)}...
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
                            className={`capitalize ${userStatusColors[user.status]}`}
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {user.lastLogin
                            ? formatDate(user.lastLogin)
                            : 'Nunca'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleAction('view', user)}
                              >
                                <Eye className="mr-2 h-4 w-4" /> Ver Perfil
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleAction('edit', user)}
                              >
                                <Edit className="mr-2 h-4 w-4" /> Editar
                              </DropdownMenuItem>
                              {user.status === 'ativo' && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleAction('deactivate', user)
                                  }
                                >
                                  <XCircle className="mr-2 h-4 w-4" /> Desativar
                                </DropdownMenuItem>
                              )}
                              {user.status !== 'ativo' && (
                                <DropdownMenuItem
                                  onClick={() => handleAction('activate', user)}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />{' '}
                                  Ativar
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleAction('delete', user)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {filteredUsers.length > usersPerPage && (
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
    </div>
  )
}
