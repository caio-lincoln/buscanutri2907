-- Migration: Create nutritionist documents table
-- This table will store CRN proof and certificates for nutritionists

-- Create nutritionist_documents table
CREATE TABLE IF NOT EXISTS public.nutritionist_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nutritionist_id UUID NOT NULL REFERENCES public.nutritionist_profiles(user_id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('crn_proof', 'certificate')),
    title TEXT, -- Required for certificates, optional for CRN proof
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    storage_path TEXT NOT NULL, -- Path in Supabase Storage
    is_verified BOOLEAN DEFAULT false,
    verification_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add constraints
ALTER TABLE public.nutritionist_documents 
ADD CONSTRAINT check_certificate_title 
CHECK (
    (document_type = 'certificate' AND title IS NOT NULL AND title != '') OR 
    (document_type = 'crn_proof')
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_nutritionist_documents_nutritionist_id ON public.nutritionist_documents(nutritionist_id);
CREATE INDEX IF NOT EXISTS idx_nutritionist_documents_type ON public.nutritionist_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_nutritionist_documents_verified ON public.nutritionist_documents(is_verified);

-- Enable RLS
ALTER TABLE public.nutritionist_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Nutritionists can view and manage their own documents
CREATE POLICY "Nutritionists can manage own documents" ON public.nutritionist_documents
    FOR ALL USING (
        auth.uid() = nutritionist_id OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- Admins can view all documents for verification purposes
CREATE POLICY "Admins can view all documents" ON public.nutritionist_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- Add comments for documentation
COMMENT ON TABLE public.nutritionist_documents IS 'Stores CRN proof and certificates for nutritionists';
COMMENT ON COLUMN public.nutritionist_documents.document_type IS 'Type of document: crn_proof or certificate';
COMMENT ON COLUMN public.nutritionist_documents.title IS 'Title of the certificate (required for certificates)';
COMMENT ON COLUMN public.nutritionist_documents.file_name IS 'Original file name';
COMMENT ON COLUMN public.nutritionist_documents.file_url IS 'Public URL of the file in Supabase Storage';
COMMENT ON COLUMN public.nutritionist_documents.storage_path IS 'Path of the file in Supabase Storage bucket';
COMMENT ON COLUMN public.nutritionist_documents.is_verified IS 'Whether the document has been verified by admin';
COMMENT ON COLUMN public.nutritionist_documents.verification_notes IS 'Admin notes about document verification';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_nutritionist_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_nutritionist_documents_updated_at
    BEFORE UPDATE ON public.nutritionist_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_nutritionist_documents_updated_at();