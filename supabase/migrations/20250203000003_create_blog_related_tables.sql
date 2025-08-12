-- Migration: Create blog-related tables for complete blog functionality
-- This migration creates tables for comments, likes, categories, and post views

-- Create blog_categories table
CREATE TABLE IF NOT EXISTS public.blog_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    slug TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT,
    posts_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create blog_tags table
CREATE TABLE IF NOT EXISTS public.blog_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create blog_post_comments table
CREATE TABLE IF NOT EXISTS public.blog_post_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES public.blog_post_comments(id) ON DELETE CASCADE,
    is_approved BOOLEAN DEFAULT false,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create blog_post_likes table
CREATE TABLE IF NOT EXISTS public.blog_post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Create blog_comment_likes table
CREATE TABLE IF NOT EXISTS public.blog_comment_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES public.blog_post_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Create blog_post_views table
CREATE TABLE IF NOT EXISTS public.blog_post_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    session_id TEXT
);

-- Create blog_post_shares table
CREATE TABLE IF NOT EXISTS public.blog_post_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    platform TEXT NOT NULL, -- 'facebook', 'twitter', 'linkedin', 'whatsapp', 'email', etc.
    shared_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON public.blog_categories(slug);
CREATE INDEX IF NOT EXISTS idx_blog_tags_slug ON public.blog_tags(slug);
CREATE INDEX IF NOT EXISTS idx_blog_post_comments_post_id ON public.blog_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_comments_author_id ON public.blog_post_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_comments_parent_id ON public.blog_post_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_likes_post_id ON public.blog_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_likes_user_id ON public.blog_post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_comment_likes_comment_id ON public.blog_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_blog_comment_likes_user_id ON public.blog_comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_views_post_id ON public.blog_post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_views_user_id ON public.blog_post_views(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_views_viewed_at ON public.blog_post_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_blog_post_shares_post_id ON public.blog_post_shares(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_shares_platform ON public.blog_post_shares(platform);

-- Enable RLS on all tables
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_categories
CREATE POLICY "Anyone can view categories" ON public.blog_categories
    FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can manage categories" ON public.blog_categories
    FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for blog_tags
CREATE POLICY "Anyone can view tags" ON public.blog_tags
    FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can manage tags" ON public.blog_tags
    FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for blog_post_comments
CREATE POLICY "Anyone can view approved comments" ON public.blog_post_comments
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Authors can view their own comments" ON public.blog_post_comments
    FOR SELECT USING (author_id = auth.uid());

CREATE POLICY "Authenticated users can create comments" ON public.blog_post_comments
    FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update their own comments" ON public.blog_post_comments
    FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Authors can delete their own comments" ON public.blog_post_comments
    FOR DELETE USING (author_id = auth.uid());

-- RLS Policies for blog_post_likes
CREATE POLICY "Anyone can view likes" ON public.blog_post_likes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like posts" ON public.blog_post_likes
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove their own likes" ON public.blog_post_likes
    FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for blog_comment_likes
CREATE POLICY "Anyone can view comment likes" ON public.blog_comment_likes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like comments" ON public.blog_comment_likes
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove their own comment likes" ON public.blog_comment_likes
    FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for blog_post_views
CREATE POLICY "Anyone can create views" ON public.blog_post_views
    FOR INSERT USING (true);

CREATE POLICY "Users can view their own views" ON public.blog_post_views
    FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

-- RLS Policies for blog_post_shares
CREATE POLICY "Anyone can view shares" ON public.blog_post_shares
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create shares" ON public.blog_post_shares
    FOR INSERT USING (true);

-- Create functions to update counters

-- Function to update blog_posts likes_count
CREATE OR REPLACE FUNCTION public.update_blog_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.blog_posts 
        SET likes_count = likes_count + 1
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.blog_posts 
        SET likes_count = likes_count - 1
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update blog_posts comments_count
CREATE OR REPLACE FUNCTION public.update_blog_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.blog_posts 
        SET comments_count = comments_count + 1
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.blog_posts 
        SET comments_count = comments_count - 1
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update blog_posts shares_count
CREATE OR REPLACE FUNCTION public.update_blog_post_shares_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.blog_posts 
        SET shares_count = shares_count + 1
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.blog_posts 
        SET shares_count = shares_count - 1
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update blog_post_comments likes_count
CREATE OR REPLACE FUNCTION public.update_blog_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.blog_post_comments 
        SET likes_count = likes_count + 1
        WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.blog_post_comments 
        SET likes_count = likes_count - 1
        WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update blog_categories posts_count
CREATE OR REPLACE FUNCTION public.update_blog_category_posts_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.blog_categories 
        SET posts_count = posts_count + 1
        WHERE name = NEW.category;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.category != NEW.category THEN
            UPDATE public.blog_categories 
            SET posts_count = posts_count - 1
            WHERE name = OLD.category;
            
            UPDATE public.blog_categories 
            SET posts_count = posts_count + 1
            WHERE name = NEW.category;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.blog_categories 
        SET posts_count = posts_count - 1
        WHERE name = OLD.category;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update blog_tags usage_count
CREATE OR REPLACE FUNCTION public.update_blog_tags_usage_count()
RETURNS TRIGGER AS $$
DECLARE
    tag_name TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        FOREACH tag_name IN ARRAY NEW.tags
        LOOP
            INSERT INTO public.blog_tags (name, slug, usage_count)
            VALUES (tag_name, lower(regexp_replace(tag_name, '[^a-zA-Z0-9]', '-', 'g')), 1)
            ON CONFLICT (name) DO UPDATE SET usage_count = blog_tags.usage_count + 1;
        END LOOP;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Decrease count for old tags
        FOREACH tag_name IN ARRAY OLD.tags
        LOOP
            UPDATE public.blog_tags 
            SET usage_count = usage_count - 1
            WHERE name = tag_name;
        END LOOP;
        
        -- Increase count for new tags
        FOREACH tag_name IN ARRAY NEW.tags
        LOOP
            INSERT INTO public.blog_tags (name, slug, usage_count)
            VALUES (tag_name, lower(regexp_replace(tag_name, '[^a-zA-Z0-9]', '-', 'g')), 1)
            ON CONFLICT (name) DO UPDATE SET usage_count = blog_tags.usage_count + 1;
        END LOOP;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        FOREACH tag_name IN ARRAY OLD.tags
        LOOP
            UPDATE public.blog_tags 
            SET usage_count = usage_count - 1
            WHERE name = tag_name;
        END LOOP;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_blog_post_likes_count
    AFTER INSERT OR DELETE ON public.blog_post_likes
    FOR EACH ROW EXECUTE FUNCTION public.update_blog_post_likes_count();

CREATE TRIGGER trigger_update_blog_post_comments_count
    AFTER INSERT OR DELETE ON public.blog_post_comments
    FOR EACH ROW EXECUTE FUNCTION public.update_blog_post_comments_count();

CREATE TRIGGER trigger_update_blog_post_shares_count
    AFTER INSERT OR DELETE ON public.blog_post_shares
    FOR EACH ROW EXECUTE FUNCTION public.update_blog_post_shares_count();

CREATE TRIGGER trigger_update_blog_comment_likes_count
    AFTER INSERT OR DELETE ON public.blog_comment_likes
    FOR EACH ROW EXECUTE FUNCTION public.update_blog_comment_likes_count();

CREATE TRIGGER trigger_update_blog_category_posts_count
    AFTER INSERT OR UPDATE OR DELETE ON public.blog_posts
    FOR EACH ROW EXECUTE FUNCTION public.update_blog_category_posts_count();

CREATE TRIGGER trigger_update_blog_tags_usage_count
    AFTER INSERT OR UPDATE OR DELETE ON public.blog_posts
    FOR EACH ROW EXECUTE FUNCTION public.update_blog_tags_usage_count();

-- Create trigger to update updated_at timestamp for comments
CREATE OR REPLACE FUNCTION public.update_blog_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_blog_comments_updated_at
    BEFORE UPDATE ON public.blog_post_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_blog_comments_updated_at();

-- Insert default categories
INSERT INTO public.blog_categories (name, description, slug, color, icon) VALUES
('Nutrição Geral', 'Artigos sobre nutrição e alimentação saudável', 'nutricao-geral', '#10B981', 'utensils'),
('Emagrecimento', 'Dicas e estratégias para perda de peso', 'emagrecimento', '#EF4444', 'trending-down'),
('Nutrição Esportiva', 'Alimentação para atletas e praticantes de exercícios', 'nutricao-esportiva', '#F59E0B', 'activity'),
('Receitas Saudáveis', 'Receitas nutritivas e saborosas', 'receitas-saudaveis', '#8B5CF6', 'chef-hat'),
('Suplementação', 'Informações sobre suplementos alimentares', 'suplementacao', '#06B6D4', 'pill'),
('Nutrição Infantil', 'Alimentação para crianças e adolescentes', 'nutricao-infantil', '#F97316', 'baby'),
('Doenças e Nutrição', 'Nutrição terapêutica e clínica', 'doencas-nutricao', '#DC2626', 'heart-pulse'),
('Vegetarianismo', 'Alimentação vegetariana e vegana', 'vegetarianismo', '#22C55E', 'leaf')
ON CONFLICT (name) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE public.blog_categories IS 'Categorias dos posts do blog';
COMMENT ON TABLE public.blog_tags IS 'Tags utilizadas nos posts do blog';
COMMENT ON TABLE public.blog_post_comments IS 'Comentários dos posts do blog';
COMMENT ON TABLE public.blog_post_likes IS 'Curtidas dos posts do blog';
COMMENT ON TABLE public.blog_comment_likes IS 'Curtidas dos comentários';
COMMENT ON TABLE public.blog_post_views IS 'Visualizações dos posts do blog';
COMMENT ON TABLE public.blog_post_shares IS 'Compartilhamentos dos posts do blog';