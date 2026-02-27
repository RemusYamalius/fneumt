-- Add promoted_by to track who assigned each role
ALTER TABLE public.user_roles ADD COLUMN promoted_by uuid;