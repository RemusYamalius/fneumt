
-- 1) Drop the dangerous anon policy on requests
DROP POLICY IF EXISTS "Anyone can search by tracking number" ON public.requests;

-- 2) Create a secure RPC function that returns only safe columns
CREATE OR REPLACE FUNCTION public.search_by_tracking(_tracking text)
RETURNS TABLE(
  tracking_number text,
  status public.request_status,
  created_at timestamptz,
  category public.request_category,
  resolution_level text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT r.tracking_number, r.status, r.created_at, r.category, r.resolution_level
  FROM public.requests r
  WHERE r.tracking_number = _tracking
  LIMIT 1;
$$;

-- 3) Fix search_path for email queue functions
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$ SELECT pgmq.send(queue_name, payload); $$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$ SELECT msg_id, read_ct, message FROM pgmq.read(queue_name, vt, batch_size); $$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$ SELECT pgmq.delete(queue_name, message_id); $$;
