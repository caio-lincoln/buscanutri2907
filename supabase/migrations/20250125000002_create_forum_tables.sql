-- Criação das tabelas do fórum
-- Execute este script no SQL Editor do Supabase Dashboard

-- Tabela de perguntas do fórum
CREATE TABLE IF NOT EXISTS public.forum_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    views INTEGER DEFAULT 0,
    answers_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    is_answered BOOLEAN DEFAULT false,
    best_answer_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de respostas do fórum
CREATE TABLE IF NOT EXISTS public.forum_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES public.forum_questions(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    is_accepted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de likes em perguntas
CREATE TABLE IF NOT EXISTS public.forum_question_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES public.forum_questions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(question_id, user_id)
);

-- Tabela de likes em respostas
CREATE TABLE IF NOT EXISTS public.forum_answer_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    answer_id UUID NOT NULL REFERENCES public.forum_answers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(answer_id, user_id)
);

-- Adicionar foreign key para melhor resposta
ALTER TABLE public.forum_questions 
ADD CONSTRAINT fk_forum_questions_best_answer 
FOREIGN KEY (best_answer_id) REFERENCES public.forum_answers(id) ON DELETE SET NULL;

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_forum_questions_author_id ON public.forum_questions(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_questions_created_at ON public.forum_questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_questions_last_activity ON public.forum_questions(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_questions_tags ON public.forum_questions USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_forum_questions_views ON public.forum_questions(views DESC);
CREATE INDEX IF NOT EXISTS idx_forum_questions_likes ON public.forum_questions(likes_count DESC);

CREATE INDEX IF NOT EXISTS idx_forum_answers_question_id ON public.forum_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_forum_answers_author_id ON public.forum_answers(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_answers_created_at ON public.forum_answers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_answers_likes ON public.forum_answers(likes_count DESC);

CREATE INDEX IF NOT EXISTS idx_forum_question_likes_question_id ON public.forum_question_likes(question_id);
CREATE INDEX IF NOT EXISTS idx_forum_question_likes_user_id ON public.forum_question_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_forum_answer_likes_answer_id ON public.forum_answer_likes(answer_id);
CREATE INDEX IF NOT EXISTS idx_forum_answer_likes_user_id ON public.forum_answer_likes(user_id);

-- Habilitar RLS
ALTER TABLE public.forum_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_question_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_answer_likes ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para perguntas
CREATE POLICY "Perguntas são visíveis para todos" 
ON public.forum_questions FOR SELECT 
USING (true);

CREATE POLICY "Usuários autenticados podem criar perguntas" 
ON public.forum_questions FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Autores podem editar suas perguntas" 
ON public.forum_questions FOR UPDATE 
USING (auth.uid() = author_id);

CREATE POLICY "Autores podem deletar suas perguntas" 
ON public.forum_questions FOR DELETE 
USING (auth.uid() = author_id);

-- Políticas de segurança para respostas
CREATE POLICY "Respostas são visíveis para todos" 
ON public.forum_answers FOR SELECT 
USING (true);

CREATE POLICY "Usuários autenticados podem criar respostas" 
ON public.forum_answers FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Autores podem editar suas respostas" 
ON public.forum_answers FOR UPDATE 
USING (auth.uid() = author_id);

CREATE POLICY "Autores podem deletar suas respostas" 
ON public.forum_answers FOR DELETE 
USING (auth.uid() = author_id);

-- Políticas de segurança para likes em perguntas
CREATE POLICY "Likes em perguntas são visíveis para todos" 
ON public.forum_question_likes FOR SELECT 
USING (true);

CREATE POLICY "Usuários autenticados podem dar like em perguntas" 
ON public.forum_question_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover seus likes em perguntas" 
ON public.forum_question_likes FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas de segurança para likes em respostas
CREATE POLICY "Likes em respostas são visíveis para todos" 
ON public.forum_answer_likes FOR SELECT 
USING (true);

CREATE POLICY "Usuários autenticados podem dar like em respostas" 
ON public.forum_answer_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover seus likes em respostas" 
ON public.forum_answer_likes FOR DELETE 
USING (auth.uid() = user_id);

-- Função para atualizar contador de respostas
CREATE OR REPLACE FUNCTION update_forum_question_answers_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.forum_questions 
        SET answers_count = answers_count + 1,
            last_activity_at = NOW()
        WHERE id = NEW.question_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.forum_questions 
        SET answers_count = answers_count - 1,
            last_activity_at = NOW()
        WHERE id = OLD.question_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar contador de respostas
CREATE TRIGGER trigger_update_forum_question_answers_count
    AFTER INSERT OR DELETE ON public.forum_answers
    FOR EACH ROW EXECUTE FUNCTION update_forum_question_answers_count();

-- Função para atualizar contador de likes em perguntas
CREATE OR REPLACE FUNCTION update_forum_question_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.forum_questions 
        SET likes_count = likes_count + 1
        WHERE id = NEW.question_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.forum_questions 
        SET likes_count = likes_count - 1
        WHERE id = OLD.question_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar contador de likes em perguntas
CREATE TRIGGER trigger_update_forum_question_likes_count
    AFTER INSERT OR DELETE ON public.forum_question_likes
    FOR EACH ROW EXECUTE FUNCTION update_forum_question_likes_count();

-- Função para atualizar contador de likes em respostas
CREATE OR REPLACE FUNCTION update_forum_answer_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.forum_answers 
        SET likes_count = likes_count + 1
        WHERE id = NEW.answer_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.forum_answers 
        SET likes_count = likes_count - 1
        WHERE id = OLD.answer_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar contador de likes em respostas
CREATE TRIGGER trigger_update_forum_answer_likes_count
    AFTER INSERT OR DELETE ON public.forum_answer_likes
    FOR EACH ROW EXECUTE FUNCTION update_forum_answer_likes_count();

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER trigger_update_forum_questions_updated_at
    BEFORE UPDATE ON public.forum_questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_forum_answers_updated_at
    BEFORE UPDATE ON public.forum_answers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();