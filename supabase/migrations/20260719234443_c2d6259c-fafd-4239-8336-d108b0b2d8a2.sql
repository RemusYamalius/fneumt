
-- Membership cards: let a member view their own card
CREATE POLICY "Members can view own card"
ON public.membership_cards
FOR SELECT
TO authenticated
USING (member_user_id = auth.uid());

-- Publisher settings: replace broad read with scoped read
DROP POLICY IF EXISTS "Anyone can read publisher settings" ON public.publisher_settings;

CREATE POLICY "Read publisher settings of publishers or self"
ON public.publisher_settings
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_promoter(user_id)
);
