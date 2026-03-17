
-- Create office_position enum
CREATE TYPE public.office_position AS ENUM (
  'local_secretary',
  'deputy_secretary_primary',
  'deputy_secretary_middle',
  'deputy_secretary_high',
  'treasurer',
  'deputy_treasurer',
  'rapporteur',
  'deputy_rapporteur',
  'advisor'
);

-- Create local_offices table
CREATE TABLE public.local_offices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coordinator_id uuid NOT NULL,
  office_name text,
  secretary_photo_url text,
  academy text,
  directorate text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(coordinator_id)
);

ALTER TABLE public.local_offices ENABLE ROW LEVEL SECURITY;

-- Create local_office_members table
CREATE TABLE public.local_office_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id uuid NOT NULL REFERENCES public.local_offices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  position office_position NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(office_id, user_id)
);

ALTER TABLE public.local_office_members ENABLE ROW LEVEL SECURITY;

-- Create membership_cards table
CREATE TABLE public.membership_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id uuid NOT NULL REFERENCES public.local_offices(id) ON DELETE CASCADE,
  member_user_id uuid NOT NULL,
  card_number text,
  is_paid boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(office_id, member_user_id)
);

ALTER TABLE public.membership_cards ENABLE ROW LEVEL SECURITY;

-- Create office_finances table
CREATE TABLE public.office_finances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id uuid NOT NULL REFERENCES public.local_offices(id) ON DELETE CASCADE,
  total_collected numeric NOT NULL DEFAULT 0,
  remaining numeric NOT NULL DEFAULT 0,
  paid_to_provincial numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(office_id)
);

ALTER TABLE public.office_finances ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is the coordinator of an office
CREATE OR REPLACE FUNCTION public.is_office_coordinator(_office_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.local_offices
    WHERE id = _office_id AND coordinator_id = _user_id
  )
$$;

-- RLS for local_offices
CREATE POLICY "Coordinators can manage own office" ON public.local_offices
FOR ALL TO authenticated
USING (coordinator_id = auth.uid())
WITH CHECK (coordinator_id = auth.uid());

CREATE POLICY "Promoters can view offices" ON public.local_offices
FOR SELECT TO authenticated
USING (is_promoter(auth.uid()));

-- RLS for local_office_members
CREATE POLICY "Coordinators can manage own office members" ON public.local_office_members
FOR ALL TO authenticated
USING (is_office_coordinator(office_id, auth.uid()))
WITH CHECK (is_office_coordinator(office_id, auth.uid()));

CREATE POLICY "Promoters can view office members" ON public.local_office_members
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.local_offices lo WHERE lo.id = office_id AND is_promoter(auth.uid())));

-- RLS for membership_cards
CREATE POLICY "Coordinators can manage own office cards" ON public.membership_cards
FOR ALL TO authenticated
USING (is_office_coordinator(office_id, auth.uid()))
WITH CHECK (is_office_coordinator(office_id, auth.uid()));

CREATE POLICY "Promoters can view office cards" ON public.membership_cards
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.local_offices lo WHERE lo.id = office_id AND is_promoter(auth.uid())));

-- RLS for office_finances
CREATE POLICY "Coordinators can manage own office finances" ON public.office_finances
FOR ALL TO authenticated
USING (is_office_coordinator(office_id, auth.uid()))
WITH CHECK (is_office_coordinator(office_id, auth.uid()));

CREATE POLICY "Promoters can view office finances" ON public.office_finances
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.local_offices lo WHERE lo.id = office_id AND is_promoter(auth.uid())));

-- Storage bucket for office photos
INSERT INTO storage.buckets (id, name, public) VALUES ('office-photos', 'office-photos', true);

-- Storage RLS for office-photos bucket
CREATE POLICY "Coordinators can upload office photos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'office-photos' AND has_role(auth.uid(), 'local_coordinator'::app_role));

CREATE POLICY "Anyone can view office photos" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'office-photos');

CREATE POLICY "Coordinators can update office photos" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'office-photos' AND has_role(auth.uid(), 'local_coordinator'::app_role));

CREATE POLICY "Coordinators can delete office photos" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'office-photos' AND has_role(auth.uid(), 'local_coordinator'::app_role));

-- Updated_at triggers
CREATE TRIGGER update_local_offices_updated_at BEFORE UPDATE ON public.local_offices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_membership_cards_updated_at BEFORE UPDATE ON public.membership_cards
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_office_finances_updated_at BEFORE UPDATE ON public.office_finances
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
