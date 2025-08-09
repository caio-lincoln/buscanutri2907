import { v4 as uuidv4 } from "uuid"
import { getNutritionistBadges, type NutritionistBadge } from "./badge-service" // Importar o serviço de insígnias
import { createSupabaseClient } from "./supabase"

// Criar cliente Supabase que mantém a sessão do usuário
const supabase = createSupabaseClient()

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

// Função para buscar todos os posts do blog, incluindo as insígnias do autor
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  try {
    const { data: posts, error } = await supabase
      .from("blog_posts")
      .select(`
        *,
        nutritionist_profiles!inner(
          full_name,
          bio,
          profile_image_url
        )
      `)
      .eq("published", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar posts do blog:", error)
      return []
    }

    const postsWithBadges = await Promise.all(
      (posts || []).map(async (post) => {
        const badges = await getNutritionistBadges(post.author_id)
        return {
          id: post.id,
          title: post.title,
          excerpt: post.excerpt || "",
          content: post.content,
          image: post.image_url || "/placeholder.svg?height=400&width=800",
          author: post.nutritionist_profiles?.full_name || "Autor Desconhecido",
          authorId: post.author_id,
          authorBio: post.nutritionist_profiles?.bio || "",
          authorImage: post.nutritionist_profiles?.profile_image_url || "/placeholder.svg?height=100&width=100",
          date: new Date(post.created_at).toISOString().split("T")[0],
          category: post.category,
          tags: post.tags || [],
          readTime: post.read_time || "5 min de leitura",
          views: post.views || 0,
          featured: post.featured || false,
          badges: badges.map((nb) => nb.badge)
        } as BlogPost
      })
    )

    return postsWithBadges
  } catch (error) {
    console.error("Erro ao buscar posts do blog:", error)
    return []
  }
}

// Função para buscar um post por ID, incluindo as insígnias do autor
export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  try {
    const { data: post, error } = await supabase
      .from("blog_posts")
      .select(`
        *,
        nutritionist_profiles!inner(
          full_name,
          bio,
          profile_image_url
        )
      `)
      .eq("id", id)
      .eq("published", true)
      .single()

    if (error || !post) {
      console.error("Erro ao buscar post do blog:", error)
      return null
    }

    const badges = await getNutritionistBadges(post.author_id)
    
    // Incrementar visualizações
    await supabase
      .from("blog_posts")
      .update({ views: (post.views || 0) + 1 })
      .eq("id", id)

    return {
      id: post.id,
      title: post.title,
      excerpt: post.excerpt || "",
      content: post.content,
      image: post.image_url || "/placeholder.svg?height=400&width=800",
      author: post.nutritionist_profiles?.full_name || "Autor Desconhecido",
      authorId: post.author_id,
      authorBio: post.nutritionist_profiles?.bio || "",
      authorImage: post.nutritionist_profiles?.profile_image_url || "/placeholder.svg?height=100&width=100",
      date: new Date(post.created_at).toISOString().split("T")[0],
      category: post.category,
      tags: post.tags || [],
      readTime: post.read_time || "5 min de leitura",
      views: (post.views || 0) + 1,
      featured: post.featured || false,
      badges: badges.map((nb) => nb.badge)
    } as BlogPost
  } catch (error) {
    console.error("Erro ao buscar post do blog:", error)
    return null
  }
}

// Função para buscar posts por autor, incluindo as insígnias do autor
export async function getBlogPostsByAuthor(authorId: string): Promise<BlogPost[]> {
  try {
    const { data: posts, error } = await supabase
      .from("blog_posts")
      .select(`
        *,
        nutritionist_profiles!inner(
          full_name,
          bio,
          profile_image_url
        )
      `)
      .eq("author_id", authorId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar posts do autor:", error)
      return []
    }

    const postsWithBadges = await Promise.all(
      (posts || []).map(async (post) => {
        const badges = await getNutritionistBadges(post.author_id)
        return {
          id: post.id,
          title: post.title,
          excerpt: post.excerpt || "",
          content: post.content,
          image: post.image_url || "/placeholder.svg?height=400&width=800",
          author: post.nutritionist_profiles?.full_name || "Autor Desconhecido",
          authorId: post.author_id,
          authorBio: post.nutritionist_profiles?.bio || "",
          authorImage: post.nutritionist_profiles?.profile_image_url || "/placeholder.svg?height=100&width=100",
          date: new Date(post.created_at).toISOString().split("T")[0],
          category: post.category,
          tags: post.tags || [],
          readTime: post.read_time || "5 min de leitura",
          views: post.views || 0,
          featured: post.featured || false,
          badges: badges.map((nb) => nb.badge)
        } as BlogPost
      })
    )

    return postsWithBadges
  } catch (error) {
    console.error("Erro ao buscar posts do autor:", error)
    return []
  }
}

// Função para adicionar um novo post
export async function addBlogPost(newPostData: Omit<BlogPost, "id" | "date" | "views" | "badges">): Promise<BlogPost | null> {
  try {
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error("Usuário não autenticado:", authError)
      throw new Error("Usuário não autenticado")
    }

    console.log("Usuário autenticado:", user.id, "Tentando criar post para author_id:", newPostData.authorId)

    // Verificar se o usuário autenticado é o mesmo que está tentando criar o post
    if (user.id !== newPostData.authorId) {
      console.error("Usuário não autorizado a criar post para outro autor")
      throw new Error("Não autorizado")
    }

    const { data: post, error } = await supabase
      .from("blog_posts")
      .insert({
        title: newPostData.title,
        excerpt: newPostData.excerpt,
        content: newPostData.content,
        image_url: newPostData.image,
        author_id: newPostData.authorId,
        category: newPostData.category,
        tags: newPostData.tags,
        read_time: newPostData.readTime,
        featured: newPostData.featured,
        published: true
      })
      .select()
      .single()

    if (error || !post) {
      console.error("Erro ao adicionar post:", error)
      return null
    }

    return {
      id: post.id,
      title: post.title,
      excerpt: post.excerpt || "",
      content: post.content,
      image: post.image_url || "/placeholder.svg?height=400&width=800",
      author: newPostData.author,
      authorId: post.author_id,
      authorBio: newPostData.authorBio,
      authorImage: newPostData.authorImage,
      date: new Date(post.created_at).toISOString().split("T")[0],
      category: post.category,
      tags: post.tags || [],
      readTime: post.read_time || "5 min de leitura",
      views: 0,
      featured: post.featured || false,
      badges: []
    } as BlogPost
  } catch (error) {
    console.error("Erro ao adicionar post:", error)
    return null
  }
}

// Função para atualizar um post existente
export async function updateBlogPost(updatedPost: BlogPost): Promise<BlogPost | null> {
  try {
    const { data: post, error } = await supabase
      .from("blog_posts")
      .update({
        title: updatedPost.title,
        excerpt: updatedPost.excerpt,
        content: updatedPost.content,
        image_url: updatedPost.image,
        category: updatedPost.category,
        tags: updatedPost.tags,
        read_time: updatedPost.readTime,
        featured: updatedPost.featured,
        updated_at: new Date().toISOString()
      })
      .eq("id", updatedPost.id)
      .select()
      .single()

    if (error || !post) {
      console.error("Erro ao atualizar post:", error)
      return null
    }

    return {
      ...updatedPost,
      date: new Date(post.updated_at || post.created_at).toISOString().split("T")[0]
    }
  } catch (error) {
    console.error("Erro ao atualizar post:", error)
    return null
  }
}

// Função para deletar um post
export async function deleteBlogPost(id: string, authenticatedSupabase?: any): Promise<boolean> {
  console.log("🗑️ Iniciando deleteBlogPost para ID:", id)
  
  try {
    // Usar o cliente autenticado se fornecido, senão usar o padrão
    const clientToUse = authenticatedSupabase || supabase
    
    // Verificar se o usuário está autenticado
    console.log("🔐 Verificando autenticação...")
    const { data: { user }, error: authError } = await clientToUse.auth.getUser()
    
    if (authError || !user) {
      console.error("❌ Usuário não autenticado:", authError)
      return false
    }
    
    console.log("✅ Usuário autenticado:", user.id)

    // Primeiro, verificar se o post existe e se o usuário é o autor
    console.log("🔍 Buscando post para verificar autorização...")
    const { data: post, error: fetchError } = await clientToUse
      .from("blog_posts")
      .select("author_id, title")
      .eq("id", id)
      .single()

    if (fetchError || !post) {
      console.error("❌ Post não encontrado:", fetchError)
      return false
    }
    
    console.log("📄 Post encontrado:", { id, title: post.title, author_id: post.author_id })

    // Verificar se o usuário autenticado é o autor do post
    if (post.author_id !== user.id) {
      console.error("❌ Usuário não autorizado a deletar este post. Author:", post.author_id, "User:", user.id)
      return false
    }
    
    console.log("✅ Autorização confirmada. Procedendo com a exclusão...")

    // Deletar o post
    console.log("🗑️ Executando DELETE no Supabase...")
    const { data: deletedData, error } = await clientToUse
      .from("blog_posts")
      .delete()
      .eq("id", id)
      .eq("author_id", user.id) // Dupla verificação de segurança
      .select() // Retorna os dados deletados

    if (error) {
      console.error("❌ Erro ao deletar post:", error)
      return false
    }

    console.log("✅ Resposta do DELETE:", deletedData)
    
    if (!deletedData || deletedData.length === 0) {
      console.error("⚠️ Nenhum registro foi deletado. Possível problema com RLS ou condições.")
      return false
    }

    console.log("🎉 Post deletado com sucesso:", id)
    return true
  } catch (error) {
    console.error("💥 Erro inesperado ao deletar post:", error)
    return false
  }
}
