-- Create bucket for nutritionist documents (CRN proof and certificates)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos-nutricionistas', 'documentos-nutricionistas', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Nutritionists can upload their own documents
CREATE POLICY "Nutritionists can upload own documents" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'documentos-nutricionistas' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND user_type = 'nutricionista'
    )
);

-- Policy: Nutritionists can view their own documents
CREATE POLICY "Nutritionists can view own documents" ON storage.objects
FOR SELECT USING (
    bucket_id = 'documentos-nutricionistas' AND
    (
        (storage.foldername(name))[1] = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    )
);

-- Policy: Nutritionists can update their own documents
CREATE POLICY "Nutritionists can update own documents" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'documentos-nutricionistas' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND user_type = 'nutricionista'
    )
);

-- Policy: Nutritionists can delete their own documents (except CRN proof)
CREATE POLICY "Nutritionists can delete own certificates" ON storage.objects
FOR DELETE USING (
    bucket_id = 'documentos-nutricionistas' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    NOT (storage.foldername(name))[2] = 'crn-proof' AND -- Prevent deletion of CRN proof
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND user_type = 'nutricionista'
    )
);

-- Policy: Admins can manage all documents
CREATE POLICY "Admins can manage all documents" ON storage.objects
FOR ALL USING (
    bucket_id = 'documentos-nutricionistas' AND
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND user_type = 'admin'
    )
);