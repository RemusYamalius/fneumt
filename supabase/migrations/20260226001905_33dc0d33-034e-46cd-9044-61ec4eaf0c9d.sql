
-- Migrate existing union_officer users to teacher
UPDATE public.user_roles SET role = 'teacher' WHERE role = 'union_officer';

-- Create a function to check if a user can promote
CREATE OR REPLACE FUNCTION public.is_promoter(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'regional_supervisor', 'deputy_regional_primary', 'deputy_regional_middle', 'deputy_regional_high', 'provincial_manager', 'deputy_provincial_primary', 'deputy_provincial_middle', 'deputy_provincial_high', 'local_coordinator')
  )
$$;

-- Allow promoters to read profiles
CREATE POLICY "Promoters can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_promoter(auth.uid()));

-- Allow promoters to read all roles
CREATE POLICY "Promoters can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_promoter(auth.uid()));

-- Allow promoters to update roles
CREATE POLICY "Promoters can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.is_promoter(auth.uid()))
WITH CHECK (public.is_promoter(auth.uid()));
