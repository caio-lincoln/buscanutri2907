'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export function BackNavigation() {
  const router = useRouter()

  return (
    <div className="flex flex-col h-full space-y-8">
      {/* Logo Placeholder - Can be replaced with actual Logo component */}
      <div className="hidden lg:flex items-center gap-2 font-bold text-xl text-primary tracking-tight">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          BN
        </div>
        BuscaNutri
      </div>

      <div className="space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/dashboard/paciente/agendar')} 
          className="w-fit lg:w-full justify-start pl-0 hover:bg-transparent hover:text-primary group text-base font-medium -ml-3 lg:ml-0"
        >
          <div className="bg-muted rounded-full p-2 mr-3 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          </div>
          Voltar para agendamentos
        </Button>
        
        <div className="hidden lg:block space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground/90">
            Agende sua consulta
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Escolha o melhor dia e horário para seu atendimento. O processo é simples, rápido e 100% seguro.
          </p>
        </div>

        {/* Steps Indicator (Optional Visual Aid) */}
        <div className="hidden lg:flex flex-col gap-4 pt-8">
          <div className="flex items-center gap-3 text-primary font-medium">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-sm shadow-primary/20">1</div>
            <span>Escolha o Profissional</span>
          </div>
          <div className="w-px h-6 bg-border ml-4" />
          <div className="flex items-center gap-3 text-primary font-medium">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-sm shadow-primary/20">2</div>
            <span>Data e Horário</span>
          </div>
          <div className="w-px h-6 bg-border ml-4" />
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="h-8 w-8 rounded-full border-2 border-muted flex items-center justify-center text-sm font-bold">3</div>
            <span>Pagamento</span>
          </div>
        </div>
      </div>
    </div>
  )
}
