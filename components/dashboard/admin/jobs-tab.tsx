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
import { Search, Filter, MoreHorizontal, CheckCircle, XCircle, Edit, Eye, Archive, PlusCircle } from "lucide-react"

interface JobData {
  id: string
  title: string
  company: string
  status: "pendente" | "ativa" | "expirada" | "rejeitada"
  applicants: number
  postedAt: string
}

const mockJobs: JobData[] = [
  {
    id: "job001",
    title: "Nutricionista Clínico",
    company: "Hospital Saúde Plena",
    status: "ativa",
    applicants: 25,
    postedAt: "2024-07-01",
  },
  {
    id: "job002",
    title: "Consultor de Bem-Estar",
    company: "Bem Estar Corporativo",
    status: "pendente",
    applicants: 0,
    postedAt: "2024-07-10",
  },
  {
    id: "job003",
    title: "Nutricionista Esportivo",
    company: "Academia Fitness Total",
    status: "ativa",
    applicants: 18,
    postedAt: "2024-06-15",
  },
  {
    id: "job004",
    title: "Estágio em Nutrição",
    company: "Clínica NutriVida",
    status: "expirada",
    applicants: 30,
    postedAt: "2024-05-20",
  },
  {
    id: "job005",
    title: "Nutricionista Home Care",
    company: "Saúde em Casa",
    status: "ativa",
    applicants: 12,
    postedAt: "2024-07-05",
  },
  {
    id: "job006",
    title: "Pesquisador em Nutrição",
    company: "Instituto de Pesquisa Alimentar",
    status: "rejeitada",
    applicants: 0,
    postedAt: "2024-07-02",
  },
]

const jobStatusColors = {
  ativa: "bg-green-100 text-green-700",
  pendente: "bg-yellow-100 text-yellow-700",
  expirada: "bg-gray-100 text-gray-700",
  rejeitada: "bg-red-100 text-red-700",
}

export function JobsTab() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<JobData["status"] | "all">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const jobsPerPage = 10

  const filteredJobs = mockJobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || job.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage)
  const indexOfLastJob = currentPage * jobsPerPage
  const indexOfFirstJob = indexOfLastJob - jobsPerPage
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob)

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  const handleAction = (action: string, job: JobData) => {
    console.log(`${action} job:`, job)
    // Implementar lógica real para cada ação
    alert(`Ação: ${action} para vaga "${job.title}" da empresa "${job.company}"`)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-[#1E1D40]">Gerenciamento de Vagas</h2>

      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4">
          <CardTitle className="text-xl font-semibold text-[#1E1D40]">Vagas Publicadas</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1">
              <Input
                placeholder="Buscar por título ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-lg border border-gray-200 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as JobData["status"] | "all")}>
              <SelectTrigger className="w-full sm:w-[180px] rounded-lg border border-gray-200 focus:ring-emerald-500 focus:border-emerald-500">
                <Filter className="h-4 w-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Filtrar por Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="ativa">Ativa</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="expirada">Expirada</SelectItem>
                <SelectItem value="rejeitada">Rejeitada</SelectItem>
              </SelectContent>
            </Select>
            <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md">
              <PlusCircle className="h-4 w-4 mr-2" /> Nova Vaga
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Título da Vaga</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Candidatos</TableHead>
                  <TableHead>Publicado Em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Nenhuma vaga encontrada com os filtros aplicados.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentJobs.map((job) => (
                    <TableRow key={job.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-700">{job.id}</TableCell>
                      <TableCell>{job.title}</TableCell>
                      <TableCell>{job.company}</TableCell>
                      <TableCell>
                        <Badge className={`capitalize ${jobStatusColors[job.status]}`}>{job.status}</Badge>
                      </TableCell>
                      <TableCell>{job.applicants}</TableCell>
                      <TableCell className="text-gray-500 text-sm">{job.postedAt}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleAction("view", job)}>
                              <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                            </DropdownMenuItem>
                            {job.status === "pendente" && (
                              <>
                                <DropdownMenuItem onClick={() => handleAction("approve", job)}>
                                  <CheckCircle className="mr-2 h-4 w-4" /> Aprovar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAction("reject", job)} className="text-red-600">
                                  <XCircle className="mr-2 h-4 w-4" /> Rejeitar
                                </DropdownMenuItem>
                              </>
                            )}
                            {job.status === "ativa" && (
                              <DropdownMenuItem onClick={() => handleAction("archive", job)}>
                                <Archive className="mr-2 h-4 w-4" /> Arquivar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleAction("edit", job)}>
                              <Edit className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {filteredJobs.length > jobsPerPage && (
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
