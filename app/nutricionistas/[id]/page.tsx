import { getNutritionistById } from "@/lib/nutritionist-service"
import NutritionistProfilePageClient from "./NutritionistProfileClient"
import { notFound } from "next/navigation"

interface PageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const nutritionist = await getNutritionistById(id)

  if (!nutritionist) {
    return {
      title: "Nutricionista não encontrado",
    }
  }

  return {
    title: `${nutritionist.full_name} - Nutricionista em ${nutritionist.address || nutritionist.specialties?.[0]}`,
    description: nutritionist.bio,
    openGraph: {
      title: `${nutritionist.full_name} - Busca Nutri`,
      description: nutritionist.bio,
      images: [
        {
          url: nutritionist.profile_image_url || "/placeholder.svg",
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

  if (!nutritionist) {
    notFound()
  }

  return <NutritionistProfilePageClient nutritionist={nutritionist} />
}
