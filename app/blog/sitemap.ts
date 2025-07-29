import type { MetadataRoute } from "next"

// Mock data - em produção viria do banco de dados
const blogPosts = [
  {
    id: 1,
    title: "10 Dicas para uma Alimentação Saudável no Trabalho",
    date: "2024-01-15",
    category: "Alimentação",
  },
  {
    id: 2,
    title: "A Importância da Hidratação para o Desempenho Esportivo",
    date: "2024-01-12",
    category: "Esporte",
  },
  // Adicione mais posts conforme necessário
]

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://buscanutri.com"

  const blogRoutes = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.id}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }))

  return [
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...blogRoutes,
  ]
}
