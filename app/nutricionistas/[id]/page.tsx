import { getNutritionistById } from '@/lib/nutritionist-service'
import NutritionistProfilePageClient from './NutritionistProfileClient'
import { notFound } from 'next/navigation'
import { generateImageVariants } from '@/lib/image-variants'

interface PageProps {
  params: {
    id: string
  }
}

// Helper function to safely convert values to arrays
function toArray(value: any): string[] {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    try {
      // Tenta tratar string JSON ('["A","B"]')
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed
    } catch {
      /* não era JSON, continua */
    }
    // Fallback: separa por vírgulas
    return value
      .split(',')
      .map(v => v.trim())
      .filter(Boolean)
  }
  return []
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const nutritionist = await getNutritionistById(id)

  if (!nutritionist) {
    return {
      title: 'Nutricionista não encontrado',
    }
  }

  return {
    title: `${nutritionist.full_name} - Nutricionista em ${nutritionist.address || nutritionist.specialties?.[ 0 ]}`,
    description: nutritionist.bio,
    openGraph: {
      title: `${nutritionist.full_name} - Busca Nutri`,
      description: nutritionist.bio,
      images: [
        {
          url: nutritionist?.profile_image_url || '/placeholder.svg',
          width: 400,
          height: 400,
          alt: nutritionist.full_name,
        },
      ],
    },
  }
}

// Esta função é opcional, mas pode ser usada para gerar páginas estáticas em build time
// export async function generateStaticParams() {
//   const nutritionists = await getAllNutritionists(); // Supondo que você tenha uma função para buscar todos os IDs
//   return nutritionists.map((n) => ({
//     id: n.id.toString(),
//   }));
// }

export default async function NutritionistProfilePage({ params }: PageProps) {
  const { id } = await params
  const nutritionist = await getNutritionistById(id)
  console.log("🚀 ~ NutritionistProfilePage ~ nutritionist:", nutritionist)

  if (!nutritionist) {
    notFound()
  }

  // Generate structured data on the server to avoid hydration mismatch
  const formattedName = nutritionist.full_name || 'Nutricionista Desconhecido'
  const formattedFullBio = nutritionist.bio || 'Sem biografia disponível.'
  const formattedEducation = nutritionist.academic_background || 'Formação não informada.'
  const formattedCrn = nutritionist.crn || 'CRN não informado.'
  const formattedPhone = nutritionist.phone || 'Telefone não informado.'
  const formattedEmail = nutritionist.email || 'Email não informado.'
  const formattedWebsite = nutritionist.website || ''
  const formattedRating = nutritionist.rating?.toFixed(1) || '0.0'
  const formattedReviews = nutritionist.total_reviews || 0
  const formattedAddress = nutritionist.address || 'Localização não informada'

  // Generate image variants on server
  const avatarVariants = generateImageVariants(
    nutritionist?.profile_image_url,
    'avatar',
    nutritionist?.updated_at
  )
  const formattedImage = avatarVariants.medium

  const formattedSpecializations = toArray(nutritionist.specialties)

  // Campos individuais para serviços (usando os novos campos)
  const formattedServices = [
    ...(nutritionist.service_consultation_price
      ? [
        {
          name: 'Consulta Nutricional',
          price: nutritionist.service_consultation_price,
          description: 'Consulta completa com avaliação nutricional',
        },
      ]
      : []),
    ...(nutritionist.service_followup_price
      ? [
        {
          name: 'Consulta de Retorno',
          price: nutritionist.service_followup_price,
          description: 'Acompanhamento e ajustes no plano alimentar',
        },
      ]
      : []),
    ...(nutritionist.service_meal_plan_price
      ? [
        {
          name: 'Plano Alimentar',
          price: nutritionist.service_meal_plan_price,
          description: 'Elaboração de plano alimentar personalizado',
        },
      ]
      : []),
  ]

  // Structured Data para SEO - gerado no servidor
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: formattedName,
    jobTitle: 'Nutricionista',
    description: formattedFullBio,
    image: formattedImage,
    address: {
      '@type': 'PostalAddress',
      streetAddress: formattedAddress,
      addressLocality: nutritionist.address?.split(',')[ 0 ]?.trim() || '',
      addressRegion:
        nutritionist.address?.split(',').pop()?.trim().split(' ')[ 0 ]?.trim() ||
        '',
    },
    telephone: formattedPhone,
    email: formattedEmail,
    url: formattedWebsite,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: formattedRating,
      reviewCount: formattedReviews,
      bestRating: 5,
      worstRating: 1,
    },
    offers: formattedServices.map(service => ({
      '@type': 'Offer',
      name: service.name,
      description: service.description || '',
      price: service.price,
      priceCurrency: 'BRL',
    })),
    knowsAbout: formattedSpecializations,
    alumniOf: {
      '@type': 'Organization',
      name: formattedEducation.split(' - ')[ 0 ] || 'Instituição de Ensino',
    },
    hasCredential: {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: formattedCrn,
    },
    review: [], // Empty array to avoid hydration issues
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <NutritionistProfilePageClient nutritionist={nutritionist} />
    </>
  )
}
