import { createSupabaseClient } from './supabase'

const supabase = createSupabaseClient()

export interface BlogEngagement {
  id: string
  title: string
  views: number
  created_at: string
  tags: string[]
}

export interface ForumEngagement {
  id: string
  title: string
  answers_count: number
  views: number
  likes_count: number
  created_at: string
  is_answered: boolean
}

export interface ContentEngagementStats {
  totalBlogPosts: number
  totalBlogViews: number
  totalForumAnswers: number
  totalForumQuestions: number
  totalForumViews: number
  averageEngagementRate: number
  topBlogPosts: BlogEngagement[]
  topForumQuestions: ForumEngagement[]
}

/**
 * Busca estatísticas de engajamento de conteúdo para um nutricionista
 */
export async function getContentEngagementStats(
  nutritionistId: string
): Promise<ContentEngagementStats> {
  try {
    // Buscar posts do blog do nutricionista
    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('id, title, views, created_at, tags')
      .eq('author_id', nutritionistId)
      .order('views', { ascending: false })

    if (blogError) {
      // Silent error handling: Error fetching blog posts
      throw blogError
    }

    // Buscar respostas do fórum do nutricionista
    const { data: forumAnswers, error: forumAnswersError } = await supabase
      .from('forum_answers')
      .select('id, question_id, likes_count, created_at')
      .eq('author_id', nutritionistId)

    if (forumAnswersError) {
      // Silent error handling: Error fetching forum answers
    }

    // Buscar perguntas respondidas pelo nutricionista (para estatísticas)
    const questionIds = forumAnswers?.map(answer => answer.question_id) || []
    let forumQuestions: any[] = []

    if (questionIds.length > 0) {
      const { data: questions, error: questionsError } = await supabase
        .from('forum_questions')
        .select(
          'id, title, views, answers_count, likes_count, created_at, is_answered'
        )
        .in('id', questionIds)
        .order('views', { ascending: false })

      if (questionsError) {
        // Silent error handling: Error fetching forum questions
      } else {
        forumQuestions = questions || []
      }
    }

    // Calcular estatísticas
    const totalBlogPosts = blogPosts?.length || 0
    const totalBlogViews =
      blogPosts?.reduce((sum, post) => sum + (post.views || 0), 0) || 0
    const totalForumAnswers = forumAnswers?.length || 0
    const totalForumQuestions = forumQuestions.length
    const totalForumViews = forumQuestions.reduce(
      (sum, question) => sum + (question.views || 0),
      0
    )

    // Calcular taxa de engajamento média (views + answers)
    const totalEngagement = totalBlogViews + totalForumViews + totalForumAnswers
    const totalContent = totalBlogPosts + totalForumQuestions
    const averageEngagementRate =
      totalContent > 0 ? Math.round(totalEngagement / totalContent) : 0

    // Top 5 posts do blog
    const topBlogPosts: BlogEngagement[] = (blogPosts || [])
      .slice(0, 5)
      .map(post => ({
        id: post.id,
        title: post.title,
        views: post.views || 0,
        created_at: post.created_at,
        tags: post.tags || [],
      }))

    // Top 5 perguntas do fórum respondidas
    const topForumQuestions: ForumEngagement[] = forumQuestions
      .slice(0, 5)
      .map(question => ({
        id: question.id,
        title: question.title,
        answers_count: question.answers_count || 0,
        views: question.views || 0,
        likes_count: question.likes_count || 0,
        created_at: question.created_at,
        is_answered: question.is_answered || false,
      }))

    return {
      totalBlogPosts,
      totalBlogViews,
      totalForumAnswers,
      totalForumQuestions,
      totalForumViews,
      averageEngagementRate,
      topBlogPosts,
      topForumQuestions,
    }
  } catch (error) {
    // Silent error handling: Error fetching engagement statistics
    return {
      totalBlogPosts: 0,
      totalBlogViews: 0,
      totalForumAnswers: 0,
      totalForumQuestions: 0,
      totalForumViews: 0,
      averageEngagementRate: 0,
      topBlogPosts: [],
      topForumQuestions: [],
    }
  }
}

/**
 * Busca dados detalhados de um post específico do blog
 */
export async function getBlogPostDetails(
  postId: string
): Promise<BlogEngagement | null> {
  try {
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('id, title, views, created_at, tags')
      .eq('id', postId)
      .single()

    if (error) {
      // Silent error handling: Error fetching post details
      return null
    }

    return {
      id: post.id,
      title: post.title,
      views: post.views || 0,
      created_at: post.created_at,
      tags: post.tags || [],
    }
  } catch (error) {
    // Silent error handling: Error fetching post details
    return null
  }
}

/**
 * Busca dados detalhados de uma pergunta específica do fórum
 */
export async function getForumQuestionDetails(
  questionId: string
): Promise<ForumEngagement | null> {
  try {
    const { data: question, error } = await supabase
      .from('forum_questions')
      .select(
        'id, title, views, answers_count, likes_count, created_at, is_answered'
      )
      .eq('id', questionId)
      .single()

    if (error) {
      // Silent error handling: Error fetching question details
      return null
    }

    return {
      id: question.id,
      title: question.title,
      answers_count: question.answers_count || 0,
      views: question.views || 0,
      likes_count: question.likes_count || 0,
      created_at: question.created_at,
      is_answered: question.is_answered || false,
    }
  } catch (error) {
    // Silent error handling: Error fetching question details
    return null
  }
}
