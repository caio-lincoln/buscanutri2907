import { createSupabaseClient } from "./supabase"

// Usar o cliente que mantém a autenticação
const supabase = createSupabaseClient()
import { getNutritionistBadges, type Badge } from "./badge-service"

export interface ForumAuthor {
  name: string
  userType: "paciente" | "nutricionista" | "empresa" | "admin"
  avatar?: string
  credentials?: string // Ex: CRN para nutricionistas
  isVerified?: boolean
  id: string // Adicionar ID do autor para buscar insígnias
  badges?: Badge[] // Adicionar badges ao tipo
}

export interface ForumReply {
  id: string
  content: string
  author: ForumAuthor
  timestamp: string
  likes: number
  isBestAnswer: boolean
}

export interface ForumQuestion {
  id: string
  title: string
  content: string
  author: ForumAuthor
  timestamp: string
  likes: number
  repliesCount: number
  views: number
  tags: string[]
  category: string
  replies: ForumReply[]
  isBestAnswerSelected: boolean
}

// Função auxiliar para converter dados do Supabase para o formato do fórum
function convertSupabaseToForumQuestion(data: any): ForumQuestion {
  const author: ForumAuthor = {
    id: data.patient_id, // Usar patient_id
    name: data.author_profile?.full_name || "Usuário Anônimo",
    userType: "paciente", // Sempre paciente já que vem de patient_profiles
    avatar: data.author_profile?.profile_image_url || "/placeholder.svg?height=40&width=40",
    credentials: undefined, // Pacientes não têm CRN
    isVerified: false, // Pacientes não são verificados por padrão
  }

  const replies: ForumReply[] = (data.forum_answers || []).map((answer: any) => ({
    id: answer.id,
    content: answer.content,
    author: {
      id: answer.nutritionist_id, // Usar nutritionist_id
      name: answer.author_profile?.full_name || "Usuário Anônimo",
      userType: "nutricionista", // Sempre nutricionista já que vem de nutritionist_profiles
      avatar: answer.author_profile?.profile_image_url || "/placeholder.svg?height=40&width=40",
      credentials: answer.author_profile?.crn ? `CRN ${answer.author_profile.crn}` : undefined,
      isVerified: answer.author_profile?.is_verified || false,
    },
    timestamp: new Date(answer.created_at).toLocaleString('pt-BR'),
    likes: answer.likes_count || 0,
    isBestAnswer: answer.is_best_answer || false
  }))

  return {
    id: data.id,
    title: data.title,
    content: data.content,
    author,
    timestamp: new Date(data.created_at).toLocaleString('pt-BR'),
    likes: data.likes_count || 0,
    repliesCount: data.answers_count || 0,
    views: data.views_count || 0,
    tags: data.tags || [],
    category: data.category || "",
    replies,
    isBestAnswerSelected: data.is_resolved || false
  }
}

// Função auxiliar para adicionar insígnias aos autores
const addBadgesToAuthor = async (author: ForumAuthor): Promise<ForumAuthor> => {
  if (author.userType === "nutricionista") {
    try {
      const badges = await getNutritionistBadges(author.id)
      return { ...author, badges: badges.map((nb) => nb.badge) }
    } catch (error) {
      console.error("Erro ao buscar badges:", error)
      return author
    }
  }
  return author
}

// Função para buscar todas as perguntas do fórum
export async function getAllForumQuestions(): Promise<ForumQuestion[]> {
  try {
    // Buscar diretamente da tabela para testar
    const { data: questionsData, error: questionsError } = await supabase
      .from('forum_questions')
      .select(`
        *,
        author_profile:patient_profiles!forum_questions_patient_id_fkey(
          full_name,
          profile_image_url
        )
      `)
      .order('created_at', { ascending: false })

    if (questionsError) {
      console.error('❌ Erro ao buscar perguntas do fórum:', questionsError)
      return []
    }

    if (!questionsData || questionsData.length === 0) {
      return []
    }

    const questions: ForumQuestion[] = questionsData.map((data: any) => {
      const author: ForumAuthor = {
        id: data.patient_id,
        name: data.author_profile?.full_name || "Usuário Anônimo",
        userType: "paciente", // Sempre paciente já que vem de patient_profiles
        avatar: data.author_profile?.profile_image_url || "/placeholder.svg?height=40&width=40",
        credentials: undefined, // Pacientes não têm CRN
        isVerified: false, // Pacientes não são verificados por padrão
      }

      return {
        id: data.id,
        title: data.title,
        content: data.content,
        author,
        timestamp: new Date(data.created_at).toLocaleString('pt-BR'),
        likes: data.likes_count || 0,
        repliesCount: data.answers_count || 0,
        views: data.views_count || 0,
        tags: data.tags || [],
        category: data.category || "",
        replies: [], // Vamos carregar as respostas separadamente se necessário
        isBestAnswerSelected: data.is_resolved || false
      }
    })
    
    // Adicionar badges aos autores
    const questionsWithBadges = await Promise.all(
      questions.map(async (q) => {
        const authorWithBadges = await addBadgesToAuthor(q.author)
        return { ...q, author: authorWithBadges }
      }),
    )

    return questionsWithBadges
  } catch (error) {
    console.error('❌ Erro em getAllForumQuestions:', error)
    return []
  }
}

// Função para buscar perguntas feitas por nutricionistas
export async function getNutritionistForumQuestions(): Promise<ForumQuestion[]> {
  try {
    // Primeiro, buscar os IDs dos usuários nutricionistas
    const { data: nutritionistUsers, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('user_type', 'nutricionista')

    if (usersError) {
      console.error('❌ Erro ao buscar usuários nutricionistas:', usersError)
      return []
    }

    if (!nutritionistUsers || nutritionistUsers.length === 0) {
      return []
    }

    const nutritionistIds = nutritionistUsers.map(user => user.id)

    // Buscar perguntas feitas por esses nutricionistas
    const { data: questionsData, error: questionsError } = await supabase
      .from('forum_questions')
      .select('*')
      .in('author_id', nutritionistIds)
      .order('created_at', { ascending: false })

    if (questionsError) {
      console.error('❌ Erro ao buscar perguntas de nutricionistas:', questionsError)
      return []
    }

    if (!questionsData || questionsData.length === 0) {
      return []
    }

    // Buscar os perfis dos nutricionistas
    const { data: nutritionistProfiles, error: profilesError } = await supabase
      .from('nutritionist_profiles')
      .select('user_id, full_name, profile_image_url, crn, is_verified')
      .in('user_id', nutritionistIds)

    if (profilesError) {
      console.error('❌ Erro ao buscar perfis de nutricionistas:', profilesError)
      return []
    }

    // Criar um mapa de perfis por user_id
    const profilesMap = new Map()
    nutritionistProfiles?.forEach(profile => {
      profilesMap.set(profile.user_id, profile)
    })

    const questions: ForumQuestion[] = questionsData.map((data: any) => {
      const profile = profilesMap.get(data.author_id)
      
      const author: ForumAuthor = {
        id: data.author_id,
        name: profile?.full_name || "Nutricionista",
        userType: "nutricionista",
        avatar: profile?.profile_image_url || "/placeholder.svg?height=40&width=40",
        credentials: profile?.crn ? `CRN ${profile.crn}` : undefined,
        isVerified: profile?.is_verified || false,
      }

      return {
        id: data.id,
        title: data.title,
        content: data.content,
        author,
        timestamp: new Date(data.created_at).toLocaleString('pt-BR'),
        likes: data.likes_count || 0,
        repliesCount: data.answers_count || 0,
        views: data.views_count || 0,
        tags: data.tags || [],
        category: data.category || "",
        replies: [], // Vamos carregar as respostas separadamente se necessário
        isBestAnswerSelected: data.is_answered || false
      }
    })
    
    // Adicionar badges aos autores
    const questionsWithBadges = await Promise.all(
      questions.map(async (q) => {
        const authorWithBadges = await addBadgesToAuthor(q.author)
        return { ...q, author: authorWithBadges }
      }),
    )

    return questionsWithBadges
  } catch (error) {
    console.error('❌ Erro em getNutritionistForumQuestions:', error)
    return []
  }
}

// Função para buscar uma pergunta por ID
export async function getForumQuestionById(id: string): Promise<ForumQuestion | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_forum_question_with_answers', { question_id: id })
      .single()

    if (error) {
      console.error('Error fetching forum question:', error)
      return null
    }

    if (!data) {
      return null
    }

    // Converter os dados da função RPC para o formato ForumQuestion
    const author: ForumAuthor = {
      id: data.patient_id,
      name: data.author_profile?.full_name || "Usuário Anônimo",
      userType: "paciente",
      avatar: data.author_profile?.profile_image_url || "/placeholder.svg?height=40&width=40",
      credentials: undefined,
      isVerified: false,
    }

    const replies: ForumReply[] = (data.forum_answers || []).map((answer: any) => ({
      id: answer.id,
      content: answer.content,
      author: {
        id: answer.author_id,
        name: answer.author_profile?.full_name || "Usuário Anônimo",
        userType: answer.user_type === 'nutricionista' ? "nutricionista" : "paciente",
        avatar: answer.author_profile?.profile_image_url || "/placeholder.svg?height=40&width=40",
        credentials: answer.user_type === 'nutricionista' && answer.author_profile?.crn ? `CRN ${answer.author_profile.crn}` : undefined,
        isVerified: answer.user_type === 'nutricionista' ? (answer.author_profile?.is_verified || false) : false,
      },
      timestamp: new Date(answer.created_at).toLocaleString('pt-BR'),
      likes: answer.likes_count || 0,
      isBestAnswer: answer.is_best_answer || false
    }))

    const question: ForumQuestion = {
      id: data.id,
      title: data.title,
      content: data.content,
      author,
      timestamp: new Date(data.created_at).toLocaleString('pt-BR'),
      likes: data.likes_count || 0,
      repliesCount: data.answers_count || 0,
      views: data.views_count || 0,
      tags: data.tags || [],
      category: data.category || "",
      replies,
      isBestAnswerSelected: data.is_answered || false
    }

    // Adicionar badges aos autores
    const authorWithBadges = await addBadgesToAuthor(question.author)
    const repliesWithBadges = await Promise.all(
      replies.map(async (reply) => {
        const replyAuthorWithBadges = await addBadgesToAuthor(reply.author)
        return { ...reply, author: replyAuthorWithBadges }
      })
    )

    return { ...question, author: authorWithBadges, replies: repliesWithBadges }
  } catch (error) {
    console.error('Error in getForumQuestionById:', error)
    return null
  }
}

// Função para criar uma nova pergunta
export async function createForumQuestion(
  title: string,
  content: string,
  tags: string[],
  authorId: string
): Promise<ForumQuestion | null> {
  try {
    // Primeiro, buscar o patient_profile_id do usuário
    const { data: patientProfile, error: profileError } = await supabase
      .from('patient_profiles')
      .select('id, full_name, profile_image_url')
      .eq('user_id', authorId)
      .single()

    if (profileError || !patientProfile) {
      console.error('Erro ao buscar perfil do paciente:', profileError)
      return null
    }

    const { data, error } = await supabase
      .from('forum_questions')
      .insert({
        title,
        content,
        tags,
        patient_id: patientProfile.id, // Usar o ID do perfil do paciente
        author_id: authorId, // Usar o user_id como author_id
      })
      .select('*')
      .single()

    if (error) {
      console.error('Erro ao criar pergunta:', error)
      return null
    }

    // Use the already fetched author profile
    const authorProfile = {
      full_name: patientProfile.full_name,
      profile_image_url: patientProfile.profile_image_url
    }

    const questionWithProfile = {
      ...data,
      author_profile: authorProfile
    }

    const question = convertSupabaseToForumQuestion(questionWithProfile)
    const authorWithBadges = await addBadgesToAuthor(question.author)
    
    return { ...question, author: authorWithBadges }
  } catch (error) {
    console.error('Erro em createForumQuestion:', error)
    return null
  }
}

// Função para criar uma resposta
export async function createForumAnswer(
  questionId: string,
  content: string,
  authorId: string
): Promise<ForumReply | null> {
  try {
    // Primeiro, verificar o tipo de usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', authorId)
      .single()

    if (userError || !userData) {
      console.error('Erro ao buscar tipo de usuário:', userError)
      return null
    }

    const userType = userData.user_type

    // RESTRIÇÃO: Apenas nutricionistas podem responder
    if (userType !== 'nutricionista') {
      console.error('Apenas nutricionistas podem responder no fórum')
      throw new Error('Apenas nutricionistas podem responder no fórum')
    }

    const insertData: any = {
      question_id: questionId,
      content,
      author_id: authorId,
      nutritionist_id: authorId, // Sempre será nutricionista agora
    }

    const { data, error } = await supabase
      .from('forum_answers')
      .insert(insertData)
      .select('*')
      .single()

    if (error) {
      console.error('Erro ao criar resposta:', error)
      return null
    }

    // Buscar o perfil do nutricionista
    const { data: nutritionistProfile } = await supabase
      .from('nutritionist_profiles')
      .select('full_name, profile_image_url, crn, is_verified')
      .eq('user_id', authorId)
      .single()

    const reply: ForumReply = {
      id: data.id,
      content: data.content,
      author: {
        id: authorId,
        name: nutritionistProfile?.full_name || "Nutricionista",
        userType: "nutricionista",
        avatar: nutritionistProfile?.profile_image_url || "/placeholder.svg?height=40&width=40",
        credentials: nutritionistProfile?.crn ? `CRN ${nutritionistProfile.crn}` : undefined,
        isVerified: nutritionistProfile?.is_verified || false,
      },
      timestamp: new Date(data.created_at).toLocaleString("pt-BR"),
      likes: data.likes_count || 0,
      isBestAnswer: data.is_best_answer || false,
    }

    const authorWithBadges = await addBadgesToAuthor(reply.author)
    return { ...reply, author: authorWithBadges }
  } catch (error) {
    console.error('Erro em createForumAnswer:', error)
    return null
  }
}

// Função para curtir um item do fórum
export async function likeForumItem(
  itemId: string,
  type: "question" | "reply",
  userId: string
): Promise<boolean> {
  try {
    const tableName = type === "question" ? "forum_question_likes" : "forum_answer_likes"
    const columnName = type === "question" ? "question_id" : "answer_id"

    // Verificar se já curtiu
    const { data: existingLike } = await supabase
      .from(tableName)
      .select('id')
      .eq(columnName, itemId)
      .eq('user_id', userId)
      .single()

    if (existingLike) {
      // Remover curtida
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq(columnName, itemId)
        .eq('user_id', userId)

      return !error
    } else {
      // Adicionar curtida
      const { error } = await supabase
        .from(tableName)
        .insert({
          [columnName]: itemId,
          user_id: userId,
        })

      return !error
    }
  } catch (error) {
    console.error('Erro em likeForumItem:', error)
    return false
  }
}

// Função para incrementar visualizações
export async function incrementQuestionViews(questionId: string): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('increment_question_views', {
      question_id: questionId
    })

    if (error) {
      console.error('Erro ao incrementar visualizações:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Erro em incrementQuestionViews:', error)
    return false
  }
}

// Função para marcar resposta como melhor resposta
export async function markBestAnswer(questionId: string, answerId: string): Promise<boolean> {
  try {
    // Primeiro, remover qualquer melhor resposta existente
    await supabase
      .from('forum_answers')
      .update({ is_best_answer: false })
      .eq('question_id', questionId)

    // Marcar a nova melhor resposta
    const { error: answerError } = await supabase
      .from('forum_answers')
      .update({ is_best_answer: true })
      .eq('id', answerId)

    if (answerError) {
      console.error('Erro ao marcar melhor resposta:', answerError)
      return false
    }

    // Atualizar a pergunta
    const { error: questionError } = await supabase
      .from('forum_questions')
      .update({ 
        best_answer_id: answerId,
        is_resolved: true 
      })
      .eq('id', questionId)

    if (questionError) {
      console.error('Erro ao atualizar pergunta:', questionError)
      return false
    }

    return true
  } catch (error) {
    console.error('Erro em markBestAnswer:', error)
    return false
  }
}
