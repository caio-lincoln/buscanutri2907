import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Carregar variáveis de ambiente do .env.local
config({ path: '.env.local' })

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Chave de serviço para bypass do RLS

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedForumData() {
  try {
    console.log('🌱 Iniciando seed do fórum...')

    // Usar IDs de usuários existentes
    const userIds = {
      patient1: '9e082d35-3951-453d-91b7-8b99fe7081fe', // maria.hortencia@teste.com
      nutritionist1: '296ed103-ef5a-4151-8745-7225a07afd1e', // Heloisa Lima Bitencourt
      patient2: '0c1da52d-fd57-4ee2-8e3d-ce8ce5205295', // lincoln.santos@teste.com
    }

    // Atualizar perfis de usuário com dados de exemplo
    const users = [
      {
        user_id: userIds.patient1,
        full_name: 'Maria Hortência',
        user_type: 'patient',
        profile_image_url: '/placeholder.svg?height=40&width=40',
      },
      {
        user_id: userIds.nutritionist1,
        full_name: 'Dr. João Santos',
        user_type: 'nutritionist',
        profile_image_url: '/placeholder.svg?height=40&width=40',
        crn: '12345',
        is_verified: true,
      },
      {
        user_id: userIds.patient2,
        full_name: 'Lincoln Santos',
        user_type: 'patient',
        profile_image_url: '/placeholder.svg?height=40&width=40',
      },
    ]

    // Inserir perfis de usuário
    for (const user of users) {
      const { error } = await supabase.from('user_profiles').upsert(user)

      if (error) {
        console.error('Erro ao inserir usuário:', error)
      } else {
        console.log(`✅ Usuário ${user.full_name} inserido`)
      }
    }

    // Criar perguntas do fórum
    const questions = [
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        patient_id: userIds.patient1,
        author_id: userIds.patient1,
        title: 'Como calcular as calorias diárias necessárias?',
        content:
          'Gostaria de saber qual é a melhor forma de calcular quantas calorias devo consumir por dia para manter meu peso atual. Tenho 25 anos, peso 65kg e pratico exercícios 3 vezes por semana.',
        tags: ['Emagrecimento', 'Nutrição Clínica'],
        views: 45,
        answers_count: 3,
        likes_count: 8,
        is_answered: true,
        created_at: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000
        ).toISOString(), // 2 dias atrás
        last_activity_at: new Date(
          Date.now() - 1 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        patient_id: userIds.patient2,
        author_id: userIds.patient2,
        title: 'Suplementação de vitamina D é necessária?',
        content:
          'Meu médico recomendou suplementação de vitamina D, mas gostaria de saber se posso obter essa vitamina apenas através da alimentação e exposição solar.',
        tags: ['Suplementação', 'Nutrição Clínica'],
        views: 32,
        answers_count: 2,
        likes_count: 5,
        is_answered: false,
        created_at: new Date(
          Date.now() - 1 * 24 * 60 * 60 * 1000
        ).toISOString(), // 1 dia atrás
        last_activity_at: new Date(
          Date.now() - 12 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        patient_id: userIds.patient1,
        author_id: userIds.patient1,
        title: 'Dieta vegetariana para ganho de massa muscular',
        content:
          'Sou vegetariana há 2 anos e comecei a treinar musculação. Quais são as melhores fontes de proteína vegetal para ganho de massa muscular?',
        tags: ['Vegetarianismo', 'Ganho de Massa', 'Nutrição Esportiva'],
        views: 67,
        answers_count: 4,
        likes_count: 12,
        is_answered: true,
        created_at: new Date(
          Date.now() - 3 * 24 * 60 * 60 * 1000
        ).toISOString(), // 3 dias atrás
        last_activity_at: new Date(
          Date.now() - 6 * 60 * 60 * 1000
        ).toISOString(),
      },
    ]

    // Inserir perguntas
    for (const question of questions) {
      const { error } = await supabase.from('forum_questions').upsert(question)

      if (error) {
        console.error('Erro ao inserir pergunta:', error)
      } else {
        console.log(`✅ Pergunta "${question.title}" inserida`)
      }
    }

    // Criar respostas
    const answers = [
      {
        id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        question_id: '7d28cc92-0694-419d-b9e1-0c04e840515c', // Como calcular meu gasto calórico diário?
        nutritionist_id: 'ef005068-f71e-44f5-8f94-0d6c065e85be', // Heloisa Lima Bitencourt
        author_id: '296ed103-ef5a-4151-8745-7225a07afd1e',
        content:
          'Para calcular suas necessidades calóricas, você pode usar a fórmula de Harris-Benedict ou Mifflin-St Jeor. Com base nos seus dados (25 anos, 65kg, exercícios 3x/semana), sua necessidade seria aproximadamente 1800-2000 calorias por dia. Recomendo consultar um nutricionista para um cálculo mais preciso.',
        likes_count: 5,
        is_best_answer: true,
        created_at: new Date(
          Date.now() - 1.5 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        question_id: '7d28cc92-0694-419d-b9e1-0c04e840515c', // Como calcular meu gasto calórico diário?
        nutritionist_id: 'e8720abe-f39b-4043-a386-fda6bb7b4a63', // Márcio Luis Gonçalves Olivera
        author_id: '489e3567-8388-45db-8acd-c87d2ea82460',
        content:
          'Eu uso aplicativos como MyFitnessPal que fazem esse cálculo automaticamente. É bem prático!',
        likes_count: 2,
        is_best_answer: false,
        created_at: new Date(
          Date.now() - 1 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
        question_id: 'ab53f2fc-e5a4-4817-9ba8-ad731242764a', // Suplementos de vitamina D são necessários?
        nutritionist_id: 'ef005068-f71e-44f5-8f94-0d6c065e85be', // Heloisa Lima Bitencourt
        author_id: '296ed103-ef5a-4151-8745-7225a07afd1e',
        content:
          'A vitamina D pode ser obtida através da exposição solar (15-20 minutos diários) e alimentos como peixes gordurosos, ovos e cogumelos. Porém, em muitos casos a suplementação é necessária, especialmente no inverno. Siga a orientação do seu médico.',
        likes_count: 3,
        is_best_answer: false,
        created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '12345678-1234-1234-1234-123456789abc',
        question_id: '887e9f96-909a-4175-9024-c17034d07dd2', // Posso substituir o arroz branco por quinoa?
        nutritionist_id: 'ef005068-f71e-44f5-8f94-0d6c065e85be', // Heloisa Lima Bitencourt
        author_id: '296ed103-ef5a-4151-8745-7225a07afd1e',
        content:
          'Excelentes fontes de proteína vegetal incluem: leguminosas (feijão, lentilha, grão-de-bico), quinoa, tofu, tempeh, sementes de hemp, spirulina e proteína de ervilha. Combine diferentes fontes para obter todos os aminoácidos essenciais.',
        likes_count: 8,
        is_best_answer: true,
        created_at: new Date(
          Date.now() - 2.5 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
    ]

    // Inserir respostas
    for (const answer of answers) {
      const { error } = await supabase.from('forum_answers').upsert(answer)

      if (error) {
        console.error('Erro ao inserir resposta:', error)
      } else {
        console.log(`✅ Resposta inserida`)
      }
    }

    // Atualizar best_answer_id nas perguntas
    await supabase
      .from('forum_questions')
      .update({ best_answer_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd' })
      .eq('id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')

    await supabase
      .from('forum_questions')
      .update({ best_answer_id: '12345678-1234-1234-1234-123456789abc' })
      .eq('id', 'cccccccc-cccc-cccc-cccc-cccccccccccc')

    console.log('🎉 Seed do fórum concluído com sucesso!')
  } catch (error) {
    console.error('❌ Erro durante o seed:', error)
  }
}

// Executar o seed
seedForumData()
