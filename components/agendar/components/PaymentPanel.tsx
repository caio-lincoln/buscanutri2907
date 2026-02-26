'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Clock, CreditCard, Ticket, CheckCircle2, AlertCircle, Lock, Barcode, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAppointment } from '@/hooks/useAppointment'
import type { Nutritionist } from '@/hooks/useNutritionists'
import type { AvailableSlot } from '@/hooks/useAvailability'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface PaymentPanelProps {
  nutritionist: Nutritionist
  selectedSlot: AvailableSlot | null
}

export function PaymentPanel({ nutritionist, selectedSlot }: PaymentPanelProps) {
  if (process.env.NODE_ENV === 'development') {
    console.log('PaymentPanel Nutritionist:', nutritionist) // Debug log
  }
  const { createAppointment, loading } = useAppointment()
  const [coupon, setCoupon] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [discountDetails, setDiscountDetails] = useState<{
    type: 'percent' | 'amount'
    value: number
    code: string
  } | null>(null)
  
  const availableMethods = useMemo(() => {
    const methods: string[] = []
    if (nutritionist.payment_methods) {
      const p = nutritionist.payment_methods.toLowerCase()
      console.log('Payment Methods Raw:', p) // Debug log
      
      if (p.includes('cartao') || p.includes('cartão') || p.includes('credit')) methods.push('credit_card')
      if (p.includes('boleto')) methods.push('boleto')
      if (p.includes('pix')) methods.push('pix')
    }
    
    // Default fallback if no known methods found
    if (methods.length === 0) methods.push('credit_card')
    
    console.log('Available Methods Parsed:', methods) // Debug log
    return methods
  }, [nutritionist.payment_methods])

  const [paymentMethod, setPaymentMethod] = useState(availableMethods[0])


  const price = nutritionist.consultation_price || 0

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return
    
    setValidatingCoupon(true)
    try {
      const response = await fetch('/api/payments/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupon_code: coupon.trim(),
          base_amount_brl: price,
          currency: 'brl'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Cupom inválido')
      }

      if (data.valid) {
        setCouponApplied(true)
        setDiscountDetails({
          type: data.percent_off ? 'percent' : 'amount',
          value: data.percent_off || data.amount_off || 0,
          code: data.coupon_code
        })
        toast.success('Cupom aplicado com sucesso!')
      } else {
        throw new Error('Cupom inválido')
      }

    } catch (error) {
      console.error(error)
      setCouponApplied(false)
      setDiscountDetails(null)
      toast.error(error instanceof Error ? error.message : 'Erro ao validar cupom')
    } finally {
      setValidatingCoupon(false)
    }
  }

  const finalPrice = useMemo(() => {
    if (!couponApplied || !discountDetails) return price
    
    if (discountDetails.type === 'percent') {
      return price * (1 - discountDetails.value / 100)
    } else {
      return Math.max(0, price - discountDetails.value)
    }
  }, [price, couponApplied, discountDetails])

  const handleConfirm = async () => {
    if (!selectedSlot) return
    try {
      await createAppointment({
        nutritionist_id: nutritionist.id,
        scheduled_at: selectedSlot.datetime,
        price: finalPrice, // Use finalPrice to include discount if applied
      })
    } catch (err) {
      // Error handled by hook
    }
  }

  return (
    <Card className="border shadow-lg rounded-xl overflow-hidden sticky top-6">
      <div className="bg-primary/5 p-4 border-b">
        <h3 className="font-bold text-lg flex items-center gap-2 text-primary">
          <Lock className="h-4 w-4" />
          Finalizar Agendamento
        </h3>
      </div>
      
      <CardContent className="space-y-6 p-6">
        {/* Selected Slot Summary */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm font-medium text-muted-foreground uppercase tracking-wider">
            <span>Resumo</span>
            {selectedSlot && <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Selecionado</span>}
          </div>

          <div className={cn(
            "rounded-lg border p-4 transition-all duration-300",
            selectedSlot ? "bg-background border-primary/20 shadow-sm" : "bg-muted/30 border-dashed opacity-70"
          )}>
            {selectedSlot ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-lg leading-none text-foreground">
                      {format(new Date(selectedSlot.datetime), "dd 'de' MMM", { locale: ptBR })}
                    </p>
                    <p className="text-sm text-muted-foreground font-medium">
                      às {selectedSlot.time} • {nutritionist.online_consultation_available ? 'Online' : 'Presencial'}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Profissional:</span>
                  <span className="font-medium truncate max-w-[180px]">{nutritionist.full_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duração:</span>
                  <span className="font-medium">{selectedSlot.duration} min</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground space-y-2">
                <Clock className="h-8 w-8 opacity-20" />
                <p className="text-sm font-medium">Selecione um horário para ver o resumo</p>
              </div>
            )}
          </div>
        </div>

        {/* Coupon */}
        <div className="space-y-3">
          <Label htmlFor="coupon" className="text-sm font-semibold">Cupom de desconto</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Ticket className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                id="coupon" 
                placeholder="Código promocional" 
                className="pl-9 uppercase font-mono text-sm" 
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                disabled={couponApplied}
              />
            </div>
            <Button 
              variant="secondary" 
              onClick={handleApplyCoupon}
              disabled={!coupon || couponApplied || validatingCoupon}
              className="px-4 font-medium"
            >
              {validatingCoupon ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : couponApplied ? (
                'Aplicado'
              ) : (
                'Aplicar'
              )}
            </Button>
          </div>
          {couponApplied && discountDetails && (
            <p className="text-xs text-green-600 font-bold flex items-center gap-1 bg-green-50 p-2 rounded border border-green-100">
              <CheckCircle2 className="h-3 w-3" />
              Desconto de {discountDetails.type === 'percent' ? `${discountDetails.value}%` : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(discountDetails.value)} aplicado!
            </p>
          )}
        </div>

        {/* Payment Method */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Forma de pagamento</Label>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-1 gap-2">
            {availableMethods.includes('credit_card') && (
              <div className={cn(
                "flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-all hover:border-primary/50",
                paymentMethod === 'credit_card' ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "bg-card"
              )}>
                <RadioGroupItem value="credit_card" id="credit_card" />
                <Label htmlFor="credit_card" className="cursor-pointer flex items-center gap-3 w-full font-medium">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Cartão de Crédito
                </Label>
              </div>
            )}
            
            {availableMethods.includes('boleto') && (
              <div className={cn(
                "flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-all hover:border-primary/50",
                paymentMethod === 'boleto' ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "bg-card"
              )}>
                <RadioGroupItem value="boleto" id="boleto" />
                <Label htmlFor="boleto" className="cursor-pointer flex items-center gap-3 w-full font-medium">
                  <Barcode className="h-4 w-4 text-primary" />
                  Boleto Bancário
                </Label>
              </div>
            )}
          </RadioGroup>
        </div>

        {/* Total */}
        <div className="bg-muted/30 p-4 rounded-lg space-y-3 border border-dashed">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Valor da consulta</span>
            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)}</span>
          </div>
          {couponApplied && (
            <div className="flex justify-between text-sm text-green-600 font-medium">
              <span>Desconto</span>
              <span>- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price - finalPrice)}</span>
            </div>
          )}
          <Separator className="bg-border/50" />
          <div className="flex justify-between items-end pt-1">
            <span className="font-bold text-lg">Total</span>
            <span className="text-2xl font-extrabold text-primary tracking-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalPrice)}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 bg-muted/10">
        <Button 
          className="w-full text-lg h-14 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all" 
          size="lg"
          onClick={handleConfirm}
          disabled={!selectedSlot || loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processando...
            </span>
          ) : !selectedSlot ? (
            'Selecione um horário'
          ) : (
            'Confirmar Agendamento'
          )}
        </Button>
        <div className="w-full text-center mt-4">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 opacity-70">
            <Lock className="h-3 w-3" />
            Ambiente seguro e criptografado
          </p>
        </div>
      </CardFooter>
    </Card>
  )
}
