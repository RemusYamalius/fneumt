ALTER TABLE public.profiles ADD COLUMN is_member boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN membership_card_number text DEFAULT NULL;