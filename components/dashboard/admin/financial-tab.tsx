'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  Search,
  Download,
  Filter,
  TrendingUp,
  DollarSign,
  Users,
  CreditCard,
  Loader2,
  Receipt,
} from 'lucide-react'

interface TransactionData {
  id: string
  type: 'assinatura' | 'pagamento' | 'reembolso'
  description: string
  amount: number
  status: 'concluído' | 'pendente' | 'falhou'
  date: string
  user: string
  stripe_session_id?: string
  stripe_payment_intent_id?: string
  stripe_customer_id?: string
}

interface FinancialStats {
  totalRevenue: number
  activeSubscriptions: number
  monthlyRevenue: number
  totalTransactions: number
}

const mockTransactions: TransactionData[] = [
  {
    id: 'txn001',
    type: 'assinatura',
    description: 'Assinatura Mensal Nutricionista',
    amount: 99.9,
    status: 'concluído',
    date: '2024-07-20',
    user: 'Dr. Carlos Mendes',
  },
  {
    id: 'txn002',
    type: 'pagamento',
    description: 'Pagamento Consulta Online',
    amount: 150.0,
    status: 'concluído',
    date: '2024-07-19',
    user: 'Ana Paula Silva',
  },
  {
    id: 'txn003',
    type: 'assinatura',
    description: 'Assinatura Anual Empresa',
    amount: 999.0,
    status: 'pendente',
    date: '2024-07-18',
    user: 'NutriTech Solutions',
  },
  {
    id: 'txn004',
    type: 'reembolso',
    description: 'Reembolso Consulta Cancelada',
    amount: -120.0,
    status: 'concluído',
    date: '2024-07-17',
    user: 'Bruno Costa',
  },
  {
    id: 'txn005',
    type: 'pagamento',
    description: 'Pagamento Consulta Presencial',
    amount: 180.0,
    status: 'concluído',
    date: '2024-07-16',
    user: 'Gabriela Santos',
  },
  {
    id: 'txn006',
    type: 'assinatura',
    description: 'Assinatura Mensal Paciente Premium',
    amount: 29.9,
    status: 'falhou',
    date: '2024-07-15',
    user: 'Maria Oliveira',
  },
]

const transactionStatusColors = {
  concluído: 'bg-green-100 text-green-700',
  pendente: 'bg-yellow-100 text-yellow-700',
  falhou: 'bg-red-100 text-red-700',
}

export default function FinancialTab() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [typeFilter, setTypeFilter] = useState('todos')
  const [currentPage, setCurrentPage] = useState(1)
  const [transactions, setTransactions] = useState<TransactionData[]>([])
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    totalTransactions: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const itemsPerPage = 10

  // Fetch financial data from API
  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/financial-data')
        
        if (!response.ok) {
          throw new Error('Erro ao carregar dados financeiros')
        }

        const data = await response.json()
        setTransactions(data.transactions)
        setStats(data.stats)
        setError(null)
      } catch (err) {
        console.error('Erro ao buscar dados financeiros:', err)
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    fetchFinancialData()
  }, [])

  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch =
      txn.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'todos' || txn.type === typeFilter
    const matchesStatus = statusFilter === 'todos' || txn.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const totalPages = Math.ceil(
    filteredTransactions.length / itemsPerPage
  )
  const indexOfLastTransaction = currentPage * itemsPerPage
  const indexOfFirstTransaction = indexOfLastTransaction - itemsPerPage
  const currentTransactions = filteredTransactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  )

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusBadge = (status: TransactionData['status']) => {
    const statusConfig = {
      'concluído': { variant: 'default' as const, label: 'Concluído' },
      'pendente': { variant: 'secondary' as const, label: 'Pendente' },
      'falhou': { variant: 'destructive' as const, label: 'Falhou' }
    }
    
    const config = statusConfig[status]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getTypeBadge = (type: TransactionData['type']) => {
    const typeConfig = {
      'assinatura': { variant: 'outline' as const, label: 'Assinatura' },
      'pagamento': { variant: 'default' as const, label: 'Pagamento' },
      'reembolso': { variant: 'secondary' as const, label: 'Reembolso' }
    }
    
    const config = typeConfig[type]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando dados financeiros...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-2">Erro ao carregar dados financeiros</p>
          <p className="text-sm text-gray-500">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  const totalRevenue = stats.totalRevenue.toFixed(2)
  const pendingRevenue = transactions
    .filter(t => t.status === 'pendente' && t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)
    .toFixed(2)

  const totalTransactionsCount = stats.totalTransactions

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-[#1E1D40]">Gestão Financeira</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-br from-emerald-500 to-emerald-600">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                Receita Total (Concluída)
              </p>
              <h3 className="text-2xl font-bold text-[#1E1D40]">
                {formatCurrency(stats.totalRevenue)}
              </h3>
              <p className="text-xs text-gray-500">Desde o início</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-br from-yellow-500 to-yellow-600">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                Receita Pendente
              </p>
              <h3 className="text-2xl font-bold text-[#1E1D40]">
                {formatCurrency(parseFloat(pendingRevenue))}
              </h3>
              <p className="text-xs text-gray-500">Aguardando confirmação</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-br from-blue-500 to-blue-600">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total de Transações
              </p>
              <h3 className="text-2xl font-bold text-[#1E1D40]">
                {totalTransactionsCount}
              </h3>
              <p className="text-xs text-gray-500">Todas as transações</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4">
          <CardTitle className="text-xl font-semibold text-[#1E1D40]">
            Transações Recentes
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1">
              <Input
                placeholder="Buscar por descrição ou usuário..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-lg border border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <Select
              value={typeFilter}
              onValueChange={value =>
                setTypeFilter(value as TransactionData['type'] | 'todos')
              }
            >
              <SelectTrigger className="w-full sm:w-[180px] rounded-lg border border-gray-200 focus:ring-emerald-500 focus:border-emerald-500">
                <Filter className="h-4 w-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Filtrar por Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Tipos</SelectItem>
                <SelectItem value="assinatura">Assinatura</SelectItem>
                <SelectItem value="pagamento">Pagamento</SelectItem>
                <SelectItem value="reembolso">Reembolso</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={value =>
                setStatusFilter(value as TransactionData['status'] | 'todos')
              }
            >
              <SelectTrigger className="w-full sm:w-[180px] rounded-lg border border-gray-200 focus:ring-emerald-500 focus:border-emerald-500">
                <Filter className="h-4 w-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Filtrar por Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="concluído">Concluído</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="falhou">Falhou</SelectItem>
              </SelectContent>
            </Select>
            <Button className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg shadow-md">
              <Download className="h-4 w-4 mr-2" /> Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Usuário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-gray-500"
                    >
                      Nenhuma transação encontrada com os filtros aplicados.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentTransactions.map(txn => (
                    <TableRow key={txn.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-700">
                        {txn.id}
                      </TableCell>
                      <TableCell>{getTypeBadge(txn.type)}</TableCell>
                      <TableCell>{txn.description}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(txn.amount)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(txn.status)}
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {formatDate(txn.date)}
                      </TableCell>
                      <TableCell>{txn.user}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {filteredTransactions.length > itemsPerPage && (
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
