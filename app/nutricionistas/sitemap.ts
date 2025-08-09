import type { MetadataRoute } from "next"

// Dados dos nutricionistas (mesmo array da página principal)
const nutritionists = [
  { id: 1, name: "Dra. Ana Silva", specialty: "Nutrição Clínica", location: "São Paulo, SP" },
  { id: 2, name: "Dr. Carlos Santos", specialty: "Nutrição Esportiva", location: "Rio de Janeiro, RJ" },
  { id: 3, name: "Dra. Maria Oliveira", specialty: "Nutrição Infantil", location: "Belo Horizonte, MG" },
  { id: 4, name: "Dr. João Ferreira", specialty: "Emagrecimento", location: "Brasília, DF" },
  { id: 5, name: "Dra. Fernanda Costa", specialty: "Nutrição Vegana", location: "Porto Alegre, RS" },
  { id: 6, name: "Dr. Rafael Lima", specialty: "Distúrbios Alimentares", location: "Salvador, BA" },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://buscanutri.com"

  // Página principal de nutricionistas
  const mainPage = {
    url: `${baseUrl}/nutricionistas`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.9,
  }

  // Páginas individuais dos nutricionistas
  const nutritionistPages = nutritionists.map((nutritionist) => ({
    url: `${baseUrl}/nutricionistas/${nutritionist.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  return [mainPage, ...nutritionistPages]
}

