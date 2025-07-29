"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination"
import {
  Flag,
  UserX,
  MessageSquareOff,
  MoreHorizontal,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  Ban,
  Trash2,
  Briefcase,
} from "lucide-react"

interface ReportData {
  id: string
  type: "usuário" | "conteúdo" | "vaga" | "chat"
  reportedBy: string
  reportedItem: string
  reason: string
  status: "pendente" | "em análise" | "resolvido" | "rejeitado"
  reportedAt: string
}

const mockReports: ReportData[] = [
  {
    id: "rpt001",
    type: "usuário",
    reportedBy: "Ana Silva",
    reportedItem: "Dr. João Santos (Nutricionista)",
    reason: "Comportamento inadequado",
    status: "pendente",
    reportedAt: "2024-07-22 10:30",
  },
  {
    id: "rpt002",
    type: "conteúdo",
    reportedBy: "Maria Souza",
    reportedItem: "Artigo: 'Dieta Milagrosa'",
    reason: "Informação falsa/enganosa",
    status: "em análise",
    reportedAt: "2024-07-21 14:00",
  },
  {
    id: "rpt003",
    type: "vaga",
    reportedBy: "Empresa X",
    reportedItem: "Vaga: 'Nutricionista Freelancer'",
    reason: "Vaga duplicada",
    status: "resolvido",
    reportedAt: "2024-07-20 09:15",
  },
  {
    id: "rpt004",
    type: "chat",
    reportedBy: "Paciente Y",
    reportedItem: "Conversa com Nutricionista Z",
    reason: "Assédio",
    status: "pendente",
    reportedAt: "2024-07-19 18:45",
  },
  {
    id: "rpt005",
    type: "usuário",
    reportedBy: "Sistema",
    reportedItem: "Perfil: 'FakeUser123'",
    reason: "Suspeita de conta falsa",
    status: "em análise",
    reportedAt: "2024-07-18 11:00",
  },
]

const reportTypeIcons = {
  usuário: UserX,
  conteúdo: Flag,
  vaga: Briefcase,
  chat: MessageSquareOff,
}

const reportStatusColors = {
  pendente: "bg-red-100 text-red-700",
  "em análise": "bg-yellow-100 text-yellow-700",
  resolvido: "bg-green-100 text-green-700",
  rejeitado: "bg-gray-100 text-gray-700",
}

export function ModerationTab() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<ReportData["type"] | "all">("all")
  const [filterStatus, setFilterStatus] = useState<ReportData["status"] | "all">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const reportsPerPage = 10

  const filteredReports = mockReports.filter((report) => {
    const matchesSearch =
      report.reportedItem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || report.type === filterType
    const matchesStatus = filterStatus === "all" || report.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const totalPages = Math.ceil(filteredReports.length / reportsPerPage)
  const indexOfLastReport = currentPage * reportsPerPage
  const indexOfFirstReport = indexOfLastReport - reportsPerPage
  const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport)

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  const handleAction = (action: string, report: ReportData) => {
    console.log(`${action} report:`, report)
    // Implementar lógica real para cada ação (e.g., abrir modal de detalhes, chamar API)
    alert(`Ação: ${action} para o relatório ID: ${report.id}`)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-[#1E1D40]">Moderação de Conteúdo e Usuários</h2>

      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4">
          <CardTitle className="text-xl font-semibold text-[#1E1D40]">Relatórios de Abuso</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1">
              <Input
                placeholder="Buscar por item, usuário ou motivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-lg border border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <Select value={filterType} onValueChange={(value) => setFilterType(value as ReportData["type"] | "all")}>
              <SelectTrigger className="w-full sm:w-[180px] rounded-lg border border-gray-200 focus:ring-emerald-500 focus:border-emerald-500">
                <Filter className="h-4 w-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Filtrar por Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="usuário">Usuário</SelectItem>
                <SelectItem value="conteúdo">Conteúdo</SelectItem>
                <SelectItem value="vaga">Vaga</SelectItem>
                <SelectItem value="chat">Chat</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filterStatus}
              onValueChange={(value) => setFilterStatus(value as ReportData["status"] | "all")}
            >
              <SelectTrigger className="w-full sm:w-[180px] rounded-lg border border-gray-200 focus:ring-emerald-500 focus:border-emerald-500">
                <Filter className="h-4 w-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Filtrar por Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em análise">Em Análise</SelectItem>
                <SelectItem value="resolvido">Resolvido</SelectItem>
                <SelectItem value="rejeitado">Rejeitado</SelectItem>
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>Item Reportado</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Reportado Por</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Nenhum relatório encontrado com os filtros aplicados.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentReports.map((report) => {
                    const IconComponent = reportTypeIcons[report.type]
                    return (
                      <TableRow key={report.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-700">{report.id}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize flex items-center gap-1 w-fit">
                            <IconComponent className="h-3 w-3" />
                            {report.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{report.reportedItem}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{report.reason}</TableCell>
                        <TableCell>{report.reportedBy}</TableCell>
                        <TableCell>
                          <Badge className={`capitalize ${reportStatusColors[report.status]}`}>{report.status}</Badge>
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">{report.reportedAt}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleAction("view", report)}>
                                <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                              </DropdownMenuItem>
                              {report.status !== "resolvido" && (
                                <DropdownMenuItem onClick={() => handleAction("resolve", report)}>
                                  <CheckCircle className="mr-2 h-4 w-4" /> Marcar como Resolvido
                                </DropdownMenuItem>
                              )}
                              {report.status !== "rejeitado" && (
                                <DropdownMenuItem onClick={() => handleAction("reject", report)}>
                                  <XCircle className="mr-2 h-4 w-4" /> Rejeitar
                                </DropdownMenuItem>
                              )}
                              {report.type === "usuário" && (
                                <DropdownMenuItem onClick={() => handleAction("ban", report)} className="text-red-600">
                                  <Ban className="mr-2 h-4 w-4" /> Banir Usuário
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleAction("delete", report)} className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir Relatório
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
          {filteredReports.length > reportsPerPage && (
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
