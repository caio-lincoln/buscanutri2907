
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BookingForm } from './components/booking-form'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { ChevronRight, MapPin, User } from 'lucide-react'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AgendarPresencialPage(props: PageProps) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  
  // 1. Authenticate User
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // 2. Get Patient Profile
  const { data: patient, error: patientError } = await supabase
    .from('patient_profiles')
    .select('id, full_name')
    .eq('user_id', user.id)
    .single()

  if (patientError || !patient) {
    // If no profile, maybe redirect to onboarding?
    redirect('/dashboard/paciente/perfil')
  }

  const nutritionistId = searchParams.nutritionist_id as string

  // 3. If no nutritionist selected, list available ones
  if (!nutritionistId) {
    // Fetch nutritionists who have presencial service
    const { data: nutritionists } = await supabase
      .from('nutritionist_profiles')
      .select(`
        id, 
        full_name, 
        specialties, 
        profile_image_url, 
        atendimento_presencial,
        nutritionist_addresses (
           id, city, state, neighborhood
        )
      `)
      .eq('atendimento_presencial', true)
      .limit(20)

    return (
      <div className="container mx-auto p-6 max-w-5xl">
         <div className="mb-6">
          <div className="flex items-center text-sm text-muted-foreground mb-4">
            <Link href="/dashboard/paciente" className="hover:text-primary">Dashboard</Link>
            <ChevronRight className="w-4 h-4 mx-1" />
            <span className="font-medium text-foreground">Agendar Presencial</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Agendamento Presencial</h1>
          <p className="text-muted-foreground mt-2">
            Selecione um profissional disponível para atendimento presencial.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nutritionists?.map((nut) => (
            <Link key={nut.id} href={`/dashboard/paciente/agendar/presencial?nutritionist_id=${nut.id}`}>
              <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100">
                    {nut.profile_image_url ? (
                      <Image
                        src={nut.profile_image_url}
                        alt={nut.full_name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-gray-400 m-auto mt-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{nut.full_name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{nut.specialties}</p>
                  </div>
                  {nut.nutritionist_addresses && nut.nutritionist_addresses.length > 0 && (
                     <div className="text-xs text-gray-500 flex items-center gap-1 mt-2">
                        <MapPin className="w-3 h-3" />
                        {nut.nutritionist_addresses[0].city}/{nut.nutritionist_addresses[0].state}
                     </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
          {(!nutritionists || nutritionists.length === 0) && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Nenhum profissional encontrado para atendimento presencial no momento.
            </div>
          )}
        </div>
      </div>
    )
  }

  // 4. Fetch Selected Nutritionist Details
  const { data: nutritionist, error: nutError } = await supabase
    .from('nutritionist_profiles')
    .select(`
      id, 
      full_name, 
      specialties, 
      profile_image_url, 
      atendimento_presencial,
      nutritionist_addresses (
        id, full_address, neighborhood, city, state, zip_code, is_main
      )
    `)
    .eq('id', nutritionistId)
    .single()

  if (nutError || !nutritionist) {
    return (
       <div className="container mx-auto p-6 text-center">
         <h2 className="text-xl font-bold text-destructive">Profissional não encontrado</h2>
         <Link href="/dashboard/paciente/agendar/presencial" className="text-primary hover:underline mt-4 block">
           Voltar para lista
         </Link>
       </div>
    )
  }

  // 5. Validation: Must accept presencial
  if (!nutritionist.atendimento_presencial) {
     return (
       <div className="container mx-auto p-6 text-center">
         <h2 className="text-xl font-bold text-destructive">Este profissional não realiza atendimento presencial.</h2>
         <Link href="/dashboard/paciente" className="text-primary hover:underline mt-4 block">
           Voltar ao Dashboard
         </Link>
       </div>
    )
  }

  // 6. Validation: Must have address
  if (!nutritionist.nutritionist_addresses || nutritionist.nutritionist_addresses.length === 0) {
      return (
       <div className="container mx-auto p-6 text-center">
         <h2 className="text-xl font-bold text-destructive">Profissional sem endereço cadastrado.</h2>
         <p className="text-muted-foreground">Por favor, entre em contato com o suporte ou escolha outro profissional.</p>
         <Link href="/dashboard/paciente/agendar/presencial" className="text-primary hover:underline mt-4 block">
           Escolher outro profissional
         </Link>
       </div>
    )
  }

  // Transform addresses to match component interface
  const formattedNutritionist = {
    ...nutritionist,
    addresses: nutritionist.nutritionist_addresses || []
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-muted-foreground mb-6">
        <Link href="/dashboard/paciente" className="hover:text-primary">Dashboard</Link>
        <ChevronRight className="w-4 h-4 mx-1" />
        <Link href="/dashboard/paciente/agendar/presencial" className="hover:text-primary">Agendar</Link>
        <ChevronRight className="w-4 h-4 mx-1" />
        <span className="font-medium text-foreground">Presencial</span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Agendamento Presencial</h1>
        <p className="text-muted-foreground mt-2">
          Confirme os detalhes do seu atendimento com {nutritionist.full_name}.
        </p>
      </div>

      <BookingForm 
        nutritionist={formattedNutritionist} 
        patientId={patient.id} 
      />
    </div>
  )
}
