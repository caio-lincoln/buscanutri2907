-- Migration: Insert sample blog data
-- This migration inserts realistic sample data for blog posts and related tables

-- First, let's get some nutritionist IDs to use as authors
-- We'll use a DO block to insert posts with real nutritionist authors

DO $$
DECLARE
    nutritionist_ids UUID[];
    current_nutritionist_id UUID;
    post_id UUID;
    comment_id UUID;
    i INTEGER;
BEGIN
    -- Get existing nutritionist IDs
    SELECT ARRAY(SELECT user_id FROM public.nutritionist_profiles LIMIT 5) INTO nutritionist_ids;
    
    -- If no nutritionists exist, create some sample ones
    IF array_length(nutritionist_ids, 1) IS NULL THEN
        -- Insert sample users first
        INSERT INTO auth.users (id, email, created_at, updated_at) VALUES
        ('11111111-1111-1111-1111-111111111111', 'dra.ana@example.com', NOW(), NOW()),
        ('22222222-2222-2222-2222-222222222222', 'dr.carlos@example.com', NOW(), NOW()),
        ('33333333-3333-3333-3333-333333333333', 'dra.maria@example.com', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
        
        -- Insert sample nutritionist profiles
        INSERT INTO public.nutritionist_profiles (user_id, full_name, crn, bio, created_at, updated_at) VALUES
        ('11111111-1111-1111-1111-111111111111', 'Dra. Ana Silva', 'CRN-1 12345', 'Especialista em nutrição clínica e emagrecimento', NOW(), NOW()),
        ('22222222-2222-2222-2222-222222222222', 'Dr. Carlos Santos', 'CRN-2 67890', 'Nutricionista esportivo e suplementação', NOW(), NOW()),
        ('33333333-3333-3333-3333-333333333333', 'Dra. Maria Oliveira', 'CRN-3 54321', 'Especialista em nutrição infantil e vegetarianismo', NOW(), NOW())
        ON CONFLICT (user_id) DO NOTHING;
        
        nutritionist_ids := ARRAY['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333'];
    END IF;
    
    -- Insert sample blog posts
    FOR i IN 1..15 LOOP
        current_nutritionist_id := nutritionist_ids[((i - 1) % array_length(nutritionist_ids, 1)) + 1];
        
        CASE i
            WHEN 1 THEN
                INSERT INTO public.blog_posts (
                    id, author_id, title, content, excerpt, category, tags, status, 
                    published_at, views, likes_count, comments_count, shares_count
                ) VALUES (
                    gen_random_uuid(), current_nutritionist_id,
                    '10 Alimentos que Aceleram o Metabolismo',
                    '<h2>Acelere seu metabolismo naturalmente</h2><p>O metabolismo é o processo pelo qual nosso corpo converte alimentos em energia. Alguns alimentos podem ajudar a acelerar esse processo naturalmente.</p><h3>1. Pimenta Vermelha</h3><p>A capsaicina presente na pimenta vermelha pode aumentar temporariamente o metabolismo em até 25%.</p><h3>2. Chá Verde</h3><p>Rico em catequinas e cafeína, o chá verde é conhecido por suas propriedades termogênicas.</p><h3>3. Proteínas Magras</h3><p>O corpo gasta mais energia para digerir proteínas do que carboidratos ou gorduras.</p><h3>4. Água Gelada</h3><p>Beber água gelada faz o corpo gastar energia para aquecê-la à temperatura corporal.</p><h3>5. Café</h3><p>A cafeína é um estimulante natural que pode aumentar o metabolismo em 3-11%.</p><h3>6. Gengibre</h3><p>Possui propriedades termogênicas e anti-inflamatórias.</p><h3>7. Canela</h3><p>Ajuda a regular os níveis de açúcar no sangue e pode acelerar o metabolismo.</p><h3>8. Vinagre de Maçã</h3><p>Pode ajudar a aumentar a sensação de saciedade e acelerar o metabolismo.</p><h3>9. Coco</h3><p>Os triglicerídeos de cadeia média (TCM) do coco são metabolizados de forma diferente.</p><h3>10. Brócolis</h3><p>Rico em cálcio e vitamina C, nutrientes importantes para o metabolismo.</p><p><strong>Conclusão:</strong> Incluir esses alimentos em sua dieta pode ajudar a acelerar o metabolismo de forma natural e saudável.</p>',
                    'Descubra 10 alimentos naturais que podem ajudar a acelerar seu metabolismo e potencializar a queima de calorias.',
                    'Emagrecimento',
                    ARRAY['metabolismo', 'emagrecimento', 'alimentação', 'queima de gordura'],
                    'published',
                    NOW() - INTERVAL '5 days',
                    1250, 89, 23, 45
                );
                
            WHEN 2 THEN
                INSERT INTO public.blog_posts (
                    id, author_id, title, content, excerpt, category, tags, status,
                    published_at, views, likes_count, comments_count, shares_count
                ) VALUES (
                    gen_random_uuid(), current_nutritionist_id,
                    'Suplementação Pré-Treino: O que Você Precisa Saber',
                    '<h2>Maximize seus treinos com a suplementação adequada</h2><p>A suplementação pré-treino pode ser uma ferramenta valiosa para melhorar o desempenho durante os exercícios.</p><h3>Principais Suplementos Pré-Treino</h3><h4>1. Cafeína</h4><p>A cafeína é um dos suplementos mais estudados e eficazes para melhorar o desempenho. Recomenda-se 3-6mg por kg de peso corporal, consumida 30-60 minutos antes do treino.</p><h4>2. Creatina</h4><p>Embora seja mais conhecida como suplemento pós-treino, a creatina também pode ser benéfica antes do exercício, especialmente para treinos de alta intensidade.</p><h4>3. Beta-Alanina</h4><p>Ajuda a reduzir a fadiga muscular e pode melhorar o desempenho em exercícios de alta intensidade.</p><h4>4. Citrulina</h4><p>Pode melhorar o fluxo sanguíneo e reduzir a fadiga muscular.</p><h3>Timing da Suplementação</h3><p>O timing é crucial para maximizar os benefícios dos suplementos pré-treino:</p><ul><li>Cafeína: 30-60 minutos antes</li><li>Creatina: Pode ser tomada a qualquer hora</li><li>Beta-alanina: 30-45 minutos antes</li><li>Citrulina: 30-60 minutos antes</li></ul><h3>Considerações Importantes</h3><p>Sempre consulte um nutricionista antes de iniciar qualquer suplementação. A individualidade biológica é fundamental na escolha dos suplementos.</p>',
                    'Guia completo sobre suplementação pré-treino: principais suplementos, timing e considerações importantes para maximizar seus resultados.',
                    'Nutrição Esportiva',
                    ARRAY['suplementação', 'pré-treino', 'performance', 'exercício'],
                    'published',
                    NOW() - INTERVAL '3 days',
                    890, 67, 18, 32
                );
                
            WHEN 3 THEN
                INSERT INTO public.blog_posts (
                    id, author_id, title, content, excerpt, category, tags, status,
                    published_at, views, likes_count, comments_count, shares_count
                ) VALUES (
                    gen_random_uuid(), current_nutritionist_id,
                    'Receita: Bowl de Açaí Proteico e Nutritivo',
                    '<h2>Bowl de Açaí Saudável e Delicioso</h2><p>Esta receita de bowl de açaí é perfeita para quem busca uma opção nutritiva e saborosa para o café da manhã ou lanche.</p><h3>Ingredientes</h3><h4>Para a base:</h4><ul><li>100g de polpa de açaí congelada</li><li>1 banana congelada</li><li>50ml de leite de coco</li><li>1 colher de sopa de whey protein de baunilha</li><li>1 colher de chá de mel</li></ul><h4>Para a cobertura:</h4><ul><li>1 banana fatiada</li><li>2 colheres de sopa de granola caseira</li><li>1 colher de sopa de coco ralado</li><li>1 colher de sopa de castanhas picadas</li><li>Frutas vermelhas a gosto</li><li>1 colher de chá de chia</li></ul><h3>Modo de Preparo</h3><ol><li>No liquidificador, bata a polpa de açaí, banana congelada, leite de coco, whey protein e mel até obter uma consistência cremosa.</li><li>Despeje a mistura em uma tigela.</li><li>Decore com as frutas, granola, coco ralado, castanhas e chia.</li><li>Sirva imediatamente.</li></ol><h3>Informações Nutricionais (por porção)</h3><ul><li>Calorias: 380</li><li>Proteínas: 25g</li><li>Carboidratos: 45g</li><li>Gorduras: 12g</li><li>Fibras: 8g</li></ul><h3>Dicas da Nutricionista</h3><p>Este bowl é rico em antioxidantes, proteínas e fibras. É uma excelente opção pós-treino ou para um café da manhã nutritivo.</p>',
                    'Receita completa de bowl de açaí proteico com informações nutricionais e dicas para uma alimentação saudável.',
                    'Receitas Saudáveis',
                    ARRAY['receita', 'açaí', 'proteína', 'café da manhã', 'saudável'],
                    'published',
                    NOW() - INTERVAL '1 day',
                    567, 45, 12, 28
                );
                
            WHEN 4 THEN
                INSERT INTO public.blog_posts (
                    id, author_id, title, content, excerpt, category, tags, status,
                    published_at, views, likes_count, comments_count, shares_count
                ) VALUES (
                    gen_random_uuid(), current_nutritionist_id,
                    'Alimentação Infantil: Introdução Alimentar dos 6 aos 12 meses',
                    '<h2>Guia Completo da Introdução Alimentar</h2><p>A introdução alimentar é um marco importante no desenvolvimento do bebê. Vamos abordar as principais orientações para essa fase.</p><h3>Quando Começar?</h3><p>A Organização Mundial da Saúde recomenda o início da introdução alimentar aos 6 meses de idade, mantendo o aleitamento materno.</p><h3>Sinais de Prontidão</h3><ul><li>Consegue sentar com apoio</li><li>Perdeu o reflexo de protrusão da língua</li><li>Demonstra interesse pela comida</li><li>Consegue pegar objetos e levar à boca</li></ul><h3>Primeiros Alimentos (6 meses)</h3><h4>Frutas:</h4><ul><li>Banana</li><li>Maçã</li><li>Pera</li><li>Mamão</li><li>Abacate</li></ul><h4>Legumes e Verduras:</h4><ul><li>Batata doce</li><li>Cenoura</li><li>Abobrinha</li><li>Brócolis</li><li>Couve-flor</li></ul><h3>Progressão dos 6 aos 12 meses</h3><h4>6-7 meses:</h4><p>Papas de frutas e legumes amassados, sem temperos.</p><h4>8-9 meses:</h4><p>Introdução de proteínas (frango, peixe, ovo), grãos e leguminosas.</p><h4>10-12 meses:</h4><p>Alimentos em pedaços pequenos, participação nas refeições da família.</p><h3>Alimentos a Evitar no Primeiro Ano</h3><ul><li>Mel</li><li>Açúcar e adoçantes</li><li>Sal em excesso</li><li>Leite de vaca integral</li><li>Oleaginosas inteiras</li><li>Alimentos ultraprocessados</li></ul><h3>Dicas Importantes</h3><p>Respeite o apetite do bebê, ofereça variedade e seja paciente. Cada criança tem seu ritmo de aceitação.</p>',
                    'Guia completo sobre introdução alimentar: quando começar, primeiros alimentos e progressão dos 6 aos 12 meses.',
                    'Nutrição Infantil',
                    ARRAY['introdução alimentar', 'bebê', 'nutrição infantil', 'primeiros alimentos'],
                    'published',
                    NOW() - INTERVAL '2 days',
                    1100, 78, 34, 56
                );
                
            WHEN 5 THEN
                INSERT INTO public.blog_posts (
                    id, author_id, title, content, excerpt, category, tags, status,
                    published_at, views, likes_count, comments_count, shares_count
                ) VALUES (
                    gen_random_uuid(), current_nutritionist_id,
                    'Dieta Plant-Based: Benefícios e Como Começar',
                    '<h2>Descobrindo os Benefícios da Alimentação Plant-Based</h2><p>A dieta plant-based tem ganhado popularidade devido aos seus benefícios para a saúde e meio ambiente.</p><h3>O que é uma Dieta Plant-Based?</h3><p>Uma dieta plant-based foca em alimentos derivados de plantas: frutas, vegetais, grãos integrais, legumes, nozes e sementes, minimizando ou eliminando produtos de origem animal.</p><h3>Benefícios para a Saúde</h3><h4>1. Saúde Cardiovascular</h4><p>Estudos mostram redução no risco de doenças cardíacas em até 32%.</p><h4>2. Controle de Peso</h4><p>Alimentos plant-based tendem a ser menos calóricos e mais ricos em fibras.</p><h4>3. Redução do Risco de Diabetes</h4><p>Pode reduzir o risco de diabetes tipo 2 em até 23%.</p><h4>4. Saúde Digestiva</h4><p>Alto teor de fibras promove uma microbiota intestinal saudável.</p><h3>Como Fazer a Transição</h3><h4>Semana 1-2: Substitua uma refeição</h4><p>Comece substituindo o café da manhã por opções plant-based.</p><h4>Semana 3-4: Duas refeições</h4><p>Adicione o almoço às refeições plant-based.</p><h4>Semana 5+: Transição completa</h4><p>Gradualmente substitua todas as refeições.</p><h3>Fontes de Proteína Plant-Based</h3><ul><li>Leguminosas (feijão, lentilha, grão-de-bico)</li><li>Quinoa</li><li>Tofu e tempeh</li><li>Nozes e sementes</li><li>Proteína de ervilha</li></ul><h3>Suplementação Necessária</h3><p>Vitamina B12 é essencial, além de atenção especial para ferro, zinco, ômega-3 e vitamina D.</p><h3>Receita Rápida: Buddha Bowl</h3><p>Base de quinoa, vegetais assados, abacate, grão-de-bico temperado e tahine.</p>',
                    'Descubra os benefícios da dieta plant-based para a saúde e aprenda como fazer a transição de forma gradual e saudável.',
                    'Vegetarianismo',
                    ARRAY['plant-based', 'vegetariano', 'vegano', 'saúde', 'sustentabilidade'],
                    'published',
                    NOW() - INTERVAL '4 days',
                    945, 72, 28, 41
                );
                
            WHEN 6 THEN
                INSERT INTO public.blog_posts (
                    id, author_id, title, content, excerpt, category, tags, status,
                    published_at, views, likes_count, comments_count, shares_count
                ) VALUES (
                    gen_random_uuid(), current_nutritionist_id,
                    'Nutrição e Diabetes: Guia Alimentar Completo',
                    '<h2>Alimentação Estratégica para Diabéticos</h2><p>O controle da diabetes através da alimentação é fundamental para manter a qualidade de vida e prevenir complicações.</p><h3>Entendendo o Índice Glicêmico</h3><p>O índice glicêmico (IG) mede a velocidade com que os carboidratos elevam a glicose no sangue.</p><h4>Alimentos de Baixo IG (0-55):</h4><ul><li>Aveia</li><li>Quinoa</li><li>Batata doce</li><li>Maçã</li><li>Feijão</li></ul><h4>Alimentos de Alto IG (>70):</h4><ul><li>Pão branco</li><li>Arroz branco</li><li>Batata inglesa</li><li>Melancia</li><li>Açúcar</li></ul><h3>Método do Prato</h3><p>Divida seu prato em:</p><ul><li>50% vegetais não amiláceos</li><li>25% proteína magra</li><li>25% carboidratos complexos</li></ul><h3>Alimentos Recomendados</h3><h4>Proteínas:</h4><ul><li>Peixes</li><li>Frango sem pele</li><li>Ovos</li><li>Tofu</li><li>Leguminosas</li></ul><h4>Carboidratos:</h4><ul><li>Grãos integrais</li><li>Vegetais</li><li>Frutas com casca</li></ul><h4>Gorduras Saudáveis:</h4><ul><li>Abacate</li><li>Nozes</li><li>Azeite de oliva</li><li>Sementes</li></ul><h3>Horários das Refeições</h3><p>Manter horários regulares ajuda no controle glicêmico:</p><ul><li>Café da manhã: 7h-8h</li><li>Lanche: 10h</li><li>Almoço: 12h-13h</li><li>Lanche: 15h-16h</li><li>Jantar: 19h-20h</li><li>Ceia (se necessário): 22h</li></ul><h3>Monitoramento</h3><p>Mantenha um diário alimentar e monitore a glicemia regularmente para identificar como diferentes alimentos afetam seus níveis de açúcar.</p>',
                    'Guia completo de alimentação para diabéticos: índice glicêmico, método do prato e estratégias para controle da glicemia.',
                    'Doenças e Nutrição',
                    ARRAY['diabetes', 'índice glicêmico', 'controle glicêmico', 'alimentação terapêutica'],
                    'published',
                    NOW() - INTERVAL '6 days',
                    1340, 95, 42, 67
                );
                
            WHEN 7 THEN
                INSERT INTO public.blog_posts (
                    id, author_id, title, content, excerpt, category, tags, status,
                    scheduled_for, views, likes_count, comments_count, shares_count
                ) VALUES (
                    gen_random_uuid(), current_nutritionist_id,
                    'Hidratação: Muito Além da Água',
                    '<h2>A Importância da Hidratação Adequada</h2><p>A hidratação vai muito além de beber água. Entenda como manter seu corpo adequadamente hidratado.</p><h3>Por que a Hidratação é Importante?</h3><p>A água representa 60% do peso corporal em adultos e é essencial para:</p><ul><li>Regulação da temperatura corporal</li><li>Transporte de nutrientes</li><li>Eliminação de toxinas</li><li>Lubrificação das articulações</li><li>Funcionamento dos órgãos</li></ul><h3>Quanto Água Beber?</h3><p>A recomendação geral é de 35ml por kg de peso corporal, mas varia conforme:</p><ul><li>Atividade física</li><li>Clima</li><li>Estado de saúde</li><li>Gravidez/amamentação</li></ul><h3>Sinais de Desidratação</h3><h4>Leve:</h4><ul><li>Sede</li><li>Urina amarela escura</li><li>Fadiga</li></ul><h4>Moderada:</h4><ul><li>Dor de cabeça</li><li>Tontura</li><li>Pele seca</li></ul><h4>Grave:</h4><ul><li>Confusão mental</li><li>Batimentos cardíacos acelerados</li><li>Pressão baixa</li></ul><h3>Alimentos Hidratantes</h3><h4>Frutas (>85% água):</h4><ul><li>Melancia (92%)</li><li>Melão (90%)</li><li>Laranja (87%)</li><li>Morango (91%)</li></ul><h4>Vegetais (>90% água):</h4><ul><li>Pepino (96%)</li><li>Alface (95%)</li><li>Tomate (94%)</li><li>Abobrinha (95%)</li></ul><h3>Bebidas Hidratantes</h3><ul><li>Água pura</li><li>Água de coco</li><li>Chás sem açúcar</li><li>Água com limão</li><li>Sucos naturais diluídos</li></ul><h3>Dicas Práticas</h3><ol><li>Tenha sempre uma garrafa de água por perto</li><li>Beba um copo de água ao acordar</li><li>Consuma frutas e vegetais ricos em água</li><li>Monitore a cor da urina</li><li>Aumente a ingestão em dias quentes ou durante exercícios</li></ol>',
                    'Descubra a importância da hidratação adequada, sinais de desidratação e alimentos que ajudam a manter o corpo hidratado.',
                    'Nutrição Geral',
                    ARRAY['hidratação', 'água', 'saúde', 'bem-estar'],
                    'scheduled',
                    NOW() + INTERVAL '2 days',
                    0, 0, 0, 0
                );
                
            WHEN 8 THEN
                INSERT INTO public.blog_posts (
                    id, author_id, title, content, excerpt, category, tags, status,
                    views, likes_count, comments_count, shares_count
                ) VALUES (
                    gen_random_uuid(), current_nutritionist_id,
                    'Micronutrientes: Os Pequenos Gigantes da Nutrição',
                    '<h2>A Importância dos Micronutrientes</h2><p>Embora necessários em pequenas quantidades, os micronutrientes são essenciais para o funcionamento adequado do organismo.</p><h3>O que são Micronutrientes?</h3><p>São vitaminas e minerais necessários em pequenas quantidades, mas fundamentais para:</p><ul><li>Metabolismo energético</li><li>Função imunológica</li><li>Crescimento e desenvolvimento</li><li>Função neurológica</li><li>Saúde óssea</li></ul><h3>Vitaminas Essenciais</h3><h4>Vitaminas Hidrossolúveis:</h4><ul><li><strong>Vitamina C:</strong> Imunidade, colágeno (frutas cítricas, brócolis)</li><li><strong>Complexo B:</strong> Metabolismo energético (grãos integrais, carnes)</li></ul><h4>Vitaminas Lipossolúveis:</h4><ul><li><strong>Vitamina A:</strong> Visão, pele (cenoura, fígado)</li><li><strong>Vitamina D:</strong> Ossos, imunidade (sol, peixes gordos)</li><li><strong>Vitamina E:</strong> Antioxidante (nozes, óleos)</li><li><strong>Vitamina K:</strong> Coagulação (vegetais verdes)</li></ul><h3>Minerais Importantes</h3><h4>Macrominerais:</h4><ul><li><strong>Cálcio:</strong> Ossos, músculos (laticínios, vegetais verdes)</li><li><strong>Magnésio:</strong> Músculos, nervos (nozes, grãos)</li><li><strong>Potássio:</strong> Pressão arterial (banana, batata)</li></ul><h4>Microminerais:</h4><ul><li><strong>Ferro:</strong> Transporte de oxigênio (carnes, feijão)</li><li><strong>Zinco:</strong> Imunidade, cicatrização (carnes, sementes)</li><li><strong>Selênio:</strong> Antioxidante (castanha do Brasil)</li></ul><h3>Deficiências Comuns</h3><ul><li>Ferro: Anemia</li><li>Vitamina D: Problemas ósseos</li><li>B12: Problemas neurológicos</li><li>Ácido fólico: Defeitos do tubo neural</li></ul><h3>Como Garantir Adequação</h3><ol><li>Dieta variada e colorida</li><li>Incluir todos os grupos alimentares</li><li>Preferir alimentos in natura</li><li>Considerar suplementação quando necessário</li><li>Fazer exames regulares</li></ol>',
                    'Entenda a importância dos micronutrientes, principais vitaminas e minerais, e como garantir adequação nutricional.',
                    'Nutrição Geral',
                    ARRAY['micronutrientes', 'vitaminas', 'minerais', 'deficiências'],
                    'draft',
                    0, 0, 0, 0
                );
                
            ELSE
                -- Insert remaining posts with varied content
                INSERT INTO public.blog_posts (
                    id, author_id, title, content, excerpt, category, tags, status,
                    published_at, views, likes_count, comments_count, shares_count
                ) VALUES (
                    gen_random_uuid(), current_nutritionist_id,
                    'Post de Exemplo ' || i,
                    '<h2>Conteúdo do Post ' || i || '</h2><p>Este é um post de exemplo com conteúdo relevante sobre nutrição e alimentação saudável.</p><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>',
                    'Resumo do post de exemplo número ' || i || ' sobre temas importantes de nutrição.',
                    CASE (i % 8)
                        WHEN 0 THEN 'Nutrição Geral'
                        WHEN 1 THEN 'Emagrecimento'
                        WHEN 2 THEN 'Nutrição Esportiva'
                        WHEN 3 THEN 'Receitas Saudáveis'
                        WHEN 4 THEN 'Suplementação'
                        WHEN 5 THEN 'Nutrição Infantil'
                        WHEN 6 THEN 'Doenças e Nutrição'
                        ELSE 'Vegetarianismo'
                    END,
                    ARRAY['nutrição', 'saúde', 'alimentação'],
                    CASE (i % 3)
                        WHEN 0 THEN 'published'
                        WHEN 1 THEN 'draft'
                        ELSE 'scheduled'
                    END,
                    CASE (i % 3)
                        WHEN 0 THEN NOW() - INTERVAL '1 day' * (i % 10)
                        ELSE NULL
                    END,
                    (random() * 1000)::INTEGER,
                    (random() * 100)::INTEGER,
                    (random() * 50)::INTEGER,
                    (random() * 30)::INTEGER
                );
        END CASE;
    END LOOP;
    
    -- Insert sample comments for published posts
    FOR post_id IN (SELECT id FROM public.blog_posts WHERE status = 'published' LIMIT 5) LOOP
        -- Insert 2-5 comments per post
        FOR i IN 1..(2 + (random() * 3)::INTEGER) LOOP
            INSERT INTO public.blog_post_comments (
                post_id, author_id, content, is_approved
            ) VALUES (
                post_id,
                nutritionist_ids[((i - 1) % array_length(nutritionist_ids, 1)) + 1],
                CASE i
                    WHEN 1 THEN 'Excelente artigo! Muito esclarecedor e bem fundamentado.'
                    WHEN 2 THEN 'Obrigada pelas dicas, vou implementar na minha rotina.'
                    WHEN 3 THEN 'Poderia falar mais sobre as contraindicações?'
                    WHEN 4 THEN 'Informações muito úteis, parabéns pelo conteúdo!'
                    ELSE 'Gostei muito do post, muito informativo!'
                END,
                true
            );
        END LOOP;
    END LOOP;
    
    -- Insert sample likes for published posts
    FOR post_id IN (SELECT id FROM public.blog_posts WHERE status = 'published') LOOP
        FOR i IN 1..(1 + (random() * 2)::INTEGER) LOOP
            INSERT INTO public.blog_post_likes (post_id, user_id)
            VALUES (
                post_id,
                nutritionist_ids[((i - 1) % array_length(nutritionist_ids, 1)) + 1]
            )
            ON CONFLICT (post_id, user_id) DO NOTHING;
        END LOOP;
    END LOOP;
    
    -- Insert sample views for published posts
    FOR post_id IN (SELECT id FROM public.blog_posts WHERE status = 'published') LOOP
        FOR i IN 1..(5 + (random() * 10)::INTEGER) LOOP
            INSERT INTO public.blog_post_views (
                post_id, user_id, ip_address, viewed_at
            ) VALUES (
                post_id,
                CASE WHEN random() > 0.5 THEN nutritionist_ids[((i - 1) % array_length(nutritionist_ids, 1)) + 1] ELSE NULL END,
                ('192.168.1.' || (1 + (random() * 254)::INTEGER))::INET,
                NOW() - INTERVAL '1 hour' * (random() * 24 * 7)::INTEGER
            );
        END LOOP;
    END LOOP;
    
    -- Insert sample shares
    FOR post_id IN (SELECT id FROM public.blog_posts WHERE status = 'published' LIMIT 3) LOOP
        INSERT INTO public.blog_post_shares (post_id, platform, shared_at)
        VALUES 
            (post_id, 'facebook', NOW() - INTERVAL '1 day'),
            (post_id, 'twitter', NOW() - INTERVAL '2 days'),
            (post_id, 'whatsapp', NOW() - INTERVAL '3 hours');
    END LOOP;
    
END $$;