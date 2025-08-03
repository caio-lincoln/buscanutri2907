-- =====================================================
-- MIGRAÇÃO PARA CORREÇÕES DO FÓRUM
-- Data: 2025-01-25
-- Descrição: Correções identificadas via MCP Supabase
-- =====================================================

-- PROBLEMA 1: RLS não habilitado na tabela forum_question_likes
-- SOLUÇÃO: Habilitar RLS
ALTER TABLE public.forum_question_likes ENABLE ROW LEVEL SECURITY;

-- PROBLEMA 2: Índices faltantes para chaves estrangeiras (performance)
-- SOLUÇÃO: Criar índices para melhorar performance

-- Índice para forum_question_likes.user_id (mencionado no advisor)
CREATE INDEX IF NOT EXISTS idx_forum_question_likes_user_id 
ON public.forum_question_likes(user_id);

-- Índice para forum_questions.author_id (mencionado no advisor)
CREATE INDEX IF NOT EXISTS idx_forum_questions_author_id 
ON public.forum_questions(author_id);

-- PROBLEMA 3: Funções de contadores ausentes
-- SOLUÇÃO: Criar funções para atualizar contadores automaticamente

-- Função para atualizar contador de respostas
CREATE OR REPLACE FUNCTION update_forum_question_answers_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE forum_questions 
        SET answers_count = answers_count + 1,
            last_activity_at = NOW()
        WHERE id = NEW.question_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE forum_questions 
        SET answers_count = GREATEST(answers_count - 1, 0),
            last_activity_at = NOW()
        WHERE id = OLD.question_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar contador de likes em perguntas
CREATE OR REPLACE FUNCTION update_forum_question_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE forum_questions 
        SET likes_count = likes_count + 1
        WHERE id = NEW.question_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE forum_questions 
        SET likes_count = GREATEST(likes_count - 1, 0)
        WHERE id = OLD.question_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar contador de likes em respostas
CREATE OR REPLACE FUNCTION update_forum_answer_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE forum_answers 
        SET likes_count = likes_count + 1
        WHERE id = NEW.answer_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE forum_answers 
        SET likes_count = GREATEST(likes_count - 1, 0)
        WHERE id = OLD.answer_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROBLEMA 4: Triggers ausentes
-- SOLUÇÃO: Criar triggers para atualizar contadores automaticamente

-- Trigger para atualizar contador de respostas
DROP TRIGGER IF EXISTS trigger_update_forum_question_answers_count ON forum_answers;
CREATE TRIGGER trigger_update_forum_question_answers_count
    AFTER INSERT OR DELETE ON forum_answers
    FOR EACH ROW EXECUTE FUNCTION update_forum_question_answers_count();

-- Trigger para atualizar contador de likes em perguntas
DROP TRIGGER IF EXISTS trigger_update_forum_question_likes_count ON forum_question_likes;
CREATE TRIGGER trigger_update_forum_question_likes_count
    AFTER INSERT OR DELETE ON forum_question_likes
    FOR EACH ROW EXECUTE FUNCTION update_forum_question_likes_count();

-- Trigger para atualizar contador de likes em respostas
DROP TRIGGER IF EXISTS trigger_update_forum_answer_likes_count ON forum_answer_likes;
CREATE TRIGGER trigger_update_forum_answer_likes_count
    AFTER INSERT OR DELETE ON forum_answer_likes
    FOR EACH ROW EXECUTE FUNCTION update_forum_answer_likes_count();

-- PROBLEMA 5: Contadores podem estar desatualizados
-- SOLUÇÃO: Recalcular contadores baseado nos dados reais

-- Corrigir contador de respostas
UPDATE forum_questions 
SET answers_count = (
    SELECT COUNT(*) 
    FROM forum_answers 
    WHERE forum_answers.question_id = forum_questions.id
);

-- Corrigir contador de likes em perguntas
UPDATE forum_questions 
SET likes_count = (
    SELECT COUNT(*) 
    FROM forum_question_likes 
    WHERE forum_question_likes.question_id = forum_questions.id
);

-- Corrigir contador de likes em respostas
UPDATE forum_answers 
SET likes_count = (
    SELECT COUNT(*) 
    FROM forum_answer_likes 
    WHERE forum_answer_likes.answer_id = forum_answers.id
);

-- =====================================================
-- ESTADO ATUAL DOS DADOS (para referência):
-- - forum_questions: 7 registros, todos com author_id preenchido
-- - forum_answers: 6 registros, todos com nutritionist_id preenchido  
-- - forum_question_likes: 0 registros
-- - forum_answer_likes: 0 registros
-- - 3 perguntas têm respostas (média: 0.86 respostas por pergunta)
-- - 6 respostas têm likes (média: 2 likes por resposta)
-- =====================================================

-- PROBLEMAS IDENTIFICADOS PELO ADVISOR DE SEGURANÇA:
-- 1. ✅ RLS desabilitado em forum_question_likes (será corrigido)
-- 2. ⚠️  Múltiplas funções com search_path mutável (requer revisão)
-- 3. ⚠️  Política RLS insegura em user_roles (requer revisão)
-- 4. ⚠️  Proteção contra senhas vazadas desabilitada (configuração Auth)

-- PROBLEMAS IDENTIFICADOS PELO ADVISOR DE PERFORMANCE:
-- 1. ✅ Chaves estrangeiras sem índices (será corrigido)
-- 2. ⚠️  Políticas RLS com auth.<function>() não otimizadas (requer revisão)
-- =====================================================