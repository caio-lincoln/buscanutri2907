import { createSupabaseClient } from './supabase'
import { formatDateBR } from './utils/format-date'

// Usar o cliente que mantém a autenticação
const supabase = createSupabaseClient()
import { getNutritionistBadges, type NutritionistBadge } from './badge-service'

export interface ForumAuthor {
  name: string
  userType: 'paciente' | 'nutricionista' | 'empresa' | 'admin'
  avatar?: string
  credentials?: string // Ex: CRN para nutricionistas
  isVerified?: boolean
  id: string // Adicionar ID do autor para buscar insígnias
  badges?: NutritionistBadge[] // Adicionar badges ao tipo
  specialties?: string[] // Especialidades do nutricionista
}

export interface ForumReply {
  id: string
  content: string
  author: ForumAuthor
  timestamp: string
  likes: number
  isBestAnswer: boolean
  hasLiked?: boolean
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
  hasLiked?: boolean
}

// Função auxiliar para converter dados do Supabase para o formato do fórum
function convertSupabaseToForumQuestion(data: any): ForumQuestion {
  // Determinar o tipo de autor baseado nas colunas preenchidas
  let author: ForumAuthor

  if (data.patient_id && data.author_profile) {
    // Pergunta de paciente
    author = {
      id: data.patient_id,
      name: data.author_profile?.full_name || 'Paciente Anônimo',
      userType: 'paciente',
      avatar:
        data.author_profile?.profile_image_url ||
        '/placeholder.svg?height=40&width=40',
      credentials: undefined,
      isVerified: false,
    }
  } else if (data.nutritionist_id && data.author_profile) {
    // Pergunta de nutricionista
    author = {
      id: data.nutritionist_id,
      name: data.author_profile?.full_name || 'Nutricionista Anônimo',
      userType: 'nutricionista',
      avatar:
        data.author_profile?.profile_image_url ||
        '/placeholder.svg?height=40&width=40',
      credentials: data.author_profile?.crn || undefined,
      isVerified: true,
      specialties: data.author_profile?.specialties || [],
    }
  } else {
    // Fallback para compatibilidade
    author = {
      id: data.patient_id || data.nutritionist_id || data.author_id,
      name: data.author_profile?.full_name || 'Usuário Anônimo',
      userType: data.nutritionist_id ? 'nutricionista' : 'paciente',
      avatar:
        data.author_profile?.profile_image_url ||
        '/placeholder.svg?height=40&width=40',
      credentials: data.author_profile?.crn || undefined,
      isVerified: data.nutritionist_id ? true : false,
      specialties: data.author_profile?.specialties || [],
    }
  }

  const replies: ForumReply[] = (data.forum_answers || []).map(
    (answer: any) => ({
      id: answer.id,
      content: answer.content,
      author: {
        id: answer.nutritionist_id,
        name: answer.author_profile?.full_name || 'Nutricionista Anônimo',
        userType: 'nutricionista',
        avatar:
          answer.author_profile?.profile_image_url ||
          '/placeholder.svg?height=40&width=40',
        credentials: answer.author_profile?.crn || undefined,
        isVerified: true,
        specialties: answer.author_profile?.specialties || [],
      },
      timestamp: formatDateBR(answer.created_at),
      likes: answer.likes_count || 0,
      isBestAnswer: answer.is_best_answer || false,
    })
  )

  return {
    id: data.id,
    title: data.title,
    content: data.content,
    author,
    timestamp: formatDateBR(data.created_at),
    likes: data.likes_count || 0,
    repliesCount: data.answers_count || 0,
    views: data.views || 0,
    tags: data.tags || [],
    category: data.category || '',
    replies,
    isBestAnswerSelected: data.is_resolved || false,
  }
}

// Função auxiliar para adicionar insígnias aos autores
const addBadgesToAuthor = async (author: ForumAuthor): Promise<ForumAuthor> => {
  if (author.userType === 'nutricionista') {
    try {
      const badges = await getNutritionistBadges(author.id)
      return { ...author, badges }
    } catch (error) {
      // Silent error handling: Error fetching badges
      return author
    }
  }
  return author
}

// Função para buscar todas as perguntas do fórum (apenas de pacientes)
export async function getAllForumQuestions(): Promise<ForumQuestion[]> {
  try {
    // Buscar perguntas de pacientes com JOIN para pegar os dados do perfil
    const { data: questionsData, error: questionsError } = await supabase
      .from('forum_questions')
      .select(
        `
        *,
        patient_profiles!forum_questions_patient_id_fkey(
          full_name,
          profile_image_url
        )
      `
      )
      .not('patient_id', 'is', null)
      .order('created_at', { ascending: false })

    if (questionsError) {
      // Silent error handling: Error fetching forum questions
      return []
    }

    if (!questionsData || questionsData.length === 0) {
      return []
    }

    const questions: ForumQuestion[] = questionsData.map((data: any) => {
      const author: ForumAuthor = {
        id: data.patient_id,
        name: data.patient_profiles?.full_name || 'Usuário Anônimo',
        userType: 'paciente',
        avatar:
          data.patient_profiles?.profile_image_url ||
          '/placeholder.svg?height=40&width=40',
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
    views: data.views || 0,
        tags: data.tags || [],
        category: data.category || '',
        replies: [],
        isBestAnswerSelected: data.is_resolved || false,
      }
    })

    // Adicionar badges aos autores
    const questionsWithBadges = await Promise.all(
      questions.map(async q => {
        const authorWithBadges = await addBadgesToAuthor(q.author)
        return { ...q, author: authorWithBadges }
      })
    )

    return questionsWithBadges
  } catch (error) {
    // Silent error handling: Error in getAllForumQuestions
    return []
  }
}

// Função para buscar todas as perguntas (pacientes e nutricionistas)
export async function getAllForumQuestionsWithNutritionists(): Promise<
  ForumQuestion[]
> {
  try {
    const [patientQuestions, nutritionistQuestions] = await Promise.all([
      getAllForumQuestions(),
      getNutritionistForumQuestions(),
    ])

    // Combinar e ordenar por data de criação
    const allQuestions = [...patientQuestions, ...nutritionistQuestions]
    allQuestions.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    return allQuestions
  } catch (error) {
    // Silent error handling: Error in getAllForumQuestionsWithNutritionists
    return []
  }
}

// Função para buscar perguntas feitas por nutricionistas
export async function getNutritionistForumQuestions(): Promise<
  ForumQuestion[]
> {
  try {
    // Buscar perguntas de nutricionistas com JOIN
    const { data: questionsData, error: questionsError } = await supabase
      .from('forum_questions')
      .select(
        `
        *,
        nutritionist_profiles!forum_questions_nutritionist_id_fkey(
          full_name,
          profile_image_url,
          crn,
          specialties
        )
      `
      )
      .not('nutritionist_id', 'is', null)
      .order('created_at', { ascending: false })

    if (questionsError) {
      // Silent error handling: Error fetching nutritionist questions
      return []
    }

    if (!questionsData || questionsData.length === 0) {
      return []
    }

    const questions: ForumQuestion[] = questionsData.map((data: any) => {
      const nutritionistProfile = data.nutritionist_profiles

      const author: ForumAuthor = {
        id: data.nutritionist_id,
        name: nutritionistProfile?.full_name || 'Nutricionista Anônimo',
        userType: 'nutricionista',
        avatar:
          nutritionistProfile?.profile_image_url ||
          '/placeholder.svg?height=40&width=40',
        credentials: nutritionistProfile?.crn || undefined,
        isVerified: true,
        specialties: nutritionistProfile?.specialties || [],
      }

      return {
        id: data.id,
        title: data.title,
        content: data.content,
        author,
        timestamp: new Date(data.created_at).toLocaleString('pt-BR'),
        likes: data.likes_count || 0,
        repliesCount: data.answers_count || 0,
    views: data.views || 0,
        tags: data.tags || [],
        category: data.category || '',
        replies: [],
        isBestAnswerSelected: data.is_resolved || false,
      }
    })

    // Adicionar badges aos autores
    const questionsWithBadges = await Promise.all(
      questions.map(async q => {
        const authorWithBadges = await addBadgesToAuthor(q.author)
        return { ...q, author: authorWithBadges }
      })
    )

    return questionsWithBadges
  } catch (error) {
    // Silent error handling: Error in getNutritionistForumQuestions
    return []
  }
}

// Função para buscar uma pergunta por ID
export async function getForumQuestionById(
  id: string
): Promise<ForumQuestion | null> {
  try {
    // Buscar a pergunta com JOINs
    const { data: questionData, error: questionError } = await supabase
      .from('forum_questions')
      .select(
        `
        *,
        patient_profiles!forum_questions_patient_id_fkey(
          full_name,
          profile_image_url
        ),
        nutritionist_profiles!forum_questions_nutritionist_id_fkey(
          full_name,
          profile_image_url,
          crn,
          specialties
        )
      `
      )
      .eq('id', id)
      .single()

    if (questionError || !questionData) {
      // Silent error handling: Error fetching forum question
      return null
    }

    // Determinar o autor baseado nos dados retornados
    let author: ForumAuthor
    if (questionData.patient_id && questionData.patient_profiles) {
      author = {
        id: questionData.patient_id,
        name: questionData.patient_profiles.full_name || 'Paciente Anônimo',
        userType: 'paciente',
        avatar:
          questionData.patient_profiles.profile_image_url ||
          '/placeholder.svg?height=40&width=40',
        credentials: undefined,
        isVerified: false,
      }
    } else if (
      questionData.nutritionist_id &&
      questionData.nutritionist_profiles
    ) {
      author = {
        id: questionData.nutritionist_id,
        name:
          questionData.nutritionist_profiles.full_name ||
          'Nutricionista Anônimo',
        userType: 'nutricionista',
        avatar:
          questionData.nutritionist_profiles.profile_image_url ||
          '/placeholder.svg?height=40&width=40',
        credentials: questionData.nutritionist_profiles.crn || undefined,
        isVerified: true,
        specialties: questionData.nutritionist_profiles.specialties || [],
      }
    } else {
      // Silent error handling: Question without valid author
      return null
    }

    // Buscar as respostas com JOIN
    const { data: answersData, error: answersError } = await supabase
      .from('forum_answers')
      .select(
        `
        *,
        nutritionist_profiles!forum_answers_nutritionist_id_fkey(
          full_name,
          profile_image_url,
          crn,
          specialties
        )
      `
      )
      .eq('question_id', id)
      .order('created_at', { ascending: true })

    if (answersError) {
      // Silent error handling: Error fetching forum answers
    }

    const replies: ForumReply[] = (answersData || []).map((answer: any) => {
      const nutritionistProfile = answer.nutritionist_profiles

      return {
        id: answer.id,
        content: answer.content,
        author: {
          id: answer.nutritionist_id,
          name: nutritionistProfile?.full_name || 'Nutricionista Anônimo',
          userType: 'nutricionista',
          avatar:
            nutritionistProfile?.profile_image_url ||
            '/placeholder.svg?height=40&width=40',
          credentials: nutritionistProfile?.crn || undefined,
          isVerified: true,
          specialties: nutritionistProfile?.specialties || [],
        },
        timestamp: new Date(answer.created_at).toLocaleString('pt-BR'),
        likes: answer.likes_count || 0,
        isBestAnswer: answer.is_best_answer || false,
      }
    })

    const question: ForumQuestion = {
      id: questionData.id,
      title: questionData.title,
      content: questionData.content,
      author,
      timestamp: new Date(questionData.created_at).toLocaleString('pt-BR'),
      likes: questionData.likes_count || 0,
      repliesCount: questionData.answers_count || 0,
      views: questionData.views || 0,
      tags: questionData.tags || [],
      category: questionData.category || '',
      replies,
      isBestAnswerSelected: questionData.is_resolved || false,
    }

    // Adicionar badges aos autores
    const authorWithBadges = await addBadgesToAuthor(question.author)
    const repliesWithBadges = await Promise.all(
      replies.map(async reply => {
        const replyAuthorWithBadges = await addBadgesToAuthor(reply.author)
        return { ...reply, author: replyAuthorWithBadges }
      })
    )

    return { ...question, author: authorWithBadges, replies: repliesWithBadges }
  } catch (error) {
    // Silent error handling: Error in getForumQuestionById
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
      // Silent error handling: Error fetching user type
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
        // Silent error handling: Error fetching patient profile
        return null
      }

      // insertData apenas com patient_id (sem nutritionist_id)
      const insertData: any = {
        title,
        content,
        tags,
        author_id: authorId,
        category: category || tags[0] || 'geral',
        patient_id: patientProfile.id,
      }

      const { data, error } = await supabase
        .from('forum_questions')
        .insert(insertData)
        .select('*')
        .single()

      if (error) {
        // Silent error handling: Error creating question
        return null
      }

      // Criar objeto de pergunta para paciente
      const question: ForumQuestion = {
        id: data.id,
        title: data.title,
        content: data.content,
        author: {
          id: patientProfile.id,
          name: patientProfile.full_name || 'Paciente Anônimo',
          userType: 'paciente',
          avatar:
            patientProfile?.profile_image_url ||
            '/placeholder.svg?height=40&width=40',
          credentials: undefined,
          isVerified: false,
        },
        timestamp: new Date(data.created_at).toLocaleString('pt-BR'),
        likes: data.likes_count || 0,
        repliesCount: data.answers_count || 0,
        views: data.views || 0,
        tags: data.tags || [],
        category: data.category || '',
        replies: [],
        isBestAnswerSelected: data.is_resolved || false,
      }

      const authorWithBadges = await addBadgesToAuthor(question.author)
      return { ...question, author: authorWithBadges }
    } else if (userType === 'nutricionista') {
      // Nutricionistas fazem perguntas APENAS para outros nutricionistas
      const { data: nutritionistProfile, error: profileError } = await supabase
        .from('nutritionist_profiles')
        .select(
          'id, full_name, profile_image_url, crn, is_verified, specialties'
        )
        .eq('user_id', authorId)
        .single()

      if (profileError || !nutritionistProfile) {
        // Silent error handling: Error fetching nutritionist profile
        return null
      }

      // insertData apenas com nutritionist_id (sem patient_id)
      const insertData: any = {
        title,
        content,
        tags,
        author_id: authorId,
        category: category || tags[0] || 'geral',
        nutritionist_id: nutritionistProfile.id,
      }

      const { data, error } = await supabase
        .from('forum_questions')
        .insert(insertData)
        .select('*')
        .single()

      if (error) {
        // Silent error handling: Error creating nutritionist question
        return null
      }

      // Criar objeto de pergunta para nutricionista
      const question: ForumQuestion = {
        id: data.id,
        title: data.title,
        content: data.content,
        author: {
          id: nutritionistProfile.id,
          name: nutritionistProfile.full_name || 'Nutricionista Anônimo',
          userType: 'nutricionista',
          avatar:
            nutritionistProfile?.profile_image_url ||
            '/placeholder.svg?height=40&width=40',
          credentials: nutritionistProfile.crn || undefined,
          isVerified: nutritionistProfile.is_verified || true,
          specialties: nutritionistProfile.specialties || [],
        },
        timestamp: new Date(data.created_at).toLocaleString('pt-BR'),
        likes: data.likes_count || 0,
        repliesCount: data.answers_count || 0,
        views: data.views || 0,
        tags: data.tags || [],
        category: data.category || '',
        replies: [],
        isBestAnswerSelected: data.is_resolved || false,
      }

      const authorWithBadges = await addBadgesToAuthor(question.author)
      return { ...question, author: authorWithBadges }
    } else {
      // Silent error handling: User type not allowed to create questions
      return null
    }
  } catch (error) {
    // Silent error handling: Error in createForumQuestion
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
    console.log('Iniciando createForumAnswer:', {
      questionId,
      authorId,
      contentLength: content.length,
    })

    // Primeiro, verificar o tipo de usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', authorId)
      .single()

    console.log('Verificação de usuário:', { userData: !!userData, userError })

    if (userError || !userData) {
      console.error('Erro ao buscar tipo de usuário:', userError)
      return null
    }

    const userType = userData.user_type

    // RESTRIÇÃO: Apenas nutricionistas podem responder
    if (userType !== 'nutricionista') {
      console.error('Usuário não é nutricionista:', userType)
      throw new Error('Apenas nutricionistas podem responder no fórum')
    }

    // Buscar o perfil do nutricionista para obter o ID correto
    const { data: nutritionistProfile, error: profileError } = await supabase
      .from('nutritionist_profiles')
      .select('id, full_name, profile_image_url, crn, is_verified')
      .eq('user_id', authorId)
      .single()

    console.log('Perfil do nutricionista:', {
      nutritionistProfile: !!nutritionistProfile,
      profileError,
    })

    if (profileError || !nutritionistProfile) {
      console.error('Erro ao buscar perfil do nutricionista:', profileError)
      return null
    }

    console.log('Tentando inserir resposta no fórum...')

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

    console.log('Resultado da inserção:', { data: !!data, error })

    if (error) {
      console.error('Erro detalhado ao inserir resposta:', error)
      return null
    }

    console.log('Resposta criada com sucesso:', data.id)

    const reply: ForumReply = {
      id: data.id,
      content: data.content,
      author: {
        id: nutritionistProfile.id,
        name: nutritionistProfile?.full_name || 'Nutricionista',
        userType: 'nutricionista',
        avatar:
          nutritionistProfile?.profile_image_url ||
          '/placeholder.svg?height=40&width=40',
        credentials: nutritionistProfile?.crn
          ? `CRN ${nutritionistProfile.crn}`
          : undefined,
        isVerified: nutritionistProfile?.is_verified || false,
      },
      timestamp: new Date(data.created_at).toLocaleString('pt-BR'),
      likes: data.likes_count || 0,
      isBestAnswer: data.is_best_answer || false,
    }

    const authorWithBadges = await addBadgesToAuthor(reply.author)
    return { ...reply, author: authorWithBadges }
  } catch (error) {
    console.error('Erro ao criar resposta do fórum:', error)
    return null
  }
}

// Função para curtir um item do fórum
export async function likeForumItem(
  itemId: string,
  type: 'question' | 'reply',
  userId: string
): Promise<boolean> {
  try {
    const tableName =
      type === 'question' ? 'forum_question_likes' : 'forum_answer_likes'
    const columnName = type === 'question' ? 'question_id' : 'answer_id'

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
      const { error } = await supabase.from(tableName).insert({
        [columnName]: itemId,
        user_id: userId,
      })

      return !error
    }
  } catch (error) {
    // Silent error handling - likeForumItem failed
    return false
  }
}

// Função para incrementar visualizações
export async function incrementQuestionViews(
  questionId: string
): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('increment_question_views', {
      question_id: questionId,
    })

    if (error) {
      // Silent error handling - view increment failed
      return false
    }

    return true
  } catch (error) {
    // Silent error handling - incrementQuestionViews failed
    return false
  }
}

// Função para marcar resposta como melhor resposta
export async function markBestAnswer(
  questionId: string,
  answerId: string
): Promise<boolean> {
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
      // Silent error handling - best answer marking failed
      return false
    }

    // Atualizar a pergunta
    const { error: questionError } = await supabase
      .from('forum_questions')
      .update({
        best_answer_id: answerId,
        is_resolved: true,
      })
      .eq('id', questionId)

    if (questionError) {
      // Silent error handling - question update failed
      return false
    }

    return true
  } catch (error) {
    // Silent error handling - markBestAnswer failed
    return false
  }
}

// Função para editar uma pergunta do fórum
export async function updateForumQuestion(
  questionId: string,
  title: string,
  content: string,
  tags: string[],
  userId: string,
  category?: string
): Promise<boolean> {
  try {
    // Verificar se o usuário é o autor da pergunta
    const { data: question, error: checkError } = await supabase
      .from('forum_questions')
      .select('author_id')
      .eq('id', questionId)
      .single()

    if (checkError || !question) {
      // Silent error handling - authorship check failed
      return false
    }

    if (question.author_id !== userId) {
      // Silent error handling - unauthorized edit attempt
      return false
    }

    // Atualizar a pergunta
    const { error } = await supabase
      .from('forum_questions')
      .update({
        title: title.trim(),
        content: content.trim(),
        tags,
        category: category || tags[0] || 'geral',
        updated_at: new Date().toISOString(),
      })
      .eq('id', questionId)

    if (error) {
      // Silent error handling - question update failed
      return false
    }

    return true
  } catch (error) {
    // Silent error handling - updateForumQuestion failed
    return false
  }
}

// Função para deletar uma pergunta do fórum
export async function deleteForumQuestion(
  questionId: string,
  userId: string
): Promise<boolean> {
  try {
    // Verificar se o usuário é o autor da pergunta
    const { data: question, error: checkError } = await supabase
      .from('forum_questions')
      .select('author_id')
      .eq('id', questionId)
      .single()

    if (checkError || !question) {
      // Silent error handling - authorship check failed
      return false
    }

    if (question.author_id !== userId) {
      // Silent error handling - unauthorized deletion attempt
      return false
    }

    // Deletar a pergunta (as respostas serão deletadas automaticamente por CASCADE)
    const { error } = await supabase
      .from('forum_questions')
      .delete()
      .eq('id', questionId)

    if (error) {
      // Silent error handling - question deletion failed
      return false
    }

    return true
  } catch (error) {
    // Silent error handling - deleteForumQuestion failed
    return false
  }
}

// Função para editar uma resposta do fórum
export async function updateForumAnswer(
  answerId: string,
  content: string,
  userId: string
): Promise<boolean> {
  try {
    // Verificar se o usuário é o autor da resposta
    const { data: answer, error: checkError } = await supabase
      .from('forum_answers')
      .select('author_id')
      .eq('id', answerId)
      .single()

    if (checkError || !answer) {
      // Silent error handling - authorship check failed
      return false
    }

    if (answer.author_id !== userId) {
      // Silent error handling - unauthorized edit attempt
      return false
    }

    // Atualizar a resposta
    const { error } = await supabase
      .from('forum_answers')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', answerId)

    if (error) {
      // Silent error handling - answer update failed
      return false
    }

    return true
  } catch (error) {
    // Silent error handling - updateForumAnswer failed
    return false
  }
}

// Função para deletar uma resposta do fórum
export async function deleteForumAnswer(
  answerId: string,
  userId: string
): Promise<boolean> {
  try {
    // Verificar se o usuário é o autor da resposta
    const { data: answer, error: checkError } = await supabase
      .from('forum_answers')
      .select('author_id')
      .eq('id', answerId)
      .single()

    if (checkError || !answer) {
      // Silent error handling - authorship check failed
      return false
    }

    if (answer.author_id !== userId) {
      // Silent error handling - unauthorized deletion attempt
      return false
    }

    // Deletar a resposta
    const { error } = await supabase
      .from('forum_answers')
      .delete()
      .eq('id', answerId)

    if (error) {
      // Silent error handling - answer deletion failed
      return false
    }

    return true
  } catch (error) {
    // Silent error handling - deleteForumAnswer failed
    return false
  }
}

// Função para limpar dados não persistidos do fórum
export async function cleanupForumData(): Promise<{
  deletedQuestions: number
  deletedAnswers: number
  deletedLikes: number
}> {
  try {
    // Silent cleanup process start
    let deletedQuestions = 0
    let deletedAnswers = 0
    let deletedLikes = 0

    // 1. Remover perguntas órfãs (sem autor válido)
    const { data: orphanQuestions } = await supabase
      .from('forum_questions')
      .select('id, author_id')
      .not('author_id', 'is', null)

    if (orphanQuestions) {
      for (const question of orphanQuestions) {
        // Verificar se o usuário ainda existe
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('id', question.author_id)
          .single()

        if (!user) {
          const { error } = await supabase
            .from('forum_questions')
            .delete()
            .eq('id', question.id)

          if (!error) {
            deletedQuestions++
            // Silent orphan question removal
          }
        }
      }
    }

    // 2. Remover respostas órfãs (sem autor válido ou pergunta válida)
    const { data: orphanAnswers } = await supabase
      .from('forum_answers')
      .select('id, author_id, question_id')
      .not('author_id', 'is', null)

    if (orphanAnswers) {
      for (const answer of orphanAnswers) {
        let shouldDelete = false

        // Verificar se o usuário ainda existe
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('id', answer.author_id)
          .single()

        if (!user) {
          shouldDelete = true
        } else {
          // Verificar se a pergunta ainda existe
          const { data: question } = await supabase
            .from('forum_questions')
            .select('id')
            .eq('id', answer.question_id)
            .single()

          if (!question) {
            shouldDelete = true
          }
        }

        if (shouldDelete) {
          const { error } = await supabase
            .from('forum_answers')
            .delete()
            .eq('id', answer.id)

          if (!error) {
            deletedAnswers++
            // Silent orphan answer removal
          }
        }
      }
    }

    // 3. Remover likes órfãos (de perguntas ou respostas que não existem mais)
    const { data: orphanQuestionLikes } = await supabase
      .from('forum_question_likes')
      .select('id, question_id, user_id')

    if (orphanQuestionLikes) {
      for (const like of orphanQuestionLikes) {
        let shouldDelete = false

        // Verificar se a pergunta ainda existe
        const { data: question } = await supabase
          .from('forum_questions')
          .select('id')
          .eq('id', like.question_id)
          .single()

        if (!question) {
          shouldDelete = true
        } else {
          // Verificar se o usuário ainda existe
          const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('id', like.user_id)
            .single()

          if (!user) {
            shouldDelete = true
          }
        }

        if (shouldDelete) {
          const { error } = await supabase
            .from('forum_question_likes')
            .delete()
            .eq('id', like.id)

          if (!error) {
            deletedLikes++
            // Silent orphan question like removal
          }
        }
      }
    }

    const { data: orphanAnswerLikes } = await supabase
      .from('forum_answer_likes')
      .select('id, answer_id, user_id')

    if (orphanAnswerLikes) {
      for (const like of orphanAnswerLikes) {
        let shouldDelete = false

        // Verificar se a resposta ainda existe
        const { data: answer } = await supabase
          .from('forum_answers')
          .select('id')
          .eq('id', like.answer_id)
          .single()

        if (!answer) {
          shouldDelete = true
        } else {
          // Verificar se o usuário ainda existe
          const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('id', like.user_id)
            .single()

          if (!user) {
            shouldDelete = true
          }
        }

        if (shouldDelete) {
          const { error } = await supabase
            .from('forum_answer_likes')
            .delete()
            .eq('id', like.id)

          if (!error) {
            deletedLikes++
            // Silent orphan answer like removal
          }
        }
      }
    }

    // Silent cleanup completion
    return {
      deletedQuestions,
      deletedAnswers,
      deletedLikes,
    }
  } catch (error) {
    // Silent error handling - cleanup failed
    throw error
  }
}

// Função para deletar pergunta de nutricionista
export async function deleteNutritionistQuestion(questionId: string, nutritionistId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar se a pergunta existe e pertence ao nutricionista
    const { data: question, error: fetchError } = await supabase
      .from('forum_questions')
      .select('id, nutritionist_id')
      .eq('id', questionId)
      .eq('nutritionist_id', nutritionistId)
      .single()

    if (fetchError || !question) {
      return {
        success: false,
        error: 'Pergunta não encontrada ou você não tem permissão para deletá-la'
      }
    }

    // Deletar primeiro as respostas relacionadas
    const { error: answersError } = await supabase
      .from('forum_answers')
      .delete()
      .eq('question_id', questionId)

    if (answersError) {
      return {
        success: false,
        error: 'Erro ao deletar respostas da pergunta'
      }
    }

    // Deletar os likes da pergunta
    const { error: likesError } = await supabase
      .from('forum_question_likes')
      .delete()
      .eq('question_id', questionId)

    if (likesError) {
      return {
        success: false,
        error: 'Erro ao deletar likes da pergunta'
      }
    }

    // Deletar a pergunta
    const { error: deleteError } = await supabase
      .from('forum_questions')
      .delete()
      .eq('id', questionId)
      .eq('nutritionist_id', nutritionistId)

    if (deleteError) {
      return {
        success: false,
        error: 'Erro ao deletar a pergunta'
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: 'Erro interno do servidor'
    }
  }
}
