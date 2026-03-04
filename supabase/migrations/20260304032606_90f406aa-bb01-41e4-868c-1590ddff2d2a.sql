
-- Rename enum values for request_status
ALTER TYPE public.request_status RENAME VALUE 'received' TO 'viewed';
ALTER TYPE public.request_status RENAME VALUE 'processing' TO 'in_progress';
ALTER TYPE public.request_status RENAME VALUE 'resolved' TO 'accepted';
ALTER TYPE public.request_status RENAME VALUE 'rejected' TO 'cancelled';
