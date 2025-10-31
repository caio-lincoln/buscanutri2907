-- Migration: Merge overloaded get_nutritionist_by_id into single standardized definition
-- Purpose: Avoid duplication/ambiguity and include fields required by UI (service_online_available, public_price_visible)

-- 1) Drop the single-argument overload to remove ambiguity
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'get_nutritionist_by_id'
      AND n.nspname = 'public'
      AND pg_get_function_identity_arguments(p.oid) = 'p_id uuid'
  ) THEN
    DROP FUNCTION public.get_nutritionist_by_id(p_id UUID);
  END IF;
END $$;

-- 2) Update the main 4-arg function to return the required fields
CREATE OR REPLACE FUNCTION public.get_nutritionist_by_id(
  p_id UUID,
  p_tz TEXT DEFAULT 'America/Sao_Paulo',
  p_slot_minutes INTEGER DEFAULT 60,
  p_max_today INTEGER DEFAULT 8
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  profile_image_url TEXT,
  cover_image_url TEXT,
  rating NUMERIC,
  consultation_price NUMERIC,
  location TEXT,
  is_verified BOOLEAN,
  phone TEXT,
  academic_background TEXT,
  crn TEXT,
  experience_years NUMERIC,
  online_consultation_available BOOLEAN,
  specialties TEXT[],
  bio TEXT,
  education TEXT,
  service_consultation_price NUMERIC,
  service_followup_price NUMERIC,
  service_meal_plan_price NUMERIC,
  available_times TEXT[],
  weekly_availability JSONB,
  certifications JSONB,
  instagram_username TEXT,
  linkedin_username TEXT,
  facebook_username TEXT,
  youtube_channel TEXT,
  tiktok_username TEXT,
  website_url TEXT,
  instagram TEXT,
  linkedin TEXT,
  website TEXT,
  public_price_visible BOOLEAN,
  service_online_available BOOLEAN,
  service_presential_available BOOLEAN
)
LANGUAGE sql
STABLE
AS $function$
with prof as (
  -- p_id = nutritionist_profiles.id
  select id as profile_id, user_id
  from public.nutritionist_profiles
  where id = p_id
),
specs as (
  select coalesce(array_agg(s.name order by s.name), '{}'::text[]) as arr
  from public.nutritionist_specialties ns
  join public.specialties s on s.id = ns.specialty_id
  where ns.nutritionist_id = p_id
),
week as (
  with days as (select generate_series(1,7) as dow),
  agg as (
    select
      a.day_of_week,
      jsonb_agg(
        jsonb_build_object(
          'start', to_char(a.start_time,'HH24:MI'),
          'end',   to_char(a.end_time,'HH24:MI')
        )
        order by a.start_time
      ) as intervals,
      bool_or(a.is_available) as is_available
    from public.nutritionist_availability a
    where a.nutritionist_id = p_id
    group by a.day_of_week
  )
  select jsonb_agg(
           jsonb_build_object(
             'day_of_week', d.dow,
             'intervals', coalesce(agg.intervals, '[]'::jsonb),
             'is_available', coalesce(agg.is_available, false)
           )
           order by d.dow
         ) as data
  from days d
  left join agg on agg.day_of_week = d.dow
),
tz_now as (select (now() at time zone p_tz) as now_local),
today as (select now_local::date as d from tz_now),
intervals_today as (
  select a.start_time, a.end_time
  from public.nutritionist_availability a, today t
  where a.nutritionist_id = p_id
    and a.is_available
    and a.day_of_week = extract(isodow from t.d)
),
series as (
  select gs as slot_ts
  from intervals_today it, today t,
       generate_series(
         (t.d + it.start_time)::timestamp,
         (t.d + it.end_time)::timestamp - make_interval(mins => p_slot_minutes),
         make_interval(mins => p_slot_minutes)
       ) gs
),
future_today as (
  select to_char((slot_ts at time zone p_tz)::time, 'HH24:MI') as hhmm
  from series, tz_now
  where (slot_ts at time zone p_tz) >= now_local
    and not exists (
      select 1
      from public.teleconsulta_sessions ts
      where ts.nutritionist_id = p_id
        and ts.status in ('scheduled','in_progress')
        and date_trunc('minute', (ts.scheduled_at at time zone p_tz))
            = date_trunc('minute', (slot_ts at time zone p_tz))
    )
  order by hhmm
  limit p_max_today
),
user_email as (
  select u.email
  from prof p
  join public.users u on u.id = p.user_id
),
addr as (
  select
    coalesce(
      na.full_address,
      trim(both ' ' from
        concat_ws(' ',
          coalesce(na.street,''), coalesce(na.number,''),
          case when na.complement is not null and na.complement <> '' then '- '||na.complement else '' end,
          case when na.neighborhood is not null and na.neighborhood <> '' then '- '||na.neighborhood else '' end,
          case when na.city is not null and na.state is not null
               then '- '||na.city||'/'||na.state else '' end,
          case when na.zip_code is not null and na.zip_code <> '' then '- CEP '||na.zip_code else '' end
        )
      )
    ) as location
  from public.nutritionist_addresses na
  where na.nutritionist_id = p_id
    and na.status = 'active'
  order by
    na.is_main desc,
    case na.type when 'in_person' then 0
                 when 'hibrido' then 1
                 when 'teleconsultation' then 2
                 else 3 end,
    na.updated_at desc nulls last
  limit 1
),
certs as (
  -- IMPORTANTE: nutritionist_documents.nutritionist_id referencia users.id
  select coalesce(
           jsonb_agg(
             jsonb_build_object(
               'id', nd.id,
               'title', nd.title,
               'file_name', nd.file_name,
               'file_url', nd.file_url,
               'file_size', nd.file_size,
               'mime_type', nd.mime_type
             )
             order by nd.title nulls last, nd.file_name
           ),
           '[]'::jsonb
         ) as data
  from public.nutritionist_documents nd
  join prof p on p.user_id = nd.nutritionist_id
  where nd.document_type = 'certificate'
)
select
  np.id,
  np.full_name,
  (select * from user_email) as email,
  np.profile_image_url,
  np.cover_image_url,
  np.rating,
  np.consultation_price,
  coalesce( (select location from addr), np.address ) as location,
  np.is_verified,
  np.phone,
  np.academic_background,
  np.crn,
  np.experience_years,
  np.online_consultation_available,
  coalesce(specs.arr, '{}'::text[]) as specialties,
  np.bio,
  np.education,
  np.service_consultation_price,
  np.service_followup_price,
  np.service_meal_plan_price,
  coalesce((select array_agg(hhmm) from future_today), '{}'::text[]) as available_times,
  coalesce(week.data, '[]'::jsonb) as weekly_availability,
  (select data from certs) as certifications,
  np.instagram_username,
  np.linkedin_username,
  np.facebook_username,
  np.youtube_channel,
  np.tiktok_username,
  np.website_url,
  np.instagram,
  np.linkedin,
  np.website,
  np.public_price_visible,
  np.service_online_available,
  np.service_presential_available
from public.nutritionist_profiles np
left join specs on true
left join week  on true
where np.id = p_id;
$function$;

-- Grants and comment for the unified function
GRANT EXECUTE ON FUNCTION public.get_nutritionist_by_id(p_id UUID, p_tz TEXT, p_slot_minutes INTEGER, p_max_today INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_nutritionist_by_id(p_id UUID, p_tz TEXT, p_slot_minutes INTEGER, p_max_today INTEGER) TO anon;

COMMENT ON FUNCTION public.get_nutritionist_by_id(p_id UUID, p_tz TEXT, p_slot_minutes INTEGER, p_max_today INTEGER) IS 'Unified RPC to fetch public nutritionist profile by profile UUID; includes service availability and price visibility.';

