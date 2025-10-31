-- Migration: Create or update get_nutritionist_by_id RPC function
-- Purpose: Ensure RPC returns fields required by public UI logic
-- Fields added: service_online_available, public_price_visible, service_presential_available

CREATE OR REPLACE FUNCTION public.get_nutritionist_by_id(
    p_id UUID
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    full_name TEXT,
    crn TEXT,
    bio TEXT,
    academic_background TEXT,
    location TEXT,
    profile_image_url TEXT,
    cover_image_url TEXT,
    specialties TEXT[],
    experience_years TEXT,
    consultation_price DECIMAL,
    service_consultation_price DECIMAL,
    service_followup_price DECIMAL,
    service_meal_plan_price DECIMAL,
    public_price_visible BOOLEAN,
    online_consultation_available BOOLEAN,
    service_online_available BOOLEAN,
    service_presential_available BOOLEAN,
    rating DECIMAL,
    total_reviews INTEGER,
    is_verified BOOLEAN,
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
    weekly_availability JSONB,
    available_times JSONB,
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
        np.academic_background,
        np.location,
        np.profile_image_url,
        np.cover_image_url,
        np.specialties,
        np.experience_years,
        np.consultation_price,
        np.service_consultation_price,
        np.service_followup_price,
        np.service_meal_plan_price,
        np.public_price_visible,
        np.online_consultation_available,
        np.service_online_available,
        np.service_presential_available,
        np.rating,
        np.total_reviews,
        np.is_verified,
        np.phone,
        u.email,
        np.website,
        np.instagram,
        np.facebook,
        np.linkedin,
        np.whatsapp,
        np.cancellation_policy,
        np.default_consultation_duration,
        np.identity_document_url,
        np.weekly_availability,
        np.available_times,
        np.created_at,
        np.updated_at
    FROM public.nutritionist_profiles np
    LEFT JOIN public.users u ON u.id = np.user_id
    WHERE np.id = p_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in get_nutritionist_by_id: %', SQLERRM;
        RETURN;
END;
$$;

-- Grants: allow execution by anon and authenticated roles for public profile access
GRANT EXECUTE ON FUNCTION public.get_nutritionist_by_id(p_id UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_nutritionist_by_id(p_id UUID) TO anon;

-- Documentation
COMMENT ON FUNCTION public.get_nutritionist_by_id(p_id UUID) IS 'Returns a single nutritionist public profile by profile UUID, including service availability flags and price visibility.';
