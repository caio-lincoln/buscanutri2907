-- Sincronizar campos de verificação de nutricionistas
-- Objetivo: tornar verification_status a fonte de verdade e alinhar is_verified / verified_at

-- 1) Preencher verification_status quando estiver nulo, usando is_verified como fallback
UPDATE public.nutritionist_profiles
SET verification_status = CASE
    WHEN COALESCE(is_verified, false) = true THEN 'aprovado'
    ELSE 'pendente'
  END,
    verified_at = CASE
      WHEN COALESCE(is_verified, false) = true THEN COALESCE(verified_at, NOW())
      ELSE NULL
    END
WHERE verification_status IS NULL;

-- 2) Normalizar is_verified / verified_at com base em verification_status já definido
UPDATE public.nutritionist_profiles
SET is_verified = CASE
    WHEN LOWER(verification_status::text) IN ('aprovado', 'verificado') THEN true
    WHEN LOWER(verification_status::text) IN ('reprovado', 'rejected', 'pendente') THEN false
    ELSE COALESCE(is_verified, false)
  END,
    verified_at = CASE
      WHEN LOWER(verification_status::text) IN ('aprovado', 'verificado') THEN COALESCE(verified_at, NOW())
      WHEN LOWER(verification_status::text) IN ('reprovado', 'rejected', 'pendente') THEN NULL
      ELSE verified_at
    END;

