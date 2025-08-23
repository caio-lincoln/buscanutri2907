import { createSupabaseClient } from './supabase'
import { ForumAuthor, ForumReply } from './forum-data'
const supabase = createSupabaseClient()
// Chat interfaces
export interface ChatConversation {
  id: string
  patient_id: string
  nutritionist_id: string
  appointment_id?: string
  status: 'active' | 'closed'
  closed_by?: string
  closure_reason?: string
  closed_at?: string
  last_message_at?: string
  created_at: string
  updated_at: string
  nutritionist_profiles?: {
    full_name: string
    profile_image_url?: string
    crn: string
    is_verified: boolean
  }
  patient_profiles?: {
    full_name: string
    profile_image_url?: string
  }
  last_message?: {
    message_text: string
    sender_type: 'patient' | 'nutritionist'
    created_at: string
  }
}

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_id: string
  sender_type: 'patient' | 'nutritionist'
  message_text: string
  message_type: 'text' | 'image' | 'file'
  file_url?: string
  file_name?: string
  is_read: boolean
  read_at?: string
  created_at: string
  updated_at: string
  sender_profile?: {
    full_name: string
    profile_image_url?: string
  }
}

// Forum interfaces
export interface ForumQuestion {
  id: string
  author_id: string
  title: string
  content: string
  tags: string[]
  views: number
  answers_count: number
  likes_count: number
  is_answered: boolean
  best_answer_id?: string
  created_at: string
  updated_at: string
  last_activity_at: string
  author_profile?: {
    full_name: string
    profile_image_url?: string
    user_type: string
    crn?: string
    is_verified?: boolean
  }
  forum_answers?: ForumAnswer[]
}

export interface ForumAnswer {
  id: string
  question_id: string
  author_id: string
  content: string
  is_accepted: boolean
  likes_count: number
  created_at: string
  updated_at: string
  author_profile?: {
    full_name: string
    profile_image_url?: string
    user_type: string
    crn?: string
    is_verified?: boolean
  }
}

// Chat functions
export async function getPatientChatConversations(patientId: string): Promise<ChatConversation[]> {
  const { data, error } = await supabase
  .from('chat_conversations')
  .select(`
    id, patient_id, nutritionist_id, status, created_at, last_message_at, last_message_text, is_unlocked,
    nutritionist_profiles ( id, full_name, profile_image_url )
    `)
    .eq('patient_id', patientId)
    .order('last_message_at', { ascending: false })
    .order('created_at', { ascending: false });
    
    if (error) throw error;

  // adapta ao que seu componente espera (last_message?.message_text)
  return (data ?? []).map((row: any) => ({
    ...row,
    last_message: { message_text: row.last_message_text }
  }));
}
export async function getNutritionistChatConversations(
  nutritionistUserId: string
): Promise<ChatConversation[]> {
  try {
    const { data: conversations, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('nutritionist_id', nutritionistUserId)
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (error) {
      // Silent error handling: Error fetching nutritionist chat conversations
      return []
    }

    if (!conversations || conversations.length === 0) {
      return []
    }

    // Buscar perfis dos pacientes separadamente
    const patientIds = [
      ...new Set(conversations.map(c => c.patient_id).filter(Boolean)),
    ]
    let patientProfiles: any[] = []

    if (patientIds.length > 0) {
      const { data: profiles } = await supabase
        .from('patient_profiles')
        .select('user_id, full_name, profile_image_url')
        .in('user_id', patientIds)

      patientProfiles = profiles || []
    }

    // Buscar últimas mensagens separadamente
    const conversationIds = conversations.map(c => c.id)
    let lastMessages: any[] = []

    if (conversationIds.length > 0) {
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('conversation_id, message_text, sender_type, created_at')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false })

      lastMessages = messages || []
    }

    // Combinar os dados
    const result = conversations.map((conv: any) => {
      const patientProfile = patientProfiles.find(
        pp => pp.user_id === conv.patient_id
      )
      const conversationMessages = lastMessages.filter(
        msg => msg.conversation_id === conv.id
      )
      const lastMessage =
        conversationMessages.length > 0 ? conversationMessages[0] : null

      return {
        ...conv,
        patient_profiles: patientProfile || null,
        last_message: lastMessage,
      }
    })

    return result
  } catch (error) {
    // Silent error handling: Error in getNutritionistChatConversations
    return []
  }
}

export async function openConversationWithNutritionist(nutritionistId: string): Promise<string> {
  const { data, error } = await supabase.rpc('chat_start', { nutritionist: nutritionistId });
  if (error) throw error;
  return data as string; 
}

export async function getChatMessages(
  conversationId: string,
  userId: string,
  userType: 'patient' | 'nutritionist'
): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(
        `
        *
      `
      )
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      // Silent error handling: Error fetching chat messages
      return []
    }

    // Mark messages as read
    await supabase
      .from('chat_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      // .eq('read_at', 'null')

    return data || []
  } catch (error) {
    // Silent error handling: Error in getChatMessages
    return []
  }
}

export async function sendChatMessage(
  conversationId: string,
  userId: string,
  userType: 'patient' | 'nutritionist',
  messageText: string,
  messageType: 'text' | 'image' | 'file' = 'text',
  fileUrl?: string,
  fileName?: string
): Promise<ChatMessage> {
  // 1) Pega o ID do perfil (patient_profiles.id OU nutritionist_profiles.id)
  const profileTable =
    userType === 'patient' ? 'patient_profiles' : 'nutritionist_profiles'

  const { data: profile, error: profileError } = await supabase
  .from(profileTable)
  .select('id')
  .eq('user_id', userId)
  .maybeSingle()
  
  if (profileError) throw profileError
  if (!profile?.id) throw new Error(`Perfil (${profileTable}) não encontrado para este usuário.`)

  const senderProfileId = profile.id as string

  const trimmed = (messageText ?? '').trim()
  if (messageType === 'text' && trimmed.length === 0) {
    throw new Error('Mensagem de texto vazia.')
  }

  // 3) Insert
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderProfileId,     
      sender_type: userType,
      message_text: messageType === 'text' ? trimmed : trimmed || null,
      message_type: messageType,
      file_url: fileUrl ?? null,
      file_name: fileName ?? null,
    })
    .select('*')
    .single()

  if (error) {
    
    throw error
  }

  return data as ChatMessage
}

export async function createChatConversation(
  patientUserId: string,
  nutritionistId: string,
  appointmentId?: string
): Promise<ChatConversation> {
  try {
    // Check if conversation already exists
    const { data: existingConversation } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('patient_id', patientUserId)
      .eq('nutritionist_id', nutritionistId)
      .eq('status', 'active')
      .single()

    if (existingConversation) {
      return existingConversation
    }

    // Create new conversation
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        patient_id: patientUserId,
        nutritionist_id: nutritionistId,
        appointment_id: appointmentId,
        status: 'active',
      })
      .select('*')
      .single()

    if (error) {
      // Silent error handling: Error creating chat conversation
      throw error
    }

    return data
  } catch (error) {
    // Silent error handling: Error in createChatConversation
    throw error
  }
}

// Forum functions
// Função para buscar perguntas do fórum
export async function getForumQuestions(): Promise<ForumQuestion[]> {
  try {
    const { data, error } = await supabase.rpc(
      'get_forum_questions_with_profiles'
    )

    if (error) {
      // Silent error handling: Error fetching forum questions
      return []
    }

    return data || []
  } catch (error) {
    // Silent error handling: Error in getForumQuestions
    return []
  }
}

// Função para buscar perguntas do fórum específicas do paciente
export async function getPatientForumQuestions(
  patientId: string
): Promise<ForumQuestion[]> {
  try {
    const { data, error } = await supabase.rpc(
      'get_forum_questions_with_profiles'
    )

    if (error) {
      // Silent error handling: Error fetching patient forum questions
      return []
    }

    // Filtrar por paciente no lado do cliente
    const filteredData =
      data?.filter(
        (question: ForumQuestion) => question.author_id === patientId
      ) || []

    return filteredData
  } catch (error) {
    // Silent error handling: Error in getPatientForumQuestions
    return []
  }
}

export async function createForumQuestion(
  userId: string,
  title: string,
  content: string,
  tags: string[]
): Promise<ForumQuestion> {
  try {
    // First determine user type and get appropriate profile ID
    const { data: user } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', userId)
      .single()

    if (!user) {
      throw new Error('User not found')
    }

    const insertData: any = {
      author_id: userId,
      title: title.trim(),
      content: content.trim(),
      tags,
      views: 0,
      answers_count: 0,
      likes_count: 0,
      is_answered: false,
      last_activity_at: new Date().toISOString(),
    }

    // Get profile ID based on user type
    if (user.user_type === 'paciente') {
      const { data: patientProfile } = await supabase
        .from('patient_profiles')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (patientProfile) {
        insertData.patient_id = patientProfile.id
      }
    } else if (user.user_type === 'nutricionista') {
      const { data: nutritionistProfile } = await supabase
        .from('nutritionist_profiles')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (nutritionistProfile) {
        insertData.nutritionist_id = nutritionistProfile.id
      }
    }

    const { data, error } = await supabase
      .from('forum_questions')
      .insert(insertData)
      .select('*')
      .single()

    if (error) {
      // Silent error handling: Error creating forum question
      throw error
    }

    // Get the author profile separately (still needed for return data)
    const { data: authorProfile } = await supabase
      .from('user_profiles')
      .select('full_name, profile_image_url, user_type, crn, is_verified')
      .eq('user_id', userId)
      .single()

    return {
      ...data,
      author_profile: authorProfile,
    }
  } catch (error) {
    // Silent error handling: Error in createForumQuestion
    throw error
  }
}

export async function incrementForumQuestionViews(
  questionId: string
): Promise<void> {
  try {
    // First get current views count
    const { data: question } = await supabase
      .from('forum_questions')
      .select('views')
      .eq('id', questionId)
      .single()

    if (question) {
      const { error } = await supabase
        .from('forum_questions')
        .update({
          views: question.views + 1,
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', questionId)

      if (error) {
        // Silent error handling: Error incrementing forum question views
      }
    }
  } catch (error) {
    // Silent error handling: Error in incrementForumQuestionViews
  }
}

export async function getForumQuestionById(
  questionId: string
): Promise<ForumQuestion | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_forum_question_with_answers', { question_id: questionId })
      .single()

    if (error) {
      // Silent error handling: Error fetching forum question
      return null
    }

    if (!data) {
      return null
    }

    // Converter os dados da função RPC para o formato ForumQuestion
    const author: ForumAuthor = {
      id: data.patient_id,
      name: data.author_profile?.full_name || 'Usuário Anônimo',
      userType: 'paciente',
      avatar:
        data.author_profile?.profile_image_url ||
        '/placeholder.svg?height=40&width=40',
      credentials: undefined,
      isVerified: false,
    }

    const replies: ForumReply[] = (data.forum_answers || []).map(
      (answer: any) => ({
        id: answer.id,
        content: answer.content,
        author: {
          id: answer.nutritionist_id,
          name: answer.author_profile?.full_name || 'Usuário Anônimo',
          userType: 'nutricionista',
          avatar:
            answer.author_profile?.profile_image_url ||
            '/placeholder.svg?height=40&width=40',
          credentials: answer.author_profile?.crn
            ? `CRN ${answer.author_profile.crn}`
            : undefined,
          isVerified: answer.author_profile?.is_verified || false,
        },
        timestamp: new Date(answer.created_at).toLocaleString('pt-BR'),
        likes: answer.likes_count || 0,
        isBestAnswer: answer.is_best_answer || false,
      })
    )

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
      category: data.category || '',
      replies,
      isBestAnswerSelected: data.is_answered || false,
    }

    return question
  } catch (error) {
    // Silent error handling: Error in getForumQuestionById
    return null
  }
}

export async function likeForumQuestion(
  questionId: string,
  userId: string
): Promise<boolean> {
  try {
    // Check if user already liked this question
    const { data: existingLike } = await supabase
      .from('forum_question_likes')
      .select('id')
      .eq('question_id', questionId)
      .eq('user_id', userId)
      .single()

    if (existingLike) {
      // Unlike
      const { error: deleteError } = await supabase
        .from('forum_question_likes')
        .delete()
        .eq('question_id', questionId)
        .eq('user_id', userId)

      if (deleteError) {
        // Silent error handling: Error removing like from forum question
        return false
      }

      return true
    } else {
      // Like
      const { error: insertError } = await supabase
        .from('forum_question_likes')
        .insert({
          question_id: questionId,
          user_id: userId,
        })

      if (insertError) {
        // Silent error handling: Error liking forum question
        return false
      }

      return true
    }
  } catch (error) {
    // Silent error handling: Error in likeForumQuestion
    return false
  }
}

export async function likeForumAnswer(
  answerId: string,
  userId: string
): Promise<boolean> {
  try {
    // Check if user already liked this answer
    const { data: existingLike } = await supabase
      .from('forum_answer_likes')
      .select('id')
      .eq('answer_id', answerId)
      .eq('user_id', userId)
      .single()

    if (existingLike) {
      // Unlike
      const { error: deleteError } = await supabase
        .from('forum_answer_likes')
        .delete()
        .eq('answer_id', answerId)
        .eq('user_id', userId)

      if (deleteError) {
        // Silent error handling: Error removing like from forum answer
        return false
      }

      return true
    } else {
      // Like
      const { error: insertError } = await supabase
        .from('forum_answer_likes')
        .insert({
          answer_id: answerId,
          user_id: userId,
        })

      if (insertError) {
        // Silent error handling: Error liking forum answer
        return false
      }

      return true
    }
  } catch (error) {
    // Silent error handling: Error in likeForumAnswer
    return false
  }
}

export async function selectBestAnswer(
  questionId: string,
  answerId: string,
  userId: string
): Promise<boolean> {
  try {
    // Verify that the user is the question author
    const { data: question } = await supabase
      .from('forum_questions')
      .select('author_id')
      .eq('id', questionId)
      .single()

    if (!question || question.author_id !== userId) {
      // Silent error handling: User is not authorized to select best answer
      return false
    }

    // Update question with best answer and mark as answered
    const { error } = await supabase
      .from('forum_questions')
      .update({
        best_answer_id: answerId,
        is_answered: true,
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', questionId)

    if (error) {
      // Silent error handling: Error selecting best answer
      return false
    }

    // Mark the answer as accepted
    await supabase
      .from('forum_answers')
      .update({ is_accepted: true })
      .eq('id', answerId)

    return true
  } catch (error) {
    // Silent error handling: Error in selectBestAnswer
    return false
  }
}

export async function createForumAnswer(
  questionId: string,
  content: string,
  userId: string
): Promise<ForumAnswer | null> {
  try {
    // First determine user type and get appropriate profile ID
    const { data: user } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', userId)
      .single()

    if (!user) {
      // Silent error handling: User not found
      return null
    }

    const insertData: any = {
      question_id: questionId,
      author_id: userId,
      content: content.trim(),
      is_accepted: false,
      likes_count: 0,
    }

    // Get profile ID based on user type (only nutritionists can answer)
    if (user.user_type === 'nutricionista') {
      const { data: nutritionistProfile } = await supabase
        .from('nutritionist_profiles')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (nutritionistProfile) {
        insertData.nutritionist_id = nutritionistProfile.id
      }
    } else {
      // Silent error handling: Only nutritionists can create forum answers
      return null
    }

    const { data, error } = await supabase
      .from('forum_answers')
      .insert(insertData)
      .select('*')
      .single()

    if (error) {
      // Silent error handling: Error creating forum answer
      return null
    }

    // Get the author profile separately (still needed for return data)
    const { data: authorProfile } = await supabase
      .from('user_profiles')
      .select('full_name, profile_image_url, user_type, crn, is_verified')
      .eq('user_id', userId)
      .single()

    // Update question"s last activity
    await supabase
      .from('forum_questions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', questionId)

    return {
      ...data,
      author_profile: authorProfile,
    }
  } catch (error) {
    // Silent error handling: Error in createForumAnswer
    return null
  }
}
