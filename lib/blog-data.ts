import { v4 as uuidv4 } from "uuid"
import { getNutritionistBadges, type NutritionistBadge } from "./badge-service" // Importar o serviço de insígnias

export interface BlogPost {
  id: string
  title: string
  excerpt: string
  content: string
  image: string // URL da imagem de capa
  author: string // Nome do autor
  authorId: string // ID do autor (para buscar insígnias)
  authorBio: string
  authorImage: string
  date: string // Formato YYYY-MM-DD
  category: string
  tags: string[]
  readTime: string // Ex: "5 min de leitura"
  views: number
  featured: boolean
  badges?: NutritionistBadge[] // Adicionar badges ao tipo
}

export const blogCategories = [
  "Alimentação Infantil",
  "Emagrecimento",
  "Receitas Saudáveis",
  "Nutrição Esportiva",
  "Saúde Digestiva",
  "Doenças Crônicas",
  "Vegetarianismo/Veganismo",
  "Bem-Estar",
]

// Mock de dados de blog
let blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Os Benefícios da Alimentação Consciente",
    excerpt: "Descubra como a alimentação consciente pode transformar sua relação com a comida e seu corpo.",
    content:
      "A alimentação consciente, ou 'mindful eating', é uma abordagem que envolve prestar atenção plena à experiência de comer, sem julgamento. Isso inclui notar os sabores, texturas, cheiros e a forma como seu corpo reage aos alimentos. Ao praticar a alimentação consciente, você pode desenvolver uma relação mais saudável com a comida, reconhecer os sinais de fome e saciedade, e desfrutar mais de cada refeição. Comece prestando atenção aos seus sentidos, comendo devagar e saboreando cada mordida. Evite distrações como televisão ou celular durante as refeições. Com o tempo, você notará uma melhora na sua digestão, na sua energia e na sua percepção do que seu corpo realmente precisa.",
    image: "/placeholder.svg?height=400&width=800",
    author: "Dra. Ana Paula",
    authorId: "4363a1ad-149b-4fcd-b725-dffa33109493", // Real nutritionist ID
    authorBio: "Nutricionista especializada em comportamento alimentar e bem-estar.",
    authorImage: "/placeholder.svg?height=100&width=100",
    date: "2023-10-26",
    category: "Bem-Estar",
    tags: ["mindfulness", "saúde", "hábitos"],
    readTime: "7 min de leitura",
    views: 1250,
    featured: true,
  },
  {
    id: "2",
    title: "Receitas Rápidas e Saudáveis para o Dia a Dia",
    excerpt: "Ideias práticas para refeições nutritivas que cabem na sua rotina agitada.",
    content:
      "Manter uma alimentação saudável pode ser um desafio com a correria do dia a dia. No entanto, com um bom planejamento e algumas receitas inteligentes, é possível comer bem sem gastar horas na cozinha. Que tal experimentar um bowl de quinoa com vegetais assados e grão de bico? Ou talvez um wrap integral com frango desfiado e salada fresca? A chave é ter ingredientes versáteis à mão e não ter medo de experimentar combinações simples. Prepare alguns itens básicos, como grãos cozidos e vegetais picados, no início da semana para agilizar o preparo das refeições. Pequenas mudanças podem fazer uma grande diferença na sua saúde e bem-estar.",
    image: "/placeholder.svg?height=400&width=800",
    author: "Dr. João Silva",
    authorId: "eef8ebce-68c3-4fc8-b1d6-f97f6f9d3cfd", // Real nutritionist ID
    authorBio: "Nutricionista esportivo e criador de conteúdo fitness.",
    authorImage: "/placeholder.svg?height=100&width=100",
    date: "2023-10-20",
    category: "Receitas Saudáveis",
    tags: ["receitas", "praticidade", "nutrição"],
    readTime: "5 min de leitura",
    views: 980,
    featured: false,
  },
  {
    id: "3",
    title: "Desvendando os Mitos da Dieta Low Carb",
    excerpt: "Entenda o que é verdade e o que é mito sobre a dieta com baixo teor de carboidratos.",
    content:
      "A dieta low carb ganhou muita popularidade nos últimos anos, mas ainda existem muitos mitos e informações desencontradas sobre ela. É verdade que cortar carboidratos drasticamente pode levar à perda de peso rápida, mas é crucial entender que nem todos os carboidratos são iguais. Carboidratos complexos, encontrados em vegetais, frutas e grãos integrais, são essenciais para a saúde. O mito de que 'carboidrato engorda' é simplista; o que realmente importa é a qualidade e a quantidade. Uma dieta low carb bem planejada pode ser benéfica para algumas pessoas, mas deve ser sempre acompanhada por um profissional para evitar deficiências nutricionais e garantir a sustentabilidade a longo prazo.",
    image: "/placeholder.svg?height=400&width=800",
    author: "Dra. Carla Mendes",
    authorId: "881d4a33-4cb0-4683-9534-2bdbc81e35ef", // Real nutritionist ID
    authorBio: "Nutricionista clínica com foco em reeducação alimentar.",
    authorImage: "/placeholder.svg?height=100&width=100",
    date: "2023-10-15",
    category: "Emagrecimento",
    tags: ["dieta", "low carb", "mitos"],
    readTime: "6 min de leitura",
    views: 1500,
    featured: true,
  },
  {
    id: "4",
    title: "Nutrição para Crianças: Dicas para Pais",
    excerpt: "Como garantir que seus filhos recebam todos os nutrientes necessários para crescerem saudáveis.",
    content:
      "A nutrição infantil é um pilar fundamental para o desenvolvimento saudável das crianças. Oferecer uma variedade de alimentos coloridos, ricos em vitaminas e minerais, é essencial. Incentive o consumo de frutas, vegetais, proteínas magras e grãos integrais desde cedo. Evite alimentos processados, ricos em açúcar e gorduras trans. Transforme a hora da refeição em um momento prazeroso e de aprendizado, envolvendo as crianças no preparo dos alimentos. Lembre-se que o exemplo dos pais é poderoso: coma de forma saudável e seus filhos tenderão a seguir o mesmo caminho. Em caso de dúvidas, consulte um nutricionista especializado em pediatria.",
    image: "/placeholder.svg?height=400&width=800",
    author: "Dra. Ana Paula",
    authorId: "4363a1ad-149b-4fcd-b725-dffa33109493", // Real nutritionist ID
    authorBio: "Nutricionista especializada em comportamento alimentar e bem-estar.",
    authorImage: "/placeholder.svg?height=100&width=100",
    date: "2023-10-10",
    category: "Alimentação Infantil",
    tags: ["crianças", "saúde infantil", "pais"],
    readTime: "8 min de leitura",
    views: 800,
    featured: false,
  },
  {
    id: "5",
    title: "O Papel da Nutrição na Saúde Mental",
    excerpt: "A conexão entre o que você come e seu bem-estar psicológico.",
    content:
      "A relação entre alimentação e saúde mental é cada vez mais reconhecida pela ciência. O intestino é frequentemente chamado de 'segundo cérebro' devido à sua vasta rede de neurônios e à produção de neurotransmissores que afetam o humor. Uma dieta rica em alimentos integrais, como frutas, vegetais, grãos e peixes ricos em ômega-3, pode promover uma microbiota intestinal saudável e, consequentemente, influenciar positivamente o humor e reduzir o risco de transtornos como depressão e ansiedade. Por outro lado, dietas ricas em alimentos processados e açúcares podem ter o efeito oposto. Priorize alimentos que nutrem tanto o corpo quanto a mente.",
    image: "/placeholder.svg?height=400&width=800",
    author: "Dr. João Silva",
    authorId: "eef8ebce-68c3-4fc8-b1d6-f97f6f9d3cfd", // Real nutritionist ID
    authorBio: "Nutricionista esportivo e criador de conteúdo fitness.",
    authorImage: "/placeholder.svg?height=100&width=100",
    date: "2023-10-05",
    category: "Bem-Estar",
    tags: ["saúde mental", "intestino", "dieta"],
    readTime: "9 min de leitura",
    views: 1100,
    featured: false,
  },
]

// Função para buscar todos os posts do blog, incluindo as insígnias do autor
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  // Em um cenário real, você buscaria os posts do banco de dados
  // e depois buscaria as insígnias para cada autor.
  // Para o mock, vamos simular a busca de insígnias.
  const postsWithBadges = await Promise.all(
    blogPosts.map(async (post) => {
      const badges = await getNutritionistBadges(post.authorId)
      return { ...post, badges: badges.map((nb) => nb.badge) } // Retorna apenas os objetos de insígnia
    }),
  )
  return postsWithBadges.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// Função para buscar um post por ID, incluindo as insígnias do autor
export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  const post = blogPosts.find((p) => p.id === id)
  if (post) {
    const badges = await getNutritionistBadges(post.authorId)
    return { ...post, badges: badges.map((nb) => nb.badge) }
  }
  return null
}

// Função para buscar posts por autor, incluindo as insígnias do autor
export function getBlogPostsByAuthor(authorId: string): BlogPost[] {
  // Para o mock, não estamos buscando insígnias aqui para simplificar,
  // mas em um app real, você faria a mesma lógica de getAllBlogPosts
  // para adicionar as insígnias aos posts do autor.
  return blogPosts
    .filter((p) => p.authorId === authorId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// Função para adicionar um novo post
export function addBlogPost(newPostData: Omit<BlogPost, "id" | "date" | "views" | "badges">): BlogPost {
  const newPost: BlogPost = {
    id: uuidv4(),
    date: new Date().toISOString().split("T")[0], // Data atual
    views: 0,
    ...newPostData,
    badges: [], // Novas postagens começam sem insígnias (serão carregadas dinamicamente)
  }
  blogPosts.push(newPost)
  return newPost
}

// Função para atualizar um post existente
export function updateBlogPost(updatedPost: BlogPost): BlogPost | null {
  const index = blogPosts.findIndex((p) => p.id === updatedPost.id)
  if (index !== -1) {
    blogPosts[index] = { ...updatedPost, badges: [] } // Remove badges para evitar duplicação no mock
    return blogPosts[index]
  }
  return null
}

// Função para deletar um post
export function deleteBlogPost(id: string): boolean {
  const initialLength = blogPosts.length
  blogPosts = blogPosts.filter((p) => p.id !== id)
  return blogPosts.length < initialLength
}
