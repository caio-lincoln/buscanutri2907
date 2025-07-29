"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination"
import { DollarSign, CreditCard, Receipt, Search, Filter, Download } from "lucide-react"

interface TransactionData {
  id: string
  type: "assinatura" | "pagamento" | "reembolso"
  description: string
  amount: number
  status: "concluído" | "pendente" | "falhou"
  date: string
  user: string
}

const mockTransactions: TransactionData[] = [
  {
    id: "txn001",
    type: "assinatura",
    description: "Assinatura Mensal Nutricionista",
    amount: 99.9,
    status: "concluído",
    date: "2024-07-20",
    user: "Dr. Carlos Mendes",
  },
  {
    id: "txn002",
    type: "pagamento",
    description: "Pagamento Consulta Online",
    amount: 150.0,
    status: "concluído",
    date: "2024-07-19",
    user: "Ana Paula Silva",
  },
  {
    id: "txn003",
    type: "assinatura",
    description: "Assinatura Anual Empresa",
    amount: 999.0,
    status: "pendente",
    date: "2024-07-18",
    user: "NutriTech Solutions",
  },
  {
    id: "txn004",
    type: "reembolso",
    description: "Reembolso Consulta Cancelada",
    amount: -120.0,
    status: "concluído",
    date: "2024-07-17",
    user: "Bruno Costa",
  },
  {
    id: "txn005",
    type: "pagamento",
    description: "Pagamento Consulta Presencial",
    amount: 180.0,
    status: "concluído",
    date: "2024-07-16",
    user: "Gabriela Santos",
  },
  {
    id: "txn006",
    type: "assinatura",
    description: "Assinatura Mensal Paciente Premium",
    amount: 29.9,
    status: "falhou",
    date: "2024-07-15",
    user: "Maria Oliveira",
  },
]

const transactionStatusColors = {
  concluído: "bg-green-100 text-green-700",
  pendente: "bg-yellow-100 text-yellow-700",
  falhou: "bg-red-100 text-red-700",
}

export function FinancialTab() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<TransactionData["type"] | "all">("all")
  const [filterStatus, setFilterStatus] = useState<TransactionData["status"] | "all">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const transactionsPerPage = 10

  const filteredTransactions = mockTransactions.filter((txn) => {
    const matchesSearch =
      txn.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || txn.type === filterType
    const matchesStatus = filterStatus === "all" || txn.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage)
  const indexOfLastTransaction = currentPage * transactionsPerPage
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage
  const currentTransactions = filteredTransactions.slice(indexOfFirstTransaction, indexOfLastTransaction)

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  const totalRevenue = mockTransactions
    .filter((t) => t.status === "concluído" && t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)
    .toFixed(2)

  const pendingRevenue = mockTransactions
    .filter((t) => t.status === "pendente" && t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)
    .toFixed(2)

  const totalTransactions = mockTransactions.length

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
              <p className="text-sm font-medium text-gray-600">Receita Total (Concluída)</p>
              <h3 className="text-2xl font-bold text-[#1E1D40]">R$ {totalRevenue}</h3>
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
              <p className="text-sm font-medium text-gray-600">Receita Pendente</p>
              <h3 className="text-2xl font-bold text-[#1E1D40]">R$ {pendingRevenue}</h3>
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
              <p className="text-sm font-medium text-gray-600">Total de Transações</p>
              <h3 className="text-2xl font-bold text-[#1E1D40]">{totalTransactions}</h3>
              <p className="text-xs text-gray-500">Todas as transações</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4">
          <CardTitle className="text-xl font-semibold text-[#1E1D40]">Transações Recentes</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1">
              <Input
                placeholder="Buscar por descrição ou usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-lg border border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <Select
              value={filterType}
              onValueChange={(value) => setFilterType(value as TransactionData["type"] | "all")}
            >
              <SelectTrigger className="w-full sm:w-[180px] rounded-lg border border-gray-200 focus:ring-emerald-500 focus:border-emerald-500">
                <Filter className="h-4 w-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Filtrar por Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="assinatura">Assinatura</SelectItem>
                <SelectItem value="pagamento">Pagamento</SelectItem>
                <SelectItem value="reembolso">Reembolso</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filterStatus}
              onValueChange={(value) => setFilterStatus(value as TransactionData["status"] | "all")}
            >
              <SelectTrigger className="w-full sm:w-[180px] rounded-lg border border-gray-200 focus:ring-emerald-500 focus:border-emerald-500">
                <Filter className="h-4 w-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Filtrar por Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
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
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Nenhuma transação encontrada com os filtros aplicados.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentTransactions.map((txn) => (
                    <TableRow key={txn.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-700">{txn.id}</TableCell>
                      <TableCell className="capitalize">{txn.type}</TableCell>
                      <TableCell>{txn.description}</TableCell>
                      <TableCell className="font-semibold">R$ {txn.amount.toFixed(2).replace(".", ",")}</TableCell>
                      <TableCell>
                        <Badge className={`capitalize ${transactionStatusColors[txn.status]}`}>{txn.status}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">{txn.date}</TableCell>
                      <TableCell>{txn.user}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {filteredTransactions.length > transactionsPerPage && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink href="#" onClick={() => handlePageChange(i + 1)} isActive={currentPage === i + 1}>
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
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
