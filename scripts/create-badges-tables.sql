CREATE TABLE IF NOT EXISTS public.badges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  icon_url text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.badges FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.badges FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.badges FOR DELETE USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.nutritionist_badges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nutritionist_id uuid NOT NULL REFERENCES public.nutritionist_profiles(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  assigned_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (nutritionist_id, badge_id) -- Garante que um nutricionista não tenha a mesma insígnia duas vezes
);

ALTER TABLE public.nutritionist_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.nutritionist_badges FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.nutritionist_badges FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.nutritionist_badges FOR DELETE USING (auth.role() = 'authenticated');
