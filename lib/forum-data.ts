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
  // Determinar o tipo de autor baseado nas colunas preenchidas
  let author: ForumAuthor
  
  if (data.patient_id && data.author_profile) {
    // Pergunta de paciente
    author = {
      id: data.patient_id,
      name: data.author_profile?.full_name || "Paciente Anônimo",
      userType: "paciente",
      avatar: data.author_profile?.profile_image_url || "/placeholder.svg?height=40&width=40",
      credentials: undefined,
      isVerified: false,
    }
  } else if (data.nutritionist_id && data.author_profile) {
    // Pergunta de nutricionista
    author = {
      id: data.nutritionist_id,
      name: data.author_profile?.full_name || "Nutricionista Anônimo",
      userType: "nutricionista",
      avatar: data.author_profile?.profile_image_url || "/placeholder.svg?height=40&width=40",
      credentials: data.author_profile?.crn || undefined,
      isVerified: true,
      specialties: data.author_profile?.specialties || []
    }
  } else {
    // Fallback para compatibilidade
    author = {
      id: data.patient_id || data.nutritionist_id || data.author_id,
      name: data.author_profile?.full_name || "Usuário Anônimo",
      userType: data.nutritionist_id ? "nutricionista" : "paciente",
      avatar: data.author_profile?.profile_image_url || "/placeholder.svg?height=40&width=40",
      credentials: data.author_profile?.crn || undefined,
      isVerified: data.nutritionist_id ? true : false,
      specialties: data.author_profile?.specialties || []
    }
  }

  const replies: ForumReply[] = (data.forum_answers || []).map((answer: any) => ({
    id: answer.id,
    content: answer.content,
    author: {
      id: answer.nutritionist_id,
      name: answer.author_profile?.full_name || "Nutricionista Anônimo",
      userType: "nutricionista",
      avatar: answer.author_profile?.profile_image_url || "/placeholder.svg?height=40&width=40",
      credentials: answer.author_profile?.crn || undefined,
      isVerified: true,
      specialties: answer.author_profile?.specialties || []
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

// Função para buscar todas as perguntas do fórum (apenas de pacientes)
export async function getAllForumQuestions(): Promise<ForumQuestion[]> {
  try {
    // Buscar apenas perguntas de pacientes
    const { data: questionsData, error: questionsError } = await supabase
      .from('forum_questions')
      .select(`
        *,
        author_profile:patient_profiles!forum_questions_patient_id_fkey(
          full_name,
          profile_image_url
        )
      `)
      .not('patient_id', 'is', null)
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
        userType: "paciente",
        avatar: data.author_profile?.profile_image_url || "/placeholder.svg?height=40&width=40",
        credentials: undefined,
        isVerified: false,
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
        replies: [],
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

// Função para buscar todas as perguntas (pacientes e nutricionistas)
export async function getAllForumQuestionsWithNutritionists(): Promise<ForumQuestion[]> {
  try {
    const [patientQuestions, nutritionistQuestions] = await Promise.all([
      getAllForumQuestions(),
      getNutritionistForumQuestions()
    ])

    // Combinar e ordenar por data de criação
    const allQuestions = [...patientQuestions, ...nutritionistQuestions]
    allQuestions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return allQuestions
  } catch (error) {
    console.error('❌ Erro em getAllForumQuestionsWithNutritionists:', error)
    return []
  }
}

// Função para buscar perguntas feitas por nutricionistas
export async function getNutritionistForumQuestions(): Promise<ForumQuestion[]> {
  try {
    // Buscar perguntas de nutricionistas usando a nova coluna nutritionist_id
    const { data: questionsData, error: questionsError } = await supabase
      .from('forum_questions')
      .select(`
        *,
        nutritionist_profiles!inner(
          full_name,
          profile_image_url,
          crn,
          specialties
        )
      `)
      .not('nutritionist_id', 'is', null)
      .order('created_at', { ascending: false })

    if (questionsError) {
      console.error('❌ Erro ao buscar perguntas de nutricionistas:', questionsError)
      return []
    }

    if (!questionsData || questionsData.length === 0) {
      return []
    }

    const questions: ForumQuestion[] = questionsData.map((data: any) => {
      const nutritionistProfile = data.nutritionist_profiles
      const author: ForumAuthor = {
        id: data.nutritionist_id,
        name: nutritionistProfile?.full_name || "Nutricionista Anônimo",
        userType: "nutricionista",
        avatar: nutritionistProfile?.profile_image_url || "/placeholder.svg?height=40&width=40",
        credentials: nutritionistProfile?.crn || undefined,
        isVerified: true,
        specialties: nutritionistProfile?.specialties || []
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
        replies: [],
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
    console.error('❌ Erro em getNutritionistForumQuestions:', error)
    return []
  }
}

// Função para buscar uma pergunta por ID
export async function getForumQuestionById(id: string): Promise<ForumQuestion | null> {
  try {
    // Buscar a pergunta com joins condicionais para ambos os tipos de perfil
    const { data: questionData, error: questionError } = await supabase
      .from('forum_questions')
      .select(`
        *,
        patient_profile:patient_profiles!forum_questions_patient_id_fkey(
          full_name,
          profile_image_url
        ),
        nutritionist_profile:nutritionist_profiles!forum_questions_nutritionist_id_fkey(
          full_name,
          profile_image_url,
          crn,
          specialties
        )
      `)
      .eq('id', id)
      .single()

    if (questionError || !questionData) {
      console.error('Error fetching forum question:', questionError)
      return null
    }

    // Determinar o tipo de autor e criar o objeto author
    let author: ForumAuthor
    if (questionData.patient_id) {
      author = {
        id: questionData.patient_id,
        name: questionData.patient_profile?.full_name || "Paciente Anônimo",
        userType: "paciente",
        avatar: questionData.patient_profile?.profile_image_url || "/placeholder.svg?height=40&width=40",
        credentials: undefined,
        isVerified: false,
      }
    } else if (questionData.nutritionist_id) {
      author = {
        id: questionData.nutritionist_id,
        name: questionData.nutritionist_profile?.full_name || "Nutricionista Anônimo",
        userType: "nutricionista",
        avatar: questionData.nutritionist_profile?.profile_image_url || "/placeholder.svg?height=40&width=40",
        credentials: questionData.nutritionist_profile?.crn || undefined,
        isVerified: true,
        specialties: questionData.nutritionist_profile?.specialties || []
      }
    } else {
      console.error('Pergunta sem autor válido')
      return null
    }

    // Buscar as respostas
    const { data: answersData, error: answersError } = await supabase
      .from('forum_answers')
      .select(`
        *,
        nutritionist_profile:nutritionist_profiles!forum_answers_nutritionist_id_fkey(
          full_name,
          profile_image_url,
          crn,
          specialties
        )
      `)
      .eq('question_id', id)
      .order('created_at', { ascending: true })

    if (answersError) {
      console.error('Error fetching forum answers:', answersError)
    }

    const replies: ForumReply[] = (answersData || []).map((answer: any) => ({
      id: answer.id,
      content: answer.content,
      author: {
        id: answer.nutritionist_id,
        name: answer.nutritionist_profile?.full_name || "Nutricionista Anônimo",
        userType: "nutricionista",
        avatar: answer.nutritionist_profile?.profile_image_url || "/placeholder.svg?height=40&width=40",
        credentials: answer.nutritionist_profile?.crn || undefined,
        isVerified: true,
        specialties: answer.nutritionist_profile?.specialties || []
      },
      timestamp: new Date(answer.created_at).toLocaleString('pt-BR'),
      likes: answer.likes_count || 0,
      isBestAnswer: answer.is_best_answer || false
    }))

    const question: ForumQuestion = {
      id: questionData.id,
      title: questionData.title,
      content: questionData.content,
      author,
      timestamp: new Date(questionData.created_at).toLocaleString('pt-BR'),
      likes: questionData.likes_count || 0,
      repliesCount: questionData.answers_count || 0,
      views: questionData.views_count || 0,
      tags: questionData.tags || [],
      category: questionData.category || "",
      replies,
      isBestAnswerSelected: questionData.is_resolved || false
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
  authorId: string,
  category?: string
): Promise<ForumQuestion | null> {
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

    if (userType === 'paciente') {
      // Pacientes podem fazer perguntas (para nutricionistas responderem)
      const { data: patientProfile, error: profileError } = await supabase
        .from('patient_profiles')
        .select('id, full_name, profile_image_url')
        .eq('user_id', authorId)
        .single()

      if (profileError || !patientProfile) {
        console.error('Erro ao buscar perfil do paciente:', profileError)
        return null
      }

      // insertData apenas com patient_id (sem nutritionist_id)
      const insertData: any = {
        title,
        content,
        tags,
        author_id: authorId,
        category: category || tags[0] || 'geral',
        patient_id: patientProfile.id
      }

      const { data, error } = await supabase
        .from('forum_questions')
        .insert(insertData)
        .select('*')
        .single()

      if (error) {
        console.error('Erro ao criar pergunta:', error?.message || error)
        return null
      }

      // Criar objeto de pergunta para paciente
      const question: ForumQuestion = {
        id: data.id,
        title: data.title,
        content: data.content,
        author: {
          id: patientProfile.id,
          name: patientProfile.full_name || "Paciente Anônimo",
          userType: "paciente",
          avatar: patientProfile.profile_image_url || "/placeholder.svg?height=40&width=40",
          credentials: undefined,
          isVerified: false,
        },
        timestamp: new Date(data.created_at).toLocaleString('pt-BR'),
        likes: data.likes_count || 0,
        repliesCount: data.answers_count || 0,
        views: data.views_count || 0,
        tags: data.tags || [],
        category: data.category || "",
        replies: [],
        isBestAnswerSelected: data.is_resolved || false
      }

      const authorWithBadges = await addBadgesToAuthor(question.author)
      return { ...question, author: authorWithBadges }

    } else if (userType === 'nutricionista') {
      // Nutricionistas fazem perguntas APENAS para outros nutricionistas
      const { data: nutritionistProfile, error: profileError } = await supabase
        .from('nutritionist_profiles')
        .select('id, full_name, profile_image_url, crn, is_verified, specialties')
        .eq('user_id', authorId)
        .single()

      if (profileError || !nutritionistProfile) {
        console.error('Erro ao buscar perfil do nutricionista:', profileError)
        console.error('Detalhes do erro:', profileError)
        return null
      }

      // insertData apenas com nutritionist_id (sem patient_id)
      const insertData: any = {
        title,
        content,
        tags,
        author_id: authorId,
        category: category || tags[0] || 'geral',
        nutritionist_id: nutritionistProfile.id
      }

      const { data, error } = await supabase
        .from('forum_questions')
        .insert(insertData)
        .select('*')
        .single()

      if (error) {
        console.error('Erro ao criar pergunta:', error?.message || error)
        return null
      }

      // Criar objeto de pergunta para nutricionista
      const question: ForumQuestion = {
        id: data.id,
        title: data.title,
        content: data.content,
        author: {
          id: nutritionistProfile.id,
          name: nutritionistProfile.full_name || "Nutricionista Anônimo",
          userType: "nutricionista",
          avatar: nutritionistProfile.profile_image_url || "/placeholder.svg?height=40&width=40",
          credentials: nutritionistProfile.crn || undefined,
          isVerified: nutritionistProfile.is_verified || true,
          specialties: nutritionistProfile.specialties || []
        },
        timestamp: new Date(data.created_at).toLocaleString('pt-BR'),
        likes: data.likes_count || 0,
        repliesCount: data.answers_count || 0,
        views: data.views_count || 0,
        tags: data.tags || [],
        category: data.category || "",
        replies: [],
        isBestAnswerSelected: data.is_resolved || false
      }

      const authorWithBadges = await addBadgesToAuthor(question.author)
      return { ...question, author: authorWithBadges }

    } else {
      console.error('Tipo de usuário não permitido para criar perguntas:', userType)
      return null
    }
  } catch (error) {
    console.error('Erro em createForumQuestion:', error instanceof Error ? error.message : error)
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

    // Buscar o perfil do nutricionista para obter o ID correto
    const { data: nutritionistProfile, error: profileError } = await supabase
      .from('nutritionist_profiles')
      .select('id, full_name, profile_image_url, crn, is_verified')
      .eq('user_id', authorId)
      .single()

    if (profileError || !nutritionistProfile) {
      console.error('Erro ao buscar perfil do nutricionista:', profileError)
      return null
    }

    const insertData: any = {
      question_id: questionId,
      content,
      author_id: authorId,
      nutritionist_id: nutritionistProfile.id, // ID do perfil do nutricionista
    }

    const { data, error } = await supabase
      .from('forum_answers')
      .insert(insertData)
      .select('*')
      .single()

    if (error) {
      console.error('Erro ao criar resposta:', error?.message || error)
      return null
    }

    const reply: ForumReply = {
      id: data.id,
      content: data.content,
      author: {
        id: nutritionistProfile.id,
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
    console.error('Erro em createForumAnswer:', error instanceof Error ? error.message : error)
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
