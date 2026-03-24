
CREATE OR REPLACE FUNCTION public.derive_corps_from_mission(_mission text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN _mission IN ('teacher_primary', 'inspector_primary') THEN 'primary'
    WHEN _mission IN ('teacher_middle', 'inspector_middle') THEN 'middle_school'
    WHEN _mission IN ('teacher_high', 'inspector_high') THEN 'high_school'
    ELSE 'primary'
  END;
$$;
