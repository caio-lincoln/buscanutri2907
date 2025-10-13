'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Calculator, Users, DollarSign, CheckCircle } from 'lucide-react'

interface PlanOption {
  id: string
  name: string
  type: 'mensal' | 'avulso'
  category: 'basico' | 'premium'
  priceType: 'fixed' | 'perEmployee'
  price: number
  maxEmployees: number
  features: string[]
}

// Preços específicos por funcionário para contagens 10, 20 e 100
// Somente para os planos Startup conforme solicitado
const tierPrices: Record<string, Record<number, number>> = {
  'startup-basico-mensal': {
    10: 50,
    20: 47,
    100: 40,
  },
  'startup-basico-avulso': {
    10: 60,
    20: 55,
    100: 47,
  },
  'startup-premium-mensal': {
    10: 100,
    20: 95,
    100: 85,
  },
  'startup-premium-avulso': {
    10: 110,
    20: 105,
    100: 95,
  },
}

const planOptions: PlanOption[] = [
  // Startup Plans
  {
    id: 'startup-basico-mensal',
    name: 'Startup Básico Mensal',
    type: 'mensal',
    category: 'basico',
    priceType: 'fixed',
    price: 2200,
    maxEmployees: 50,
    features: [
      'Até 50 colaboradores',
      'Orientações nutricionais mensais',
      'Palestras mensais',
      'Relatórios básicos',
      'Suporte por email'
    ]
  },
  {
    id: 'startup-basico-avulso',
    name: 'Startup Básico Avulso',
    type: 'avulso',
    category: 'basico',
    priceType: 'fixed',
    price: 2500,
    maxEmployees: 50,
    features: [
      'Até 50 colaboradores',
      'Orientações nutricionais',
      '1 palestra',
      'Relatórios básicos',
      'Suporte por email'
    ]
  },
  {
    id: 'startup-premium-mensal',
    name: 'Startup Premium Mensal',
    type: 'mensal',
    category: 'premium',
    priceType: 'fixed',
    price: 4400,
    maxEmployees: 50,
    features: [
      'Até 50 colaboradores',
      'Consultas mensais',
      'Palestras bimestrais',
      'Relatórios básicos',
      'Suporte por email'
    ]
  },
  {
    id: 'startup-premium-avulso',
    name: 'Startup Premium Avulso',
    type: 'avulso',
    category: 'premium',
    priceType: 'fixed',
    price: 5000,
    maxEmployees: 50,
    features: [
      'Até 50 colaboradores',
      'Consulta nutricional',
      '1 Palestra',
      'Relatórios básicos',
      'Suporte por email'
    ]
  },
  // Corporativo Plans
  {
    id: 'corporativo-basico-mensal',
    name: 'Corporativo Básico Mensal',
    type: 'mensal',
    category: 'basico',
    priceType: 'fixed',
    price: 7800,
    maxEmployees: 200,
    features: [
      'Até 200 colaboradores',
      'Orientações nutricionais',
      '1 palestra',
      'Relatórios básicos',
      'Suporte por email'
    ]
  },
  {
    id: 'corporativo-basico-avulso',
    name: 'Corporativo Básico Avulso',
    type: 'avulso',
    category: 'basico',
    priceType: 'fixed',
    price: 9000,
    maxEmployees: 200,
    features: [
      'Até 200 colaboradores',
      'Orientações nutricionais',
      '1 palestra',
      'Relatórios básicos',
      'Suporte por email'
    ]
  },
  {
    id: 'corporativo-premium-mensal',
    name: 'Corporativo Premium Mensal',
    type: 'mensal',
    category: 'premium',
    priceType: 'perEmployee',
    price: 80,
    maxEmployees: 200,
    features: [
      'Até 200 colaboradores',
      'Consultas mensais',
      'Palestras bimestrais',
      'Relatórios básicos',
      'Suporte por email'
    ]
  },
  {
    id: 'corporativo-premium-avulso',
    name: 'Corporativo Premium Avulso',
    type: 'avulso',
    category: 'premium',
    priceType: 'perEmployee',
    price: 90,
    maxEmployees: 200,
    features: [
      'Até 200 colaboradores',
      'Consultas mensais',
      '1 palestra',
      'Relatórios básicos',
      'Suporte por email'
    ]
  }
]

function CalculadoraCorporativa() {
  const [numEmployees, setNumEmployees] = useState<number>(25)
  const [selectedPlan, setSelectedPlan] = useState<PlanOption | null>(null)
  const [filteredPlans, setFilteredPlans] = useState<PlanOption[]>([])

  useEffect(() => {
    // Filtrar planos baseado no número de funcionários
    const hasTierForCount = (plan: PlanOption, count: number) => !!tierPrices[plan.id]?.[count]
    const availablePlans = planOptions.filter(
      (plan) => numEmployees <= plan.maxEmployees || hasTierForCount(plan, numEmployees)
    )
    setFilteredPlans(availablePlans)
    
    // Se o plano selecionado não está mais disponível, limpar seleção
    if (
      selectedPlan &&
      !(numEmployees <= selectedPlan.maxEmployees || hasTierForCount(selectedPlan, numEmployees))
    ) {
      setSelectedPlan(null)
    }
  }, [numEmployees, selectedPlan])

  const calculatePrice = (plan: PlanOption): number => {
    const tier = tierPrices[plan.id]?.[numEmployees]
    if (typeof tier === 'number') {
      return tier * numEmployees
    }
    if (plan.priceType === 'fixed') {
      return plan.price
    }
    return plan.price * numEmployees
  }

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const getPricePerEmployee = (plan: PlanOption): number => {
    const tier = tierPrices[plan.id]?.[numEmployees]
    if (typeof tier === 'number') {
      return tier
    }
    const totalPrice = calculatePrice(plan)
    return totalPrice / numEmployees
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Calculator className="h-8 w-8 text-[#4AB0D9]" />
          <h2 className="text-3xl font-bold text-[#1E1D40]">
            Calculadora de Planos Corporativos
          </h2>
        </div>
        <p className="text-lg text-[#1E1D40]/70">
          Simule o investimento em nutrição para sua empresa
        </p>
      </div>

      {/* Input de número de funcionários */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1E1D40]">
            <Users className="h-5 w-5" />
            Quantos funcionários sua empresa possui?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="employees" className="text-sm font-medium">
                Número de funcionários:
              </Label>
              <Input
                id="employees"
                type="number"
                min="1"
                max="500"
                value={numEmployees}
                onChange={(e) => setNumEmployees(Number(e.target.value))}
                className="w-32"
              />
            </div>
            <div className="flex gap-2">
              {[10, 25, 50, 100, 200].map((num) => (
                <Button
                  key={num}
                  variant={numEmployees === num ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNumEmployees(num)}
                  className={numEmployees === num ? "bg-[#4AB0D9] hover:bg-[#4AB0D9]/90" : ""}
                >
                  {num}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planos disponíveis */}
      {filteredPlans.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => {
            const totalPrice = calculatePrice(plan)
            const pricePerEmployee = getPricePerEmployee(plan)
            const isSelected = selectedPlan?.id === plan.id

            return (
              <Card
                key={plan.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  isSelected 
                    ? 'ring-2 ring-[#4AB0D9] shadow-lg' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedPlan(plan)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-[#1E1D40]">
                      {plan.name}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Badge 
                        variant={plan.category === 'premium' ? 'default' : 'secondary'}
                        className={plan.category === 'premium' ? 'bg-[#4AB0D9]' : ''}
                      >
                        {plan.category === 'premium' ? 'Premium' : 'Básico'}
                      </Badge>
                      <Badge variant="outline">
                        {plan.type === 'mensal' ? 'Mensal' : 'Avulso'}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-[#4AB0D9]">
                      {formatPrice(totalPrice)}
                    </div>
                    <div className="text-sm text-[#1E1D40]/60">
                      {formatPrice(pricePerEmployee)} por funcionário
                      {plan.type === 'mensal' && '/mês'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-xs text-[#1E1D40]/80">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Resumo da simulação */}
      {selectedPlan && (
        <Card className="shadow-lg border-0 bg-gradient-to-r from-[#4AB0D9]/10 to-[#1E1D40]/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1E1D40]">
              <DollarSign className="h-5 w-5" />
              Resumo da Simulação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#4AB0D9] mb-1">
                  {numEmployees}
                </div>
                <div className="text-sm text-[#1E1D40]/70">
                  Funcionários
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#4AB0D9] mb-1">
                  {formatPrice(calculatePrice(selectedPlan))}
                </div>
                <div className="text-sm text-[#1E1D40]/70">
                  Investimento Total
                  {selectedPlan.type === 'mensal' && '/mês'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#4AB0D9] mb-1">
                  {formatPrice(getPricePerEmployee(selectedPlan))}
                </div>
                <div className="text-sm text-[#1E1D40]/70">
                  Por Funcionário
                  {selectedPlan.type === 'mensal' && '/mês'}
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  className="bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white"
                  size="lg"
                  onClick={() => {
                    const totalPrice = calculatePrice(selectedPlan)
                    const pricePerEmployee = getPricePerEmployee(selectedPlan)
                    const planType = selectedPlan.type === 'mensal' ? 'Mensal' : 'Avulso'
                    const planCategory = selectedPlan.category === 'premium' ? 'Premium' : 'Básico'
                    
                    const message = `Olá! Gostaria de solicitar uma proposta para o plano corporativo:

📋 *Detalhes da Simulação:*
• Plano: ${selectedPlan.name}
• Categoria: ${planCategory} - ${planType}
• Número de funcionários: ${numEmployees}
• Investimento total: ${formatPrice(totalPrice)}${selectedPlan.type === 'mensal' ? '/mês' : ''}
• Valor por funcionário: ${formatPrice(pricePerEmployee)}${selectedPlan.type === 'mensal' ? '/mês' : ''}

📝 *Recursos inclusos:*
${selectedPlan.features.map(feature => `• ${feature}`).join('\n')}

Aguardo retorno para mais informações!`

                    const encodedMessage = encodeURIComponent(message)
                    const whatsappUrl = `https://wa.me/5579998134938?text=${encodedMessage}`
                    console.log('WhatsApp URL:', whatsappUrl)
                    
                    // Tentar abrir em nova aba
                    const newWindow = window.open(whatsappUrl, '_blank')
                    
                    // Se não conseguir abrir (popup blocker), redirecionar na mesma aba
                    if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
                      window.location.href = whatsappUrl
                    }
                  }}
                >
                  Solicitar Proposta
                </Button>
                <Button 
                  variant="outline" 
                  className="border-[#1E1D40] text-[#1E1D40] hover:bg-[#1E1D40] hover:text-white"
                  size="lg"
                  onClick={() => {
                    const message = `Olá! Gostaria de falar com um consultor sobre os planos corporativos da Busca Nutri. Podem me ajudar?`
                    const encodedMessage = encodeURIComponent(message)
                    const whatsappUrl = `https://wa.me/5579998134938?text=${encodedMessage}`
                    console.log('WhatsApp URL (Consultor):', whatsappUrl)
                    
                    // Tentar abrir em nova aba
                    const newWindow = window.open(whatsappUrl, '_blank')
                    
                    // Se não conseguir abrir (popup blocker), redirecionar na mesma aba
                    if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
                      window.location.href = whatsappUrl
                    }
                  }}
                >
                  Falar com Consultor
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações adicionais */}
      <Card className="shadow-lg border-0">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold text-[#1E1D40]">
              Precisa de um plano personalizado?
            </h3>
            <p className="text-[#1E1D40]/70">
              Para empresas com mais de 200 funcionários, oferecemos planos Enterprise 
              totalmente personalizados com equipe dedicada e suporte 24/7.
            </p>
            <Button 
              variant="outline" 
              className="border-[#4AB0D9] text-[#4AB0D9] hover:bg-[#4AB0D9] hover:text-white"
              onClick={() => {
                const message = `Olá! Preciso de um plano Enterprise personalizado para minha empresa com mais de 200 funcionários. Podem me ajudar com uma proposta?`
                const encodedMessage = encodeURIComponent(message)
                const whatsappUrl = `https://wa.me/5579998134938?text=${encodedMessage}`
                console.log('Tentando abrir WhatsApp Enterprise:', whatsappUrl)
                
                const newWindow = window.open(whatsappUrl, '_blank')
                if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
                  console.log('Popup bloqueado, redirecionando na mesma aba')
                  window.location.href = whatsappUrl
                }
              }}
            >
              Consultar Plano Enterprise
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CalculadoraCorporativa