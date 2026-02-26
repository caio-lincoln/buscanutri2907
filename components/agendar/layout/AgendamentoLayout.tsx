'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AgendamentoLayoutProps {
  nav: ReactNode
  professionalSummary: ReactNode
  calendarSelector: ReactNode
  paymentPanel: ReactNode
  className?: string
}

export function AgendamentoLayout({
  nav,
  professionalSummary,
  calendarSelector,
  paymentPanel,
  className
}: AgendamentoLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-background box-border", className)}>
      {/* 
        GRID EM 3 COLUNAS FUNCIONAIS (SEM ESPAÇOS VAZIOS)
        Desktop (>= 1024px)
        grid-template-columns: 260px minmax(480px, 1fr) 420px;
      */}
      <div className={cn(
        // Base: Flex Column (Mobile)
        "flex flex-col gap-6 p-4",
        // Tablet: Grid 2 cols
        "md:grid md:grid-cols-[1fr_380px] md:gap-8 md:p-8 md:max-w-screen-xl md:mx-auto",
        // Desktop: Grid 3 cols (Strict Requirements)
        "lg:grid lg:grid-cols-[260px_minmax(480px,1fr)_420px] lg:gap-10 lg:p-8 lg:max-w-[1440px] lg:mx-auto lg:items-start"
      )}>
        
        {/* COLUNA ESQUERDA — NAVEGAÇÃO (260px) */}
        <div className={cn(
          "w-full flex flex-col gap-6",
          // Mobile Order: 1
          "order-1",
          // Tablet: Top full width? No, let's put profile + calendar left, payment right. Nav separate?
          // Let's stick to user request:
          // Tablet: Left (Profile + Calendar), Right (Payment). Nav usually top or hidden.
          // For now, let's put Nav at top for tablet or integrated.
          "md:col-span-2 md:mb-4",
          // Desktop: Sticky Left
          "lg:col-span-1 lg:col-start-1 lg:row-start-1 lg:mb-0 lg:sticky lg:top-0 lg:h-screen lg:pt-8"
        )}>
          {nav}
        </div>

        {/* COLUNA CENTRAL — AÇÃO PRINCIPAL (FOCO TOTAL) */}
        <div className={cn(
          "w-full flex flex-col gap-8",
          // Mobile Order: 2 (Profile) -> 3 (Calendar)
          "order-2",
          // Tablet: Col 1
          "md:col-span-1 md:order-2",
          // Desktop: Col 2
          "lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:pt-8"
        )}>
          <div className="w-full">
            {professionalSummary}
          </div>
          <div className="w-full">
            {calendarSelector}
          </div>
        </div>

        {/* COLUNA DIREITA — FECHAMENTO (420px) */}
        <div className={cn(
          "w-full",
          // Mobile Order: 4
          "order-3 pb-24 md:pb-0", // Padding bottom for mobile fixed button if needed
          // Tablet: Col 2
          "md:col-span-1 md:order-3",
          // Desktop: Sticky Right
          "lg:col-span-1 lg:col-start-3 lg:row-start-1 lg:sticky lg:top-6 lg:pt-8"
        )}>
           {paymentPanel}
        </div>

      </div>
    </div>
  )
}
