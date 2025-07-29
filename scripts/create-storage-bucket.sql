-- Criar bucket para assets da empresa
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir upload de imagens
CREATE POLICY "Empresas podem fazer upload de assets" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'company-assets' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.company_profiles 
    WHERE user_id = auth.uid()
  )
);

-- Política para permitir visualização pública
CREATE POLICY "Assets são públicos" ON storage.objects
FOR SELECT USING (bucket_id = 'company-assets');

-- Política para permitir atualização de assets
CREATE POLICY "Empresas podem atualizar seus assets" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'company-assets' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.company_profiles 
    WHERE user_id = auth.uid()
  )
);

-- Política para permitir exclusão de assets
CREATE POLICY "Empresas podem deletar seus assets" ON storage.objects
FOR DELETE USING (
  bucket_id = 'company-assets' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.company_profiles 
    WHERE user_id = auth.uid()
  )
);
