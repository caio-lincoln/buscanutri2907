-- Criação das tabelas de badges
-- Execute este script no SQL Editor do Supabase Dashboard

-- Tabela de badges (insígnias)
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon_url TEXT,
    criteria TEXT,
    points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de badges dos nutricionistas
CREATE TABLE IF NOT EXISTS public.nutritionist_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nutritionist_id UUID NOT NULL REFERENCES public.nutritionist_profiles(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    awarded_by UUID REFERENCES auth.users(id),
    notes TEXT,
    UNIQUE(nutritionist_id, badge_id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_nutritionist_badges_nutritionist_id ON public.nutritionist_badges(nutritionist_id);
CREATE INDEX IF NOT EXISTS idx_nutritionist_badges_badge_id ON public.nutritionist_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_badges_active ON public.badges(is_active);

-- RLS (Row Level Security)
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutritionist_badges ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para badges
CREATE POLICY "Badges são visíveis para todos" ON public.badges
    FOR SELECT USING (true);

CREATE POLICY "Apenas admins podem gerenciar badges" ON public.badges
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas de segurança para nutritionist_badges
CREATE POLICY "Badges de nutricionistas são visíveis para todos" ON public.nutritionist_badges
    FOR SELECT USING (true);

CREATE POLICY "Apenas admins podem atribuir badges" ON public.nutritionist_badges
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Apenas admins podem remover badges" ON public.nutritionist_badges
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Inserir badges padrão
INSERT INTO public.badges (name, description, icon_url, criteria, points) VALUES
('Nutricionista Verificado', 'Profissional com documentação verificada', null, 'Documentos CRN verificados', 10),
('Especialista em Emagrecimento', 'Especialização comprovada em emagrecimento', null, 'Certificação em emagrecimento', 25),
('Especialista em Esportes', 'Especialização em nutrição esportiva', null, 'Certificação em nutrição esportiva', 25),
('Top Avaliado', 'Nutricionista com excelentes avaliações', null, 'Média de avaliação acima de 4.5', 30),
('Experiência 5+ Anos', 'Mais de 5 anos de experiência', null, 'Comprovação de 5+ anos de atuação', 20),
('Consultas Online', 'Oferece consultas online', null, 'Configuração de consultas online ativa', 15),
('Resposta Rápida', 'Responde rapidamente às mensagens', null, 'Tempo médio de resposta < 2 horas', 15),
('Planos Personalizados', 'Cria planos alimentares personalizados', null, 'Oferece serviço de planos personalizados', 20)
ON CONFLICT (name) DO NOTHING;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at na tabela badges
CREATE TRIGGER update_badges_updated_at BEFORE UPDATE ON public.badges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários nas tabelas
COMMENT ON TABLE public.badges IS 'Tabela de insígnias/badges disponíveis';
COMMENT ON TABLE public.nutritionist_badges IS 'Tabela de relacionamento entre nutricionistas e suas insígnias';
COMMENT ON COLUMN public.badges.criteria IS 'Critérios para obtenção da insígnia';
COMMENT ON COLUMN public.badges.points IS 'Pontos atribuídos pela insígnia';
COMMENT ON COLUMN public.nutritionist_badges.awarded_by IS 'Usuário que atribuiu a insígnia';
COMMENT ON COLUMN public.nutritionist_badges.notes IS 'Observações sobre a atribuição da insígnia';