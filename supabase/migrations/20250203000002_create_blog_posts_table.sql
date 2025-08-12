-- Migration: Create blog_posts table for nutritionist posts
-- This table stores blog posts created by nutritionists

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    author_id UUID NOT NULL REFERENCES public.nutritionist_profiles(user_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
    featured_image_url TEXT,
    published_at TIMESTAMPTZ,
    scheduled_for TIMESTAMPTZ,
    views INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    read_time_minutes INTEGER DEFAULT 5,
    meta_title TEXT,
    meta_description TEXT,
    slug TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON public.blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON public.blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON public.blog_posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view published posts
CREATE POLICY "Anyone can view published posts" ON public.blog_posts
    FOR SELECT USING (status = 'published');

-- Nutritionists can view their own posts (all statuses)
CREATE POLICY "Nutritionists can view their own posts" ON public.blog_posts
    FOR SELECT USING (author_id = auth.uid());

-- Nutritionists can create their own posts
CREATE POLICY "Nutritionists can create posts" ON public.blog_posts
    FOR INSERT WITH CHECK (author_id = auth.uid());

-- Nutritionists can update their own posts
CREATE POLICY "Nutritionists can update their own posts" ON public.blog_posts
    FOR UPDATE USING (author_id = auth.uid());

-- Nutritionists can delete their own posts
CREATE POLICY "Nutritionists can delete their own posts" ON public.blog_posts
    FOR DELETE USING (author_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON public.blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_blog_posts_updated_at();

-- Create function to generate slug from title
CREATE OR REPLACE FUNCTION public.generate_blog_post_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(
        regexp_replace(
            regexp_replace(
                unaccent(title),
                '[^a-zA-Z0-9\s]', '', 'g'
            ),
            '\s+', '-', 'g'
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-generate slug if not provided
CREATE OR REPLACE FUNCTION public.auto_generate_blog_post_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug = public.generate_blog_post_slug(NEW.title);
        
        -- Ensure uniqueness by appending a number if needed
        WHILE EXISTS (SELECT 1 FROM public.blog_posts WHERE slug = NEW.slug AND id != COALESCE(NEW.id, gen_random_uuid())) LOOP
            NEW.slug = NEW.slug || '-' || extract(epoch from now())::integer;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate slug
CREATE TRIGGER auto_generate_blog_post_slug
    BEFORE INSERT OR UPDATE ON public.blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_generate_blog_post_slug();

-- Create function to calculate read time based on content
CREATE OR REPLACE FUNCTION public.calculate_read_time(content TEXT)
RETURNS INTEGER AS $$
DECLARE
    word_count INTEGER;
    read_time INTEGER;
BEGIN
    -- Count words (approximate)
    word_count := array_length(string_to_array(content, ' '), 1);
    
    -- Calculate read time (assuming 200 words per minute)
    read_time := GREATEST(1, CEIL(word_count / 200.0));
    
    RETURN read_time;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate read time
CREATE OR REPLACE FUNCTION public.auto_calculate_read_time()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.read_time_minutes IS NULL OR NEW.read_time_minutes = 0 THEN
        NEW.read_time_minutes = public.calculate_read_time(NEW.content);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_calculate_read_time
    BEFORE INSERT OR UPDATE ON public.blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_calculate_read_time();

-- Add comments for documentation
COMMENT ON TABLE public.blog_posts IS 'Posts do blog criados pelos nutricionistas';
COMMENT ON COLUMN public.blog_posts.author_id IS 'ID do nutricionista autor do post';
COMMENT ON COLUMN public.blog_posts.title IS 'Título do post';
COMMENT ON COLUMN public.blog_posts.content IS 'Conteúdo completo do post em HTML ou Markdown';
COMMENT ON COLUMN public.blog_posts.excerpt IS 'Resumo/preview do post';
COMMENT ON COLUMN public.blog_posts.category IS 'Categoria do post';
COMMENT ON COLUMN public.blog_posts.tags IS 'Tags/palavras-chave do post';
COMMENT ON COLUMN public.blog_posts.status IS 'Status do post: draft, published, scheduled';
COMMENT ON COLUMN public.blog_posts.featured_image_url IS 'URL da imagem destacada do post';
COMMENT ON COLUMN public.blog_posts.published_at IS 'Data e hora de publicação';
COMMENT ON COLUMN public.blog_posts.scheduled_for IS 'Data e hora agendada para publicação';
COMMENT ON COLUMN public.blog_posts.views IS 'Número de visualizações';
COMMENT ON COLUMN public.blog_posts.likes_count IS 'Número de curtidas';
COMMENT ON COLUMN public.blog_posts.comments_count IS 'Número de comentários';
COMMENT ON COLUMN public.blog_posts.shares_count IS 'Número de compartilhamentos';
COMMENT ON COLUMN public.blog_posts.read_time_minutes IS 'Tempo estimado de leitura em minutos';
COMMENT ON COLUMN public.blog_posts.meta_title IS 'Título para SEO';
COMMENT ON COLUMN public.blog_posts.meta_description IS 'Descrição para SEO';
COMMENT ON COLUMN public.blog_posts.slug IS 'URL amigável do post';