-- Migration: Create get_nutritionists_safe RPC function
-- This function safely retrieves nutritionist profiles with proper error handling

CREATE OR REPLACE FUNCTION public.get_nutritionists_safe(
    p_id UUID DEFAULT NULL,
    p_location TEXT DEFAULT NULL,
    p_specialty TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT NULL,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    full_name TEXT,
    crn TEXT,
    bio TEXT,
    location TEXT,
    profile_image_url TEXT,
    specialties TEXT[],
    experience_years INTEGER,
    consultation_price DECIMAL,
    rating DECIMAL,
    total_reviews INTEGER,
    is_verified BOOLEAN,
    is_online BOOLEAN,
    accepts_telemedicine BOOLEAN,
    accepts_insurance BOOLEAN,
    accepts_corporate_plans BOOLEAN,
    aceita_cupons BOOLEAN,
    phone TEXT,
    email TEXT,
    website TEXT,
    instagram TEXT,
    facebook TEXT,
    linkedin TEXT,
    whatsapp TEXT,
    cancellation_policy TEXT,
    default_consultation_duration INTEGER,
    identity_document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        np.id,
        np.user_id,
        np.full_name,
        np.crn,
        np.bio,
        np.location,
        np.profile_image_url,
        np.specialties,
        np.experience_years,
        np.consultation_price,
        np.rating,
        np.total_reviews,
        np.is_verified,
        np.is_online,
        np.accepts_telemedicine,
        np.accepts_insurance,
        np.accepts_corporate_plans,
        np.aceita_cupons,
        np.phone,
        np.email,
        np.website,
        np.instagram,
        np.facebook,
        np.linkedin,
        np.whatsapp,
        np.cancellation_policy,
        np.default_consultation_duration,
        np.identity_document_url,
        np.created_at,
        np.updated_at
    FROM public.nutritionist_profiles np
    WHERE 
        (p_id IS NULL OR np.id = p_id)
        AND (p_location IS NULL OR np.location ILIKE '%' || p_location || '%')
        AND (p_specialty IS NULL OR p_specialty = ANY(np.specialties))
    ORDER BY np.created_at DESC
    LIMIT COALESCE(p_limit, 50)
    OFFSET p_offset;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error and return empty result
        RAISE WARNING 'Error in get_nutritionists_safe: %', SQLERRM;
        RETURN;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_nutritionists_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_nutritionists_safe TO anon;

-- Add comment
COMMENT ON FUNCTION public.get_nutritionists_safe IS 'Safely retrieves nutritionist profiles with optional filtering by ID, location, or specialty';