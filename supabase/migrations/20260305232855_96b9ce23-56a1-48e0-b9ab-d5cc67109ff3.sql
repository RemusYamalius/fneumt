-- Add new values to request_category enum
ALTER TYPE public.request_category ADD VALUE IF NOT EXISTS 'rank_promotion';
ALTER TYPE public.request_category ADD VALUE IF NOT EXISTS 'grade_promotion';
ALTER TYPE public.request_category ADD VALUE IF NOT EXISTS 'schedules';
ALTER TYPE public.request_category ADD VALUE IF NOT EXISTS 'infrastructure';
ALTER TYPE public.request_category ADD VALUE IF NOT EXISTS 'financial_compensation';
ALTER TYPE public.request_category ADD VALUE IF NOT EXISTS 'zone_compensation';
ALTER TYPE public.request_category ADD VALUE IF NOT EXISTS 'equipment';
ALTER TYPE public.request_category ADD VALUE IF NOT EXISTS 'grievances';
ALTER TYPE public.request_category ADD VALUE IF NOT EXISTS 'assignments';
ALTER TYPE public.request_category ADD VALUE IF NOT EXISTS 'inspection_score';
ALTER TYPE public.request_category ADD VALUE IF NOT EXISTS 'other';