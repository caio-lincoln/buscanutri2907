'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MultiSelect, type Option } from '@/components/ui/multi-select'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
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
  AlertTriangle,
  Target,
  MapPin,
  Mail,
  Instagram,
  Calendar,
  Utensils,
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { createSupabaseClient } from '@/lib/supabase'

// Opções para os campos de seleção
const GENERO_OPTIONS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'outro', label: 'Outro' },
  { value: 'prefiro_nao_informar', label: 'Prefiro não informar' },
]

const OBJETIVO_NUTRICIONAL_OPTIONS = [
  {
    value: 'definicao',
    label: 'Definição (diminuir percentual de gordura e aumentar massa magra)',
  },
  {
    value: 'disturbios_saude',
    label:
      'Distúrbios na saúde (Anemia, Diabetes mellitus, Doença cardíaca, Esteatose hepática e etc.)',
  },
  { value: 'emagrecimento', label: 'Emagrecimento' },
  { value: 'ganho_massa', label: 'Ganho de massa muscular' },
  { value: 'intolerancia_alergia', label: 'Intolerância/alergia alimentar' },
  { value: 'performance_esportiva', label: 'Performance esportiva' },
  { value: 'reeducacao_alimentar', label: 'Reeducação alimentar' },
  { value: 'saude_geral', label: 'Saúde geral' },
  { value: 'saude_intestinal', label: 'Saúde intestinal' },
  { value: 'outro', label: 'Outro' },
]

const COMORBIDADES_OPTIONS: Option[] = [
  { value: 'anemia', label: 'Anemia' },
  { value: 'ansiedade', label: 'Ansiedade' },
  { value: 'artrite_reumatoide', label: 'Artrite reumatoide' },
  { value: 'colite_ulcerativa', label: 'Colite ulcerativa' },
  { value: 'depressao', label: 'Depressão' },
  { value: 'desnutricao', label: 'Desnutrição' },
  { value: 'diabetes_mellitus_1', label: 'Diabetes mellitus 1' },
  { value: 'diabetes_mellitus_2', label: 'Diabetes mellitus 2' },
  {
    value: 'dislipidemia',
    label: 'Dislipidemia (colesterol e triglicerídeos altos)',
  },
  { value: 'doenca_cardiaca', label: 'Doença cardíaca' },
  { value: 'doenca_celiaca', label: 'Doença celíaca' },
  { value: 'doenca_crohn', label: 'Doença de Crohn' },
  { value: 'doenca_hashimoto', label: 'Doença de Hashimoto' },
  { value: 'doenca_hepatica_cronica', label: 'Doença hepática crônica' },
  { value: 'doenca_renal_cronica', label: 'Doença renal crônica' },
  {
    value: 'doencas_neurodegenerativas',
    label: 'Doenças neurodegenerativas (Alzheimer, Parkinson, etc.)',
  },
  { value: 'gastrite', label: 'Gastrite' },
  { value: 'hipertensao_arterial', label: 'Hipertensão arterial' },
  { value: 'hipertiroidismo', label: 'Hipertiroidismo' },
  { value: 'hipotiroidismo', label: 'Hipotiroidismo' },
  {
    value: 'intolerancia_alergia_lactose',
    label: 'Intolerância ou alergia a lactose',
  },
  { value: 'lupus', label: 'Lúpus' },
  { value: 'neoplasia', label: 'Neoplasia' },
  { value: 'obesidade', label: 'Obesidade' },
  { value: 'osteoporose', label: 'Osteoporose' },
  { value: 'refluxo_gastroesofagico', label: 'Refluxo gastroesofágico' },
  {
    value: 'sindrome_intestino_irritavel',
    label: 'Síndrome do intestino irritável',
  },
  { value: 'sindrome_metabolica', label: 'Síndrome metabólica' },
  { value: 'transtorno_alimentar', label: 'Transtorno alimentar' },
  { value: 'ulcera_peptica', label: 'Úlcera péptica' },
]

const ALERGIAS_OPTIONS: Option[] = [
  { value: 'amendoim', label: 'Amendoim' },
  { value: 'castanha', label: 'Castanha' },
  { value: 'conservantes', label: 'Conservantes' },
  { value: 'corantes_artificiais', label: 'Corantes artificiais' },
  { value: 'frutos_mar', label: 'Frutos do mar' },
  { value: 'gluten', label: 'Glúten' },
  { value: 'lactose', label: 'Lactose' },
  { value: 'leite', label: 'Leite' },
  { value: 'milho', label: 'Milho' },
  { value: 'nozes', label: 'Nozes' },
  { value: 'ovo', label: 'Ovo' },
  { value: 'peixes', label: 'Peixes' },
  { value: 'soja', label: 'Soja' },
  { value: 'sulfitos', label: 'Sulfitos' },
]

const PREFERENCIAS_ALIMENTARES_OPTIONS: Option[] = [
  { value: 'vegetariano', label: 'Vegetariano' },
  { value: 'vegano', label: 'Vegano' },
  { value: 'sem_gluten', label: 'Sem glúten' },
  { value: 'sem_lactose', label: 'Sem lactose' },
  { value: 'low_carb', label: 'Low carb' },
  { value: 'cetogenica', label: 'Cetogênica' },
  { value: 'mediterranea', label: 'Mediterrânea' },
  { value: 'dash', label: 'DASH' },
  { value: 'paleolitica', label: 'Paleolítica' },
  { value: 'jejum_intermitente', label: 'Jejum intermitente' },
  { value: 'sem_acucar', label: 'Sem açúcar' },
  { value: 'organicos', label: 'Alimentos orgânicos' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' },
  { value: 'sem_restricoes', label: 'Sem restrições' },
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
  objetivo_nutricional?: string // Manter para compatibilidade
  objetivos_nutricionais?: string[] // Nova estrutura para múltiplos objetivos
  objetivo_personalizado?: string // Para quando "Outro" é selecionado
  peso_atual?: number
  altura?: number
  imc?: number
  historico_peso?: string
  comorbidades?: string[]
  alergias_alimentares?: string[]
  suplementacao_atual?: string[]
  medicacoes_uso?: string[]
  exames_laboratoriais?: any

  // Parte 3: Preferências Alimentares
  preferencias_alimentares?: string[]

  // Status
  parte_1_completa?: boolean
  parte_2_completa?: boolean
  parte_3_completa?: boolean
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
  onComplete,
}: AnamneseNutricionalModalProps) {
  const [currentPart, setCurrentPart] = useState(2)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<AnamneseData>({
    patient_id: patientId,
    objetivos_nutricionais: [],
    objetivo_personalizado: '',
    comorbidades: [],
    alergias_alimentares: [],
    suplementacao_atual: [],
    medicacoes_uso: [],
    preferencias_alimentares: [],
  })

  const supabase = createSupabaseClient()

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
        // Determinar qual página mostrar baseado no progresso
        if (data.parte_2_completa && !data.parte_3_completa) {
          setCurrentPart(3)
        } else if (!data.parte_2_completa) {
          setCurrentPart(2)
        } else {
          setCurrentPart(2) // Se tudo estiver completo, começar da parte 2
        }
      }
    } catch (error) {
      // Silent operation: No anamnesis found, creating new one
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  // Função para formatar peso automaticamente
  const formatPeso = (value: string) => {
    // Remove caracteres não numéricos
    const numericValue = value.replace(/[^d]/g, '')

    if (numericValue.length === 0) return ''
    if (numericValue.length === 1) return numericValue
    if (numericValue.length === 2) return numericValue

    // Adiciona ponto antes do último dígito para valores com 3+ dígitos
    const integerPart = numericValue.slice(0, -1)
    const decimalPart = numericValue.slice(-1)

    return `${integerPart}.${decimalPart}`
  }

  // Função para formatar altura automaticamente
  const formatAltura = (value: string) => {
    // Remove caracteres não numéricos
    const numericValue = value.replace(/[^d]/g, '')

    if (numericValue.length === 0) return ''
    if (numericValue.length === 1) return `1.${numericValue}`
    if (numericValue.length === 2) return `1.${numericValue}`

    // Para valores com 3 dígitos, formato 1.XX
    if (numericValue.length === 3) {
      return `${numericValue[0]}.${numericValue.slice(1)}`
    }

    return value
  }

  // Handlers específicos para peso e altura
  const handlePesoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value

    // Se o usuário está apagando, permitir
    if (rawValue === '') {
      handleInputChange('peso_atual', '')
      return
    }

    // Aplicar formatação apenas se necessário
    const formattedValue = formatPeso(rawValue)
    const numericValue = parseFloat(formattedValue) || 0

    // Atualizar com o valor formatado para exibição
    handleInputChange('peso_atual', formattedValue)
  }

  const handleAlturaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value

    // Se o usuário está apagando, permitir
    if (rawValue === '') {
      handleInputChange('altura', '')
      return
    }

    // Aplicar formatação apenas se necessário
    const formattedValue = formatAltura(rawValue)
    const numericValue = parseFloat(formattedValue) || 0

    // Atualizar com o valor formatado para exibição
    handleInputChange('altura', formattedValue)
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

  const validatePart2 = () => {
    // Verificar se pelo menos um objetivo foi selecionado
    const hasObjectives =
      formData.objetivos_nutricionais &&
      formData.objetivos_nutricionais.length > 0

    // Se "outro" foi selecionado, verificar se o campo personalizado foi preenchido
    const hasOtherObjective = formData.objetivos_nutricionais?.includes('outro')
    const hasCustomObjective = hasOtherObjective
      ? formData.objetivo_personalizado?.trim()
      : true

    // Verificar campos obrigatórios
    const hasRequiredFields = formData.peso_atual && formData.altura

    return hasObjectives && hasCustomObjective && hasRequiredFields
  }

  const validatePart3 = () => {
    // Para a parte 3, as preferências alimentares são opcionais
    // Sempre retorna true para permitir finalizar mesmo sem preferências
    return true
  }

  const savePart = async (partNumber: number) => {
    setLoading(true)
    try {
      const updateData = {
        ...formData,
        [`parte_${partNumber}_completa`]: true,
      }

      const { data, error } = await supabase
        .from('anamnese_nutricional')
        .upsert(updateData, { onConflict: 'patient_id' })
        .select()
        .single()

      if (error) throw error

      setFormData(data)
      toast({
        title: 'Sucesso!',
        description: `Parte ${partNumber} salva com sucesso.`,
      })

      return true
    } catch (error) {
      // Silent error handling: Error saving data
      toast({
        title: 'Erro',
        description: 'Erro ao salvar os dados. Tente novamente.',
        variant: 'destructive',
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleNext = async () => {
    if (currentPart === 2) {
      if (!validatePart2()) {
        toast({
          title: 'Campos obrigatórios',
          description:
            'Preencha todos os campos obrigatórios antes de continuar.',
          variant: 'destructive',
        })
        return
      }

      const saved = await savePart(2)
      if (saved) {
        setCurrentPart(3)
      }
    }
  }

  const handlePrevious = () => {
    if (currentPart === 3) {
      setCurrentPart(2)
    }
  }

  const handleFinish = async () => {
    if (!validatePart3()) {
      toast({
        title: 'Erro de validação',
        description: 'Verifique os dados antes de finalizar.',
        variant: 'destructive',
      })
      return
    }

    const saved = await savePart(3)
    if (saved) {
      toast({
        title: 'Anamnese concluída!',
        description: 'Sua anamnese nutricional foi salva com sucesso.',
      })
      onComplete?.(formData)
      onOpenChange(false)
    }
  }

  const progress = currentPart === 2 ? 50 : 100

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
              Parte {currentPart - 1} de 2 -{' '}
              {currentPart === 2
                ? 'Dados Clínicos Relevantes'
                : 'Preferências Alimentares'}
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {currentPart === 2 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Objetivos Nutricionais
                  </CardTitle>
                  <CardDescription>
                    Selecione um ou mais objetivos que você deseja alcançar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Objetivos Nutricionais *</Label>
                    <MultiSelect
                      options={OBJETIVO_NUTRICIONAL_OPTIONS}
                      selected={formData.objetivos_nutricionais || []}
                      onChange={selected =>
                        handleInputChange('objetivos_nutricionais', selected)
                      }
                      placeholder="Selecione seus objetivos nutricionais"
                    />
                  </div>

                  {/* Campo personalizado quando "Outro" é selecionado */}
                  {formData.objetivos_nutricionais?.includes('outro') && (
                    <div>
                      <Label htmlFor="objetivo_personalizado">
                        Especifique seu objetivo personalizado *
                      </Label>
                      <Input
                        id="objetivo_personalizado"
                        value={formData.objetivo_personalizado || ''}
                        onChange={e =>
                          handleInputChange(
                            'objetivo_personalizado',
                            e.target.value
                          )
                        }
                        placeholder="Descreva seu objetivo específico"
                        required
                      />
                    </div>
                  )}
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
                        type="text"
                        value={formData.peso_atual || ''}
                        onChange={handlePesoChange}
                        placeholder="Ex: 70.5"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="altura">Altura (m) *</Label>
                      <Input
                        id="altura"
                        type="text"
                        value={formData.altura || ''}
                        onChange={handleAlturaChange}
                        placeholder="Ex: 1.70"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="imc">IMC</Label>
                      <Input
                        id="imc"
                        value={formData.imc || ''}
                        disabled
                        placeholder="Calculado automaticamente"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="historico_peso">Histórico de Peso</Label>
                    <Textarea
                      id="historico_peso"
                      value={formData.historico_peso || ''}
                      onChange={e =>
                        handleInputChange('historico_peso', e.target.value)
                      }
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
                      selected={formData.comorbidades || []}
                      onChange={selected =>
                        handleInputChange('comorbidades', selected)
                      }
                      placeholder="Selecione suas condições de saúde"
                    />
                  </div>

                  <div>
                    <Label>Alergias Alimentares</Label>
                    <MultiSelect
                      options={ALERGIAS_OPTIONS}
                      selected={formData.alergias_alimentares || []}
                      onChange={selected =>
                        handleInputChange('alergias_alimentares', selected)
                      }
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
                    <Label htmlFor="suplementacao_atual">
                      Suplementação Atual
                    </Label>
                    <Textarea
                      id="suplementacao_atual"
                      value={
                        Array.isArray(formData.suplementacao_atual)
                          ? formData.suplementacao_atual.join(', ')
                          : formData.suplementacao_atual || ''
                      }
                      onChange={e =>
                        handleInputChange(
                          'suplementacao_atual',
                          e.target.value
                            .split(',')
                            .map(s => s.trim())
                            .filter(s => s)
                        )
                      }
                      placeholder="Liste os suplementos que você toma atualmente (separados por vírgula)"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="medicacoes_uso">Medicações em Uso</Label>
                    <Textarea
                      id="medicacoes_uso"
                      value={
                        Array.isArray(formData.medicacoes_uso)
                          ? formData.medicacoes_uso.join(', ')
                          : formData.medicacoes_uso || ''
                      }
                      onChange={e =>
                        handleInputChange(
                          'medicacoes_uso',
                          e.target.value
                            .split(',')
                            .map(s => s.trim())
                            .filter(s => s)
                        )
                      }
                      placeholder="Liste as medicações que você usa atualmente (separados por vírgula)"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentPart === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5" />
                  Preferências Alimentares
                </CardTitle>
                <CardDescription>
                  Selecione suas preferências alimentares para personalizar seu
                  plano nutricional
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Preferências Alimentares</Label>
                  <MultiSelect
                    options={PREFERENCIAS_ALIMENTARES_OPTIONS}
                    selected={formData.preferencias_alimentares || []}
                    onChange={selected =>
                      handleInputChange('preferencias_alimentares', selected)
                    }
                    placeholder="Selecione suas preferências alimentares"
                  />
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Dica:</strong> Suas preferências alimentares ajudam
                    o nutricionista a criar um plano personalizado que respeita
                    suas escolhas e restrições.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {currentPart === 3 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {currentPart === 2 && (
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

            {currentPart === 3 && (
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
