
-- Add membership_verified column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS membership_verified boolean DEFAULT false;

-- Create a security definer function to check if user is deputy local in same area
CREATE OR REPLACE FUNCTION public.is_same_area_deputy(_user_id uuid, _target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles dp ON dp.user_id = ur.user_id
    JOIN public.profiles tp ON tp.user_id = _target_user_id
    WHERE ur.user_id = _user_id
      AND ur.role IN ('deputy_local_primary', 'deputy_local_middle', 'deputy_local_high')
      AND dp.academy = tp.academy
      AND dp.directorate = tp.directorate
  )
$$;

-- RLS policy: deputy local coordinators can update is_member and membership_verified for users in same area
CREATE POLICY "Deputies can update membership status"
ON public.profiles
FOR UPDATE
USING (public.is_same_area_deputy(auth.uid(), user_id))
WITH CHECK (public.is_same_area_deputy(auth.uid(), user_id));
