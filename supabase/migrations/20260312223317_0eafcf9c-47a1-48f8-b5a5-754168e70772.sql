CREATE OR REPLACE FUNCTION public.notify_join_request_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status != 'pending' THEN
    INSERT INTO public.notifications (user_id, title, message, link)
    VALUES (NEW.user_id, 'تحديث طلب الانضمام', 
      CASE NEW.status
        WHEN 'contacted' THEN 'تم التواصل معك بخصوص طلب انضمامك'
        WHEN 'accepted' THEN 'تم قبول طلب انضمامك'
        WHEN 'rejected' THEN 'تم رفض طلب انضمامك'
      END, '/dashboard');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_join_request_status_change
  AFTER UPDATE ON public.join_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_join_request_status_change();