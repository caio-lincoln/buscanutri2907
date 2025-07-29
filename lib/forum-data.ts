import { v4 as uuidv4 } from "uuid"
import { getNutritionistBadges, type NutritionistBadge } from "./badge-service" // Importar o serviço de insígnias

export interface ForumAuthor {
  name: string
  userType: "paciente" | "nutricionista" | "empresa" | "admin"
  avatar?: string
  credentials?: string // Ex: CRN para nutricionistas
  isVerified?: boolean
  id: string // Adicionar ID do autor para buscar insígnias
  badges?: NutritionistBadge[] // Adicionar badges ao tipo
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
  replies: ForumReply[]
  isBestAnswerSelected: boolean
}

// Mock de dados do fórum
const forumQuestions: ForumQuestion[] = [
  {
    id: "q1",
    title: "Qual a melhor dieta para ganho de massa muscular?",
    content:
      "Sou praticante de musculação há 2 anos e busco otimizar meu ganho de massa muscular. Atualmente, sigo uma dieta rica em proteínas, mas sinto que posso melhorar. Quais são as melhores estratégias nutricionais para hipertrofia, considerando suplementos e horários de refeição?",
    author: {
      id: "paciente_1",
      name: "Carlos Eduardo",
      userType: "paciente",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    timestamp: "2023-10-26 10:30",
    likes: 15,
    repliesCount: 3,
    views: 250,
    tags: ["musculação", "hipertrofia", "suplementos"],
    replies: [
      {
        id: "r1-1",
        content:
          "Para ganho de massa, o superávit calórico é crucial, com foco em proteínas de alto valor biológico (1.6-2.2g/kg de peso). Carboidratos complexos são importantes para energia. Considere a creatina e whey protein. O timing das refeições é secundário à ingestão total diária.",
        author: {
          id: "4363a1ad-149b-4fcd-b725-dffa33109493",
          name: "Dra. Ana Paula",
          userType: "nutricionista",
          credentials: "CRN3 12345",
          isVerified: true,
          avatar: "/placeholder.svg?height=40&width=40",
        },
        timestamp: "2023-10-26 11:00",
        likes: 8,
        isBestAnswer: true,
      },
      {
        id: "r1-2",
        content:
          "Além do que a Dra. Ana Paula mencionou, não se esqueça da importância da hidratação e de um sono de qualidade. Eles são tão importantes quanto a dieta e o treino para a recuperação e crescimento muscular.",
        author: {
          id: "eef8ebce-68c3-4fc8-b1d6-f97f6f9d3cfd",
          name: "Dr. João Silva",
          userType: "nutricionista",
          credentials: "CRN3 67890",
          isVerified: true,
          avatar: "/placeholder.svg?height=40&width=40",
        },
        timestamp: "2023-10-26 11:15",
        likes: 5,
        isBestAnswer: false,
      },
    ],
    isBestAnswerSelected: true,
  },
  {
    id: "q2",
    title: "Como lidar com a compulsão alimentar noturna?",
    content:
      "Tenho muita dificuldade em controlar a vontade de comer doces e carboidratos à noite, mesmo depois de jantar. Isso tem me atrapalhado a manter uma dieta equilibrada. Alguma dica para gerenciar a compulsão alimentar noturna?",
    author: {
      id: "paciente_2",
      name: "Juliana Costa",
      userType: "paciente",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    timestamp: "2023-10-25 18:00",
    likes: 20,
    repliesCount: 2,
    views: 300,
    tags: ["compulsão", "saúde mental", "hábitos"],
    replies: [
      {
        id: "r2-1",
        content:
          "A compulsão noturna pode estar ligada a restrições durante o dia ou estresse. Tente incluir mais fibras e proteínas nas refeições principais para aumentar a saciedade. Praticar mindfulness e ter uma rotina relaxante antes de dormir também ajuda.",
        author: {
          id: "881d4a33-4cb0-4683-9534-2bdbc81e35ef",
          name: "Dra. Carla Mendes",
          userType: "nutricionista",
          credentials: "CRN3 11223",
          isVerified: true,
          avatar: "/placeholder.svg?height=40&width=40",
        },
        timestamp: "2023-10-25 19:30",
        likes: 10,
        isBestAnswer: false,
      },
    ],
    isBestAnswerSelected: false,
  },
  {
    id: "q3",
    title: "Alimentos que ajudam a melhorar a qualidade do sono",
    content:
      "Tenho tido problemas para dormir ultimamente e ouvi dizer que a alimentação pode influenciar. Quais alimentos são recomendados para promover um sono mais reparador?",
    author: {
      id: "paciente_3",
      name: "Fernanda Lima",
      userType: "paciente",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    timestamp: "2023-10-24 09:00",
    likes: 8,
    repliesCount: 1,
    views: 180,
    tags: ["sono", "insônia", "bem-estar"],
    replies: [],
    isBestAnswerSelected: false,
  },
]

// Função auxiliar para adicionar insígnias aos autores
const addBadgesToAuthor = async (author: ForumAuthor): Promise<ForumAuthor> => {
  if (author.userType === "nutricionista") {
    const badges = await getNutritionistBadges(author.id)
    return { ...author, badges: badges.map((nb) => nb.badge) } // Retorna apenas os objetos de insígnia
  }
  return author
}

// Função para buscar todas as perguntas do fórum, incluindo insígnias dos autores
export async function getAllForumQuestions(): Promise<ForumQuestion[]> {
  const questionsWithBadges = await Promise.all(
    forumQuestions.map(async (q) => {
      const authorWithBadges = await addBadgesToAuthor(q.author)
      const repliesWithBadges = await Promise.all(
        q.replies.map(async (r) => ({
          ...r,
          author: await addBadgesToAuthor(r.author),
        })),
      )
      return { ...q, author: authorWithBadges, replies: repliesWithBadges }
    }),
  )
  return questionsWithBadges.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// Função para buscar uma pergunta por ID, incluindo insígnias dos autores
export async function getForumQuestionById(id: string): Promise<ForumQuestion | null> {
  const question = forumQuestions.find((q) => q.id === id)
  if (question) {
    const authorWithBadges = await addBadgesToAuthor(question.author)
    const repliesWithBadges = await Promise.all(
      question.replies.map(async (r) => ({
        ...r,
        author: await addBadgesToAuthor(r.author),
      })),
    )
    return { ...question, author: authorWithBadges, replies: repliesWithBadges }
  }
  return null
}

// Função para adicionar uma nova pergunta
export function addForumQuestion(
  newQuestionData: Omit<
    ForumQuestion,
    "id" | "timestamp" | "likes" | "repliesCount" | "views" | "replies" | "isBestAnswerSelected"
  >,
): ForumQuestion {
  const newQuestion: ForumQuestion = {
    id: uuidv4(),
    timestamp: new Date().toLocaleString("pt-BR"),
    likes: 0,
    repliesCount: 0,
    views: 0,
    replies: [],
    isBestAnswerSelected: false,
    ...newQuestionData,
  }
  forumQuestions.unshift(newQuestion) // Adiciona no início para aparecer como mais recente
  return newQuestion
}

// Função para adicionar uma resposta a uma pergunta
export function addForumReply(
  questionId: string,
  newReplyData: Omit<ForumReply, "id" | "timestamp" | "likes" | "isBestAnswer">,
): ForumReply | null {
  const question = forumQuestions.find((q) => q.id === questionId)
  if (question) {
    const newReply: ForumReply = {
      id: uuidv4(),
      timestamp: new Date().toLocaleString("pt-BR"),
      likes: 0,
      isBestAnswer: false,
      ...newReplyData,
    }
    question.replies.push(newReply)
    question.repliesCount += 1
    return newReply
  }
  return null
}

// Função para curtir uma pergunta ou resposta
export function likeForumItem(itemId: string, type: "question" | "reply"): boolean {
  if (type === "question") {
    const question = forumQuestions.find((q) => q.id === itemId)
    if (question) {
      question.likes += 1
      return true
    }
  } else if (type === "reply") {
    for (const question of forumQuestions) {
      const reply = question.replies.find((r) => r.id === itemId)
      if (reply) {
        reply.likes += 1
        return true
      }
    }
  }
  return false
}

// Função para selecionar a melhor resposta
export function selectBestAnswer(questionId: string, replyId: string): boolean {
  const question = forumQuestions.find((q) => q.id === questionId)
  if (question) {
    question.replies.forEach((reply) => {
      reply.isBestAnswer = reply.id === replyId
    })
    question.isBestAnswerSelected = true
    return true
  }
  return false
}

// Função para incrementar visualizações de uma pergunta
export function incrementQuestionViews(questionId: string): boolean {
  const question = forumQuestions.find((q) => q.id === questionId)
  if (question) {
    question.views += 1
    return true
  }
  return false
}
