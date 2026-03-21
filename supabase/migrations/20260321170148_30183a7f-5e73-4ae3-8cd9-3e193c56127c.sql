CREATE OR REPLACE VIEW public.post_with_author AS
SELECT p.id, p.author_id, p.content, p.created_at, p.filters, p.updated_at,
       pr.full_name as author_name
FROM public.posts p
LEFT JOIN public.profiles pr ON pr.user_id = p.author_id;