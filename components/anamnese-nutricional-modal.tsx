"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultiSelect, type Option } from "@/components/ui/multi-select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Upload,
  Heart,
  Scale,
  Pill,
  TestTube,
  AlertTriangle,
  Target,
  MapPin,
  Mail,
  Instagram,
  Calendar
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"

// Opções para os campos de seleção
const GENERO_OPTIONS = [
  { value: "masculino", label: "Masculino" },
  { value: "feminino", label: "Feminino" },
  { value: "outro", label: "Outro" },
  { value: "prefiro_nao_informar", label: "Prefiro não informar" }
]

const OBJETIVO_NUTRICIONAL_OPTIONS = [
  { value: "emagrecimento", label: "Emagrecimento" },
  { value: "ganho_massa", label: "Ganho de massa muscular" },
  { value: "saude_intestinal", label: "Saúde intestinal" },
  { value: "controle_diabetes", label: "Controle de diabetes" },
  { value: "reducao_colesterol", label: "Redução do colesterol" },
  { value: "hipertensao", label: "Controle da hipertensão" },
  { value: "performance_esportiva", label: "Performance esportiva" },
  { value: "saude_geral", label: "Saúde geral" },
  { value: "outro", label: "Outro" }
]

const COMORBIDADES_OPTIONS: Option[] = [
  { value: "diabetes_tipo1", label: "Diabetes Tipo 1" },
  { value: "diabetes_tipo2", label: "Diabetes Tipo 2" },
  { value: "hipertensao", label: "Hipertensão" },
  { value: "dislipidemia", label: "Dislipidemia" },
  { value: "obesidade", label: "Obesidade" },
  { value: "sindrome_metabolica", label: "Síndrome Metabólica" },
  { value: "doenca_celiaca", label: "Doença Celíaca" },
  { value: "intolerancia_lactose", label: "Intolerância à Lactose" },
  { value: "refluxo", label: "Refluxo Gastroesofágico" },
  { value: "gastrite", label: "Gastrite" },
  { value: "sindrome_intestino_irritavel", label: "Síndrome do Intestino Irritável" },
  { value: "hipotireoidismo", label: "Hipotireoidismo" },
  { value: "hipertireoidismo", label: "Hipertireoidismo" },
  { value: "ansiedade", label: "Ansiedade" },
  { value: "depressao", label: "Depressão" },
  { value: "transtorno_alimentar", label: "Transtorno Alimentar" }
]

const ALERGIAS_OPTIONS: Option[] = [
  { value: "gluten", label: "Glúten" },
  { value: "lactose", label: "Lactose" },
  { value: "amendoim", label: "Amendoim" },
  { value: "castanhas", label: "Castanhas" },
  { value: "ovo", label: "Ovo" },
  { value: "peixe", label: "Peixe" },
  { value: "frutos_mar", label: "Frutos do mar" },
  { value: "soja", label: "Soja" },
  { value: "milho", label: "Milho" },
  { value: "corantes", label: "Corantes artificiais" },
  { value: "conservantes", label: "Conservantes" },
  { value: "sulfitos", label: "Sulfitos" }
]

interface AnamneseData {
  id?: string
  patient_id: string
  
  // Parte 1: Informações Básicas
  nome_completo?: string
  genero?: string
  email?: string
  instagram?: string
  cidade?: string
  estado?: string
  
  // Parte 2: Dados Clínicos
  objetivo_nutricional?: string
  peso_atual?: number
  altura?: number
  imc?: number
  historico_peso?: string
  comorbidades?: string[]
  alergias_alimentares?: string[]
  suplementacao_atual?: string[]
  medicacoes_uso?: string[]
  exames_laboratoriais?: any
  
  // Status
  parte_1_completa?: boolean
  parte_2_completa?: boolean
}

interface AnamneseNutricionalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId: string
  onComplete?: (data: AnamneseData) => void
}

export function AnamneseNutricionalModal({
  open,
  onOpenChange,
  patientId,
  onComplete
}: AnamneseNutricionalModalProps) {
  const [currentPart, setCurrentPart] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<AnamneseData>({
    patient_id: patientId,
    comorbidades: [],
    alergias_alimentares: [],
    suplementacao_atual: [],
    medicacoes_uso: []
  })

  // Carregar dados existentes se houver
  useEffect(() => {
    if (open && patientId) {
      loadExistingAnamnese()
    }
  }, [open, patientId])

  const loadExistingAnamnese = async () => {
    try {
      const { data, error } = await supabase
        .from('anamnese_nutricional')
        .select('*')
        .eq('patient_id', patientId)
        .single()

      if (data && !error) {
        setFormData(data)
        // Se parte 1 está completa, ir para parte 2
        if (data.parte_1_completa && !data.parte_2_completa) {
          setCurrentPart(2)
        }
      }
    } catch (error) {
      console.log('Nenhuma anamnese encontrada, criando nova')
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const calculateIMC = (peso: number, altura: number) => {
    if (peso && altura) {
      const imc = peso / (altura * altura)
      return Math.round(imc * 100) / 100
    }
    return 0
  }

  // Atualizar IMC automaticamente quando peso ou altura mudam
  useEffect(() => {
    if (formData.peso_atual && formData.altura) {
      const imc = calculateIMC(formData.peso_atual, formData.altura)
      setFormData(prev => ({ ...prev, imc }))
    }
  }, [formData.peso_atual, formData.altura])

  const validatePart1 = () => {
    const required = ['nome_completo', 'genero', 'email']
    return required.every(field => formData[field as keyof AnamneseData])
  }

  const validatePart2 = () => {
    const required = ['objetivo_nutricional', 'peso_atual', 'altura']
    return required.every(field => formData[field as keyof AnamneseData])
  }

  const savePart = async (partNumber: number) => {
    setLoading(true)
    try {
      const updateData = {
        ...formData,
        [`parte_${partNumber}_completa`]: true
      }

      const { data, error } = await supabase
        .from('anamnese_nutricional')
        .upsert(updateData, { onConflict: 'patient_id' })
        .select()
        .single()

      if (error) throw error

      setFormData(data)
      toast({
        title: "Sucesso!",
        description: `Parte ${partNumber} salva com sucesso.`
      })

      return true
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast({
        title: "Erro",
        description: "Erro ao salvar os dados. Tente novamente.",
        variant: "destructive"
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleNext = async () => {
    if (currentPart === 1) {
      if (!validatePart1()) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os campos obrigatórios antes de continuar.",
          variant: "destructive"
        })
        return
      }
      
      const saved = await savePart(1)
      if (saved) {
        setCurrentPart(2)
      }
    }
  }

  const handlePrevious = () => {
    if (currentPart === 2) {
      setCurrentPart(1)
    }
  }

  const handleFinish = async () => {
    if (!validatePart2()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios antes de finalizar.",
        variant: "destructive"
      })
      return
    }

    const saved = await savePart(2)
    if (saved) {
      toast({
        title: "Anamnese concluída!",
        description: "Sua anamnese nutricional foi salva com sucesso."
      })
      onComplete?.(formData)
      onOpenChange(false)
    }
  }

  const progress = currentPart === 1 ? 50 : 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Anamnese Nutricional
          </DialogTitle>
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Parte {currentPart} de 2 - {currentPart === 1 ? "Informações Básicas" : "Dados Clínicos Relevantes"}
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {currentPart === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações Básicas
                </CardTitle>
                <CardDescription>
                  Dados pessoais e de contato
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome_completo">Nome Completo *</Label>
                    <Input
                      id="nome_completo"
                      value={formData.nome_completo || ""}
                      onChange={(e) => handleInputChange('nome_completo', e.target.value)}
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="genero">Gênero *</Label>
                    <Select
                      value={formData.genero || ""}
                      onValueChange={(value) => handleInputChange('genero', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione seu gênero" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENERO_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      E-mail *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="instagram" className="flex items-center gap-2">
                      <Instagram className="h-4 w-4" />
                      Instagram
                    </Label>
                    <Input
                      id="instagram"
                      value={formData.instagram || ""}
                      onChange={(e) => handleInputChange('instagram', e.target.value)}
                      placeholder="@seuinstagram"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cidade" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Cidade
                    </Label>
                    <Input
                      id="cidade"
                      value={formData.cidade || ""}
                      onChange={(e) => handleInputChange('cidade', e.target.value)}
                      placeholder="Sua cidade"
                    />
                  </div>
                  <div>
                    <Label htmlFor="estado">Estado</Label>
                    <Input
                      id="estado"
                      value={formData.estado || ""}
                      onChange={(e) => handleInputChange('estado', e.target.value)}
                      placeholder="Seu estado"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {currentPart === 2 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Objetivo Nutricional
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="objetivo_nutricional">Objetivo Principal *</Label>
                    <Select
                      value={formData.objetivo_nutricional || ""}
                      onValueChange={(value) => handleInputChange('objetivo_nutricional', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione seu objetivo" />
                      </SelectTrigger>
                      <SelectContent>
                        {OBJETIVO_NUTRICIONAL_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5" />
                    Dados Antropométricos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="peso_atual">Peso Atual (kg) *</Label>
                      <Input
                        id="peso_atual"
                        type="number"
                        step="0.1"
                        value={formData.peso_atual || ""}
                        onChange={(e) => handleInputChange('peso_atual', parseFloat(e.target.value))}
                        placeholder="70.5"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="altura">Altura (m) *</Label>
                      <Input
                        id="altura"
                        type="number"
                        step="0.01"
                        value={formData.altura || ""}
                        onChange={(e) => handleInputChange('altura', parseFloat(e.target.value))}
                        placeholder="1.70"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="imc">IMC</Label>
                      <Input
                        id="imc"
                        value={formData.imc || ""}
                        disabled
                        placeholder="Calculado automaticamente"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="historico_peso">Histórico de Peso</Label>
                    <Textarea
                      id="historico_peso"
                      value={formData.historico_peso || ""}
                      onChange={(e) => handleInputChange('historico_peso', e.target.value)}
                      placeholder="Descreva seu histórico de peso (variações, dietas anteriores, etc.)"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Condições de Saúde
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Comorbidades / Condições de Saúde</Label>
                    <MultiSelect
                      options={COMORBIDADES_OPTIONS}
                      value={formData.comorbidades || []}
                      onValueChange={(value) => handleInputChange('comorbidades', value)}
                      placeholder="Selecione suas condições de saúde"
                    />
                  </div>

                  <div>
                    <Label>Alergias Alimentares</Label>
                    <MultiSelect
                      options={ALERGIAS_OPTIONS}
                      value={formData.alergias_alimentares || []}
                      onValueChange={(value) => handleInputChange('alergias_alimentares', value)}
                      placeholder="Selecione suas alergias alimentares"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5" />
                    Medicações e Suplementos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="suplementacao_atual">Suplementação Atual</Label>
                    <Textarea
                      id="suplementacao_atual"
                      value={Array.isArray(formData.suplementacao_atual) ? formData.suplementacao_atual.join(', ') : formData.suplementacao_atual || ""}
                      onChange={(e) => handleInputChange('suplementacao_atual', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                      placeholder="Liste os suplementos que você toma atualmente (separados por vírgula)"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="medicacoes_uso">Medicações em Uso</Label>
                    <Textarea
                      id="medicacoes_uso"
                      value={Array.isArray(formData.medicacoes_uso) ? formData.medicacoes_uso.join(', ') : formData.medicacoes_uso || ""}
                      onChange={(e) => handleInputChange('medicacoes_uso', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                      placeholder="Liste as medicações que você usa atualmente (separados por vírgula)"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="h-5 w-5" />
                    Exames Laboratoriais
                  </CardTitle>
                  <CardDescription>
                    Você pode anexar seus exames mais recentes ou descrever os resultados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="exames_laboratoriais">Exames Recentes</Label>
                    <Textarea
                      id="exames_laboratoriais"
                      value={typeof formData.exames_laboratoriais === 'string' ? formData.exames_laboratoriais : JSON.stringify(formData.exames_laboratoriais || {})}
                      onChange={(e) => handleInputChange('exames_laboratoriais', e.target.value)}
                      placeholder="Descreva seus exames laboratoriais recentes (hemograma, glicemia, colesterol, etc.)"
                      rows={4}
                    />
                  </div>
                  
                  <div className="mt-4">
                    <Button variant="outline" className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Anexar Exames (Em breve)
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      Funcionalidade de upload será implementada em breve
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {currentPart === 2 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {currentPart === 1 && (
              <Button onClick={handleNext} disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    Próximo
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
            
            {currentPart === 2 && (
              <Button onClick={handleFinish} disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Finalizando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Finalizar Anamnese
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}