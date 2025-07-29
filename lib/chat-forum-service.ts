import { supabase } from "./supabase"

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
  patient_id: string
  title: string
  content: string
  category: string
  status: 'open' | 'closed'
  is_anonymous: boolean
  views_count: number
  answers_count: number
  created_at: string
  updated_at: string
  patient_profiles?: {
    full_name: string
    profile_image_url?: string
  }
  forum_answers?: ForumAnswer[]
}

export interface ForumAnswer {
  id: string
  question_id: string
  nutritionist_id: string
  content: string
  is_best_answer: boolean
  likes_count: number
  created_at: string
  updated_at: string
  nutritionist_profiles?: {
    full_name: string
    profile_image_url?: string
    crn: string
    is_verified: boolean
  }
}

// Chat functions
export async function getPatientChatConversations(patientUserId: string): Promise<ChatConversation[]> {
  try {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select(`
        *,
        nutritionist_profiles!chat_conversations_nutritionist_id_fkey (
          full_name,
          profile_image_url,
          crn,
          is_verified
        ),
        last_message:chat_messages!chat_messages_conversation_id_fkey (
          message_text,
          sender_type,
          created_at
        )
      `)
      .eq('patient_id', patientUserId)
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (error) {
      console.error('Error fetching patient chat conversations:', error)
      return []
    }

    // Process the data to get the last message
    const conversations = (data || []).map(conv => {
      const lastMessage = Array.isArray(conv.last_message) && conv.last_message.length > 0
        ? conv.last_message.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        : null
      
      return {
        ...conv,
        last_message: lastMessage
      }
    })

    return conversations
  } catch (error) {
    console.error('Error in getPatientChatConversations:', error)
    return []
  }
}

export async function getNutritionistChatConversations(nutritionistUserId: string): Promise<ChatConversation[]> {
  try {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select(`
        *,
        patient_profiles!chat_conversations_patient_id_fkey (
          full_name,
          profile_image_url
        ),
        last_message:chat_messages!chat_messages_conversation_id_fkey (
          message_text,
          sender_type,
          created_at
        )
      `)
      .eq('nutritionist_id', nutritionistUserId)
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (error) {
      console.error('Error fetching nutritionist chat conversations:', error)
      return []
    }

    // Process the data to get the last message
    const conversations = (data || []).map(conv => {
      const lastMessage = Array.isArray(conv.last_message) && conv.last_message.length > 0
        ? conv.last_message.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        : null
      
      return {
        ...conv,
        last_message: lastMessage
      }
    })

    return conversations
  } catch (error) {
    console.error('Error in getNutritionistChatConversations:', error)
    return []
  }
}

export async function getChatMessages(conversationId: string, userId: string, userType: 'patient' | 'nutritionist'): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender_profile:${userType === 'patient' ? 'nutritionist_profiles' : 'patient_profiles'}!chat_messages_sender_id_fkey (
          full_name,
          profile_image_url
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching chat messages:', error)
      return []
    }

    // Mark messages as read
    await supabase
      .from('chat_messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false)

    return data || []
  } catch (error) {
    console.error('Error in getChatMessages:', error)
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
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        sender_type: userType,
        message_text: messageText.trim(),
        message_type: messageType,
        file_url: fileUrl,
        file_name: fileName,
        is_read: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error sending chat message:', error)
      throw error
    }

    // Update conversation last_message_at
    await supabase
      .from('chat_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId)

    return data
  } catch (error) {
    console.error('Error in sendChatMessage:', error)
    throw error
  }
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
        status: 'active'
      })
      .select(`
        *,
        nutritionist_profiles!chat_conversations_nutritionist_id_fkey (
          full_name,
          profile_image_url,
          crn,
          is_verified
        ),
        patient_profiles!chat_conversations_patient_id_fkey (
          full_name,
          profile_image_url
        )
      `)
      .single()

    if (error) {
      console.error('Error creating chat conversation:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in createChatConversation:', error)
    throw error
  }
}

// Forum functions
export async function getForumQuestions(
  patientUserId?: string,
  category?: string,
  limit: number = 20
): Promise<ForumQuestion[]> {
  try {
    let query = supabase
      .from('forum_questions')
      .select(`
        *,
        patient_profiles!forum_questions_patient_id_fkey (
          full_name,
          profile_image_url
        ),
        forum_answers!forum_answers_question_id_fkey (
          id,
          content,
          is_best_answer,
          likes_count,
          created_at,
          nutritionist_profiles!forum_answers_nutritionist_id_fkey (
            full_name,
            profile_image_url,
            crn,
            is_verified
          )
        )
      `)

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching forum questions:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getForumQuestions:', error)
    return []
  }
}

export async function getPatientForumQuestions(patientUserId: string): Promise<ForumQuestion[]> {
  try {
    const { data, error } = await supabase
      .from('forum_questions')
      .select(`
        *,
        patient_profiles!forum_questions_patient_id_fkey (
          full_name,
          profile_image_url
        ),
        forum_answers!forum_answers_question_id_fkey (
          id,
          content,
          is_best_answer,
          likes_count,
          created_at,
          nutritionist_profiles!forum_answers_nutritionist_id_fkey (
            full_name,
            profile_image_url,
            crn,
            is_verified
          )
        )
      `)
      .eq('patient_id', patientUserId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching patient forum questions:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getPatientForumQuestions:', error)
    return []
  }
}

export async function createForumQuestion(
  patientUserId: string,
  title: string,
  content: string,
  category: string,
  isAnonymous: boolean = false
): Promise<ForumQuestion> {
  try {
    const { data, error } = await supabase
      .from('forum_questions')
      .insert({
        patient_id: patientUserId,
        title: title.trim(),
        content: content.trim(),
        category,
        is_anonymous: isAnonymous,
        status: 'open',
        views_count: 0,
        answers_count: 0
      })
      .select(`
        *,
        patient_profiles!forum_questions_patient_id_fkey (
          full_name,
          profile_image_url
        )
      `)
      .single()

    if (error) {
      console.error('Error creating forum question:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in createForumQuestion:', error)
    throw error
  }
}

export async function incrementForumQuestionViews(questionId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('increment_forum_question_views', {
      question_id: questionId
    })

    if (error) {
      console.error('Error incrementing forum question views:', error)
    }
  } catch (error) {
    console.error('Error in incrementForumQuestionViews:', error)
  }
}

export async function getForumQuestionById(questionId: string): Promise<ForumQuestion | null> {
  try {
    const { data, error } = await supabase
      .from('forum_questions')
      .select(`
        *,
        patient_profiles!forum_questions_patient_id_fkey (
          full_name,
          profile_image_url
        ),
        forum_answers!forum_answers_question_id_fkey (
          id,
          content,
          is_best_answer,
          likes_count,
          created_at,
          updated_at,
          nutritionist_profiles!forum_answers_nutritionist_id_fkey (
            full_name,
            profile_image_url,
            crn,
            is_verified
          )
        )
      `)
      .eq('id', questionId)
      .single()

    if (error) {
      console.error('Error fetching forum question:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getForumQuestionById:', error)
    return null
  }
}

export async function likeForumQuestion(questionId: string, userId: string): Promise<boolean> {
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
        console.error('Error removing like from forum question:', deleteError)
        return false
      }

      return true
    } else {
      // Like
      const { error: insertError } = await supabase
        .from('forum_question_likes')
        .insert({
          question_id: questionId,
          user_id: userId
        })

      if (insertError) {
        console.error('Error liking forum question:', insertError)
        return false
      }

      return true
    }
  } catch (error) {
    console.error('Error in likeForumQuestion:', error)
    return false
  }
}

export async function likeForumAnswer(answerId: string, userId: string): Promise<boolean> {
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
        console.error('Error removing like from forum answer:', deleteError)
        return false
      }

      return true
    } else {
      // Like
      const { error: insertError } = await supabase
        .from('forum_answer_likes')
        .insert({
          answer_id: answerId,
          user_id: userId
        })

      if (insertError) {
        console.error('Error liking forum answer:', insertError)
        return false
      }

      return true
    }
  } catch (error) {
    console.error('Error in likeForumAnswer:', error)
    return false
  }
}

export async function selectBestAnswer(questionId: string, answerId: string, userId: string): Promise<boolean> {
  try {
    // Verify that the user is the question author
    const { data: question } = await supabase
      .from('forum_questions')
      .select('patient_id')
      .eq('id', questionId)
      .single()

    if (!question || question.patient_id !== userId) {
      console.error('User is not authorized to select best answer')
      return false
    }

    // Remove best answer from other answers
    await supabase
      .from('forum_answers')
      .update({ is_best_answer: false })
      .eq('question_id', questionId)

    // Set the selected answer as best
    const { error } = await supabase
      .from('forum_answers')
      .update({ is_best_answer: true })
      .eq('id', answerId)

    if (error) {
      console.error('Error selecting best answer:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in selectBestAnswer:', error)
    return false
  }
}

export async function createForumAnswer(
  questionId: string,
  content: string,
  userId: string,
  userType: 'patient' | 'nutritionist'
): Promise<ForumAnswer | null> {
  try {
    const insertData: any = {
      question_id: questionId,
      content: content.trim(),
      is_best_answer: false,
      likes_count: 0
    }

    if (userType === 'nutritionist') {
      insertData.nutritionist_id = userId
    } else {
      insertData.patient_id = userId
    }

    const { data, error } = await supabase
      .from('forum_answers')
      .insert(insertData)
      .select(`
        *,
        nutritionist_profiles!forum_answers_nutritionist_id_fkey (
          full_name,
          profile_image_url,
          crn,
          is_verified
        ),
        patient_profiles!forum_answers_patient_id_fkey (
          full_name,
          profile_image_url
        )
      `)
      .single()

    if (error) {
      console.error('Error creating forum answer:', error)
      return null
    }

    // Increment answers count
    await supabase.rpc('increment_forum_answers_count', {
      question_id: questionId
    })

    return data
  } catch (error) {
    console.error('Error in createForumAnswer:', error)
    return null
  }
}