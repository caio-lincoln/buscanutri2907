import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function seedRealForumData() {
  console.log('🌱 Iniciando seed de dados reais do fórum...')

  // Perguntas reais com IDs de usuários existentes
  const questions = [
    {
      id: '7d28cc92-0694-419d-b9e1-0c04e840515c',
      title: 'Como calcular meu gasto calórico diário?',
      content:
        'Gostaria de saber como posso calcular corretamente meu gasto calórico diário para ajustar minha dieta. Tenho 25 anos, peso 70kg e faço exercícios 3x por semana.',
      category: 'Nutrição Esportiva',
      tags: ['calorias', 'exercicio', 'dieta'],
      author_id: '2d424c6f-ff36-41d5-b65f-62b284d1ceb4', // Ebert Ryan (paciente)
      views: 45,
      likes_count: 8,
      answers_count: 3,
      created_at: new Date('2024-01-15T10:30:00Z').toISOString(),
      updated_at: new Date('2024-01-15T10:30:00Z').toISOString(),
      last_activity_at: new Date('2024-01-16T14:20:00Z').toISOString(),
    },
    {
      id: 'ab53f2fc-e5a4-4817-9ba8-ad731242764a',
      title: 'Suplementos de vitamina D são necessários?',
      content:
        'Moro em uma região com pouco sol e trabalho em escritório. Meu médico sugeriu suplementação de vitamina D. Gostaria da opinião de nutricionistas sobre isso.',
      category: 'Suplementação',
      tags: ['vitamina-d', 'suplementos', 'saude'],
      author_id: '48a9289b-5af6-4358-b3a3-04a94c0bd37c', // Caio Lincoln (paciente)
      views: 67,
      likes_count: 12,
      answers_count: 2,
      created_at: new Date('2024-01-14T09:15:00Z').toISOString(),
      updated_at: new Date('2024-01-14T09:15:00Z').toISOString(),
      last_activity_at: new Date('2024-01-15T16:45:00Z').toISOString(),
    },
    {
      id: '887e9f96-909a-4175-9024-c17034d07dd2',
      title: 'Posso substituir o arroz branco por quinoa?',
      content:
        'Estou tentando melhorar minha alimentação e ouvi falar que a quinoa é mais nutritiva que o arroz branco. É uma boa substituição? Como preparar?',
      category: 'Alimentação Saudável',
      tags: ['quinoa', 'arroz', 'carboidratos', 'substituicao'],
      author_id: '09ba42b7-16f1-4eb8-8f76-168f56ecd9df', // Joao Miguel (paciente)
      views: 89,
      likes_count: 15,
      answers_count: 4,
      created_at: new Date('2024-01-13T14:22:00Z').toISOString(),
      updated_at: new Date('2024-01-13T14:22:00Z').toISOString(),
      last_activity_at: new Date('2024-01-14T11:30:00Z').toISOString(),
    },
    {
      id: 'c4f8e2a1-9b3d-4e5f-8c7a-1d2e3f4a5b6c',
      title: 'Dieta para ganho de massa muscular',
      content:
        'Comecei na academia há 2 meses e quero ganhar massa muscular. Qual seria uma dieta adequada? Preciso de suplementos?',
      category: 'Nutrição Esportiva',
      tags: ['massa-muscular', 'academia', 'proteina', 'suplementos'],
      author_id: '7313460d-90e5-445b-ab6e-0ac6ce14b017', // Charlesson (paciente)
      views: 123,
      likes_count: 22,
      answers_count: 5,
      created_at: new Date('2024-01-12T16:45:00Z').toISOString(),
      updated_at: new Date('2024-01-12T16:45:00Z').toISOString(),
      last_activity_at: new Date('2024-01-13T09:15:00Z').toISOString(),
    },
    {
      id: 'f7e6d5c4-b3a2-9180-7f6e-5d4c3b2a1098',
      title: 'Alimentação durante a gravidez',
      content:
        'Estou grávida de 3 meses e gostaria de orientações sobre alimentação. Quais alimentos devo evitar e quais são essenciais?',
      category: 'Nutrição Materno-Infantil',
      tags: ['gravidez', 'gestacao', 'alimentacao', 'saude-materna'],
      author_id: '66cc541d-7ffb-4f61-960c-47144b669379', // Lazaro (paciente)
      views: 156,
      likes_count: 28,
      answers_count: 6,
      created_at: new Date('2024-01-11T11:20:00Z').toISOString(),
      updated_at: new Date('2024-01-11T11:20:00Z').toISOString(),
      last_activity_at: new Date('2024-01-12T15:30:00Z').toISOString(),
    },
  ]

  // Respostas reais
  const answers = [
    {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      question_id: '7d28cc92-0694-419d-b9e1-0c04e840515c',
      content:
        'Para calcular seu gasto calórico diário, você pode usar a fórmula de Harris-Benedict. Para homens: TMB = 88,362 + (13,397 × peso) + (4,799 × altura) - (5,677 × idade). Depois multiplique pela atividade física (1,375 para exercícios 3x/semana).',
      author_id: '0cd50cf6-4d3e-4dce-9d47-c8a70b4e514e', // Ryan Ebert (nutricionista)
      likes_count: 5,
      is_best_answer: true,
      created_at: new Date('2024-01-15T12:15:00Z').toISOString(),
      updated_at: new Date('2024-01-15T12:15:00Z').toISOString(),
    },
    {
      id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
      question_id: '7d28cc92-0694-419d-b9e1-0c04e840515c',
      content:
        'Complementando a resposta anterior, recomendo usar aplicativos como MyFitnessPal que fazem esse cálculo automaticamente. Também é importante ajustar conforme seus resultados.',
      author_id: '0c1da52d-fd57-4ee2-8e3d-ce8ce5205295', // Caio Lincoln (nutricionista)
      likes_count: 3,
      is_best_answer: false,
      created_at: new Date('2024-01-16T14:20:00Z').toISOString(),
      updated_at: new Date('2024-01-16T14:20:00Z').toISOString(),
    },
    {
      id: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
      question_id: 'ab53f2fc-e5a4-4817-9ba8-ad731242764a',
      content:
        'A suplementação de vitamina D é realmente importante, especialmente em regiões com pouco sol. Recomendo fazer um exame de sangue primeiro para verificar seus níveis atuais. A dose usual é de 1000-2000 UI por dia.',
      author_id: '9c8287c7-490c-433c-97f8-dc9f17ac863d', // Iris Patricia (nutricionista)
      likes_count: 8,
      is_best_answer: true,
      created_at: new Date('2024-01-15T16:45:00Z').toISOString(),
      updated_at: new Date('2024-01-15T16:45:00Z').toISOString(),
    },
    {
      id: 'e4ed1468-1b84-4b88-a20f-a5b33f71561c',
      question_id: '887e9f96-909a-4175-9024-c17034d07dd2',
      content:
        'A quinoa é excelente! Tem proteína completa, fibras e minerais. Para preparar: lave bem antes de cozinhar (1 xícara de quinoa para 2 de água), cozinhe por 15 minutos. Pode usar no lugar do arroz em qualquer receita.',
      author_id: '9e082d35-3951-453d-91b7-8b99fe7081fe', // Maria Hortência (nutricionista)
      likes_count: 12,
      is_best_answer: true,
      created_at: new Date('2024-01-14T11:30:00Z').toISOString(),
      updated_at: new Date('2024-01-14T11:30:00Z').toISOString(),
    },
    {
      id: '7ce2091b-732d-4cb2-a54a-b2e1fb29260a',
      question_id: 'c4f8e2a1-9b3d-4e5f-8c7a-1d2e3f4a5b6c',
      content:
        'Para ganho de massa muscular, foque em: 1,6-2,2g de proteína por kg de peso corporal, carboidratos complexos pré e pós-treino, gorduras boas. Whey protein pode ajudar, mas não é obrigatório se você conseguir proteína suficiente na dieta.',
      author_id: 'd3849528-39dc-4bc4-9b71-5017cfa4237b', // Fernanda Almeida (nutricionista)
      likes_count: 18,
      is_best_answer: true,
      created_at: new Date('2024-01-13T09:15:00Z').toISOString(),
      updated_at: new Date('2024-01-13T09:15:00Z').toISOString(),
    },
    {
      id: '05305749-674a-422d-a9ee-a96271a5ecdf',
      question_id: 'f7e6d5c4-b3a2-9180-7f6e-5d4c3b2a1098',
      content:
        'Durante a gravidez é essencial: ácido fólico, ferro, cálcio, ômega-3. Evite: álcool, peixes com mercúrio, carnes cruas, queijos não pasteurizados. Inclua: folhas verdes, frutas, proteínas magras, laticínios pasteurizados.',
      author_id: '329e5a91-d094-454a-b6b2-7280d2f3d531', // Danielle Verissimo (nutricionista)
      likes_count: 25,
      is_best_answer: true,
      created_at: new Date('2024-01-12T15:30:00Z').toISOString(),
      updated_at: new Date('2024-01-12T15:30:00Z').toISOString(),
    },
  ]

  try {
    // Inserir perguntas
    console.log('📝 Inserindo perguntas...')
    for (const question of questions) {
      const { data, error } = await supabase
        .from('forum_questions')
        .upsert(question)
        .select()

      if (error) {
        console.error(`Erro ao inserir pergunta "${question.title}":`, error)
      } else {
        console.log(`✅ Pergunta "${question.title}" inserida`)
      }
    }

    // Inserir respostas
    console.log('\n💬 Inserindo respostas...')
    for (const answer of answers) {
      const { data, error } = await supabase
        .from('forum_answers')
        .upsert(answer)
        .select()

      if (error) {
        console.error('Erro ao inserir resposta:', error)
      } else {
        console.log('✅ Resposta inserida')
      }
    }

    // Atualizar best_answer_id nas perguntas
    console.log('\n🏆 Atualizando melhores respostas...')
    const bestAnswers = [
      {
        questionId: '7d28cc92-0694-419d-b9e1-0c04e840515c',
        answerId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      },
      {
        questionId: 'ab53f2fc-e5a4-4817-9ba8-ad731242764a',
        answerId: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
      },
      {
        questionId: '887e9f96-909a-4175-9024-c17034d07dd2',
        answerId: 'e4ed1468-1b84-4b88-a20f-a5b33f71561c',
      },
      {
        questionId: 'c4f8e2a1-9b3d-4e5f-8c7a-1d2e3f4a5b6c',
        answerId: '7ce2091b-732d-4cb2-a54a-b2e1fb29260a',
      },
      {
        questionId: 'f7e6d5c4-b3a2-9180-7f6e-5d4c3b2a1098',
        answerId: '05305749-674a-422d-a9ee-a96271a5ecdf',
      },
    ]

    for (const { questionId, answerId } of bestAnswers) {
      const { error } = await supabase
        .from('forum_questions')
        .update({ best_answer_id: answerId })
        .eq('id', questionId)

      if (error) {
        console.error('Erro ao atualizar melhor resposta:', error)
      } else {
        console.log('✅ Melhor resposta atualizada')
      }
    }

    console.log('\n🎉 Seed de dados reais do fórum concluído com sucesso!')
  } catch (error) {
    console.error('❌ Erro durante o seed:', error)
  }
}

seedRealForumData()
