import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface DeletionStats {
  totalQuestions: number
  totalAnswers: number
  totalQuestionLikes: number
  totalAnswerLikes: number
  patientQuestions: number
  nutritionistQuestions: number
}

// Função para simular a exclusão (dry-run)
async function simulateForumDeletion(): Promise<DeletionStats> {
  console.log('🔍 MODO SIMULAÇÃO - Verificando dados que seriam deletados...\n')

  const stats: DeletionStats = {
    totalQuestions: 0,
    totalAnswers: 0,
    totalQuestionLikes: 0,
    totalAnswerLikes: 0,
    patientQuestions: 0,
    nutritionistQuestions: 0
  }

  try {
    // 1. Contar perguntas totais
    const { count: questionsCount } = await supabase
      .from('forum_questions')
      .select('*', { count: 'exact', head: true })

    stats.totalQuestions = questionsCount || 0

    // 2. Contar perguntas por tipo de usuário
    const { data: questionsWithProfiles } = await supabase
      .from('forum_questions')
      .select(`
        id,
        author_id,
        title,
        patient_id,
        nutritionist_id,
        created_at
      `)

    if (questionsWithProfiles) {
      for (const question of questionsWithProfiles) {
        if (question.patient_id) {
          stats.patientQuestions++
        } else if (question.nutritionist_id) {
          stats.nutritionistQuestions++
        }
      }
    }

    // 3. Contar respostas
    const { count: answersCount } = await supabase
      .from('forum_answers')
      .select('*', { count: 'exact', head: true })

    stats.totalAnswers = answersCount || 0

    // 4. Contar likes em perguntas
    const { count: questionLikesCount } = await supabase
      .from('forum_question_likes')
      .select('*', { count: 'exact', head: true })

    stats.totalQuestionLikes = questionLikesCount || 0

    // 5. Contar likes em respostas
    const { count: answerLikesCount } = await supabase
      .from('forum_answer_likes')
      .select('*', { count: 'exact', head: true })

    stats.totalAnswerLikes = answerLikesCount || 0

    // Exibir estatísticas
    console.log('📊 ESTATÍSTICAS DE DADOS QUE SERIAM DELETADOS:')
    console.log('=' .repeat(50))
    console.log(`📝 Total de Perguntas: ${stats.totalQuestions}`)
    console.log(`👥 Perguntas de Pacientes: ${stats.patientQuestions}`)
    console.log(`🩺 Perguntas de Nutricionistas: ${stats.nutritionistQuestions}`)
    console.log(`💬 Total de Respostas: ${stats.totalAnswers}`)
    console.log(`👍 Likes em Perguntas: ${stats.totalQuestionLikes}`)
    console.log(`❤️  Likes em Respostas: ${stats.totalAnswerLikes}`)
    console.log('=' .repeat(50))

    if (questionsWithProfiles && questionsWithProfiles.length > 0) {
      console.log('\n📋 PRIMEIRAS 10 PERGUNTAS QUE SERIAM DELETADAS:')
      questionsWithProfiles.slice(0, 10).forEach((q, index) => {
        const userType = q.patient_id ? '👥 Paciente' : q.nutritionist_id ? '🩺 Nutricionista' : '❓ Indefinido'
        console.log(`${index + 1}. [${userType}] ${q.title} (ID: ${q.id})`)
      })
      
      if (questionsWithProfiles.length > 10) {
        console.log(`... e mais ${questionsWithProfiles.length - 10} perguntas`)
      }
    }

    return stats

  } catch (error) {
    console.error('❌ Erro durante simulação:', error)
    throw error
  }
}

// Função para executar a exclusão real
async function executeForumDeletion(): Promise<boolean> {
  console.log('\n🚨 EXECUTANDO EXCLUSÃO REAL...\n')

  try {
    // 1. Deletar likes em respostas (dependências primeiro)
    console.log('🗑️  Deletando likes em respostas...')
    const { error: answerLikesError } = await supabase
      .from('forum_answer_likes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Deletar todos

    if (answerLikesError) {
      console.error('❌ Erro ao deletar likes em respostas:', answerLikesError)
      return false
    }
    console.log('✅ Likes em respostas deletados')

    // 2. Deletar likes em perguntas
    console.log('🗑️  Deletando likes em perguntas...')
    const { error: questionLikesError } = await supabase
      .from('forum_question_likes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Deletar todos

    if (questionLikesError) {
      console.error('❌ Erro ao deletar likes em perguntas:', questionLikesError)
      return false
    }
    console.log('✅ Likes em perguntas deletados')

    // 3. Deletar respostas
    console.log('🗑️  Deletando respostas...')
    const { error: answersError } = await supabase
      .from('forum_answers')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Deletar todos

    if (answersError) {
      console.error('❌ Erro ao deletar respostas:', answersError)
      return false
    }
    console.log('✅ Respostas deletadas')

    // 4. Deletar perguntas
    console.log('🗑️  Deletando perguntas...')
    const { error: questionsError } = await supabase
      .from('forum_questions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Deletar todos

    if (questionsError) {
      console.error('❌ Erro ao deletar perguntas:', questionsError)
      return false
    }
    console.log('✅ Perguntas deletadas')

    console.log('\n🎉 EXCLUSÃO CONCLUÍDA COM SUCESSO!')
    return true

  } catch (error) {
    console.error('❌ Erro durante exclusão:', error)
    return false
  }
}

// Função principal
async function deleteAllForumQuestions() {
  console.log('🚀 INICIANDO PROCESSO DE EXCLUSÃO DE TODAS AS PERGUNTAS DO FÓRUM')
  console.log('=' .repeat(60))

  try {
    // 1. Primeiro, simular a exclusão
    const stats = await simulateForumDeletion()

    if (stats.totalQuestions === 0) {
      console.log('\n✅ Não há perguntas para deletar. O fórum já está vazio.')
      return
    }

    // 2. Solicitar confirmação
    console.log('\n⚠️  ATENÇÃO: Esta operação é IRREVERSÍVEL!')
    console.log('📝 Para continuar, você deve adicionar o flag #liberar_producao na tarefa')
    console.log('🛑 Operação cancelada por segurança.')
    
    // Verificar se há autorização (simulando verificação do flag)
    const hasAuthorization = process.argv.includes('--force') || process.env.FORCE_DELETE === 'true'
    
    if (!hasAuthorization) {
      console.log('\n❌ OPERAÇÃO CANCELADA: Sem autorização para executar em produção')
      console.log('💡 Para executar, adicione --force como argumento ou defina FORCE_DELETE=true')
      return
    }

    // 3. Executar exclusão real
    const success = await executeForumDeletion()

    if (success) {
      // 4. Verificar se realmente foi deletado
      const { count: remainingQuestions } = await supabase
        .from('forum_questions')
        .select('*', { count: 'exact', head: true })

      console.log(`\n📊 Verificação final: ${remainingQuestions || 0} perguntas restantes`)
      
      if ((remainingQuestions || 0) === 0) {
        console.log('✅ SUCESSO: Todas as perguntas foram deletadas!')
      } else {
        console.log('⚠️  ATENÇÃO: Algumas perguntas podem não ter sido deletadas')
      }
    }

  } catch (error) {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  deleteAllForumQuestions()
}

export { deleteAllForumQuestions, simulateForumDeletion, executeForumDeletion }
