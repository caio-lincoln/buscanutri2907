
import { NutritionistList } from '@/components/agendar/NutritionistList'
import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Agendar Consulta | BuscaNutri',
  description: 'Encontre os melhores nutricionistas e agende sua consulta online.',
}

export default function AgendarPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      <div className="flex flex-col gap-4">
        <Link href="/dashboard/paciente">
          <Button variant="ghost" className="pl-0 hover:pl-2 transition-all gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </Link>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Encontre seu Nutricionista
          </h1>
          <p className="text-muted-foreground text-lg">
            Agende consultas online ou presenciais com especialistas verificados.
          </p>
        </div>
      </div>
      
      <NutritionistList />
    </div>
  )
}
