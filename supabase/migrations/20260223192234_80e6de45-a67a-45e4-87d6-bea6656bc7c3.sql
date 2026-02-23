
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('teacher', 'union_officer', 'admin');
CREATE TYPE public.request_category AS ENUM ('medical_file','mohammed_vi_foundation','promotions','transfer','assets','subscriptions','scholarships');
CREATE TYPE public.request_status AS ENUM ('submitted','received','processing','resolved','rejected');
CREATE TYPE public.corps_type AS ENUM ('primary','middle_school','high_school','administrative');

-- TABLES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT, employee_number TEXT, corps corps_type, institution TEXT,
  phone TEXT, email TEXT, zone TEXT,
  academy TEXT DEFAULT 'الدار البيضاء-سطات', directorate TEXT DEFAULT 'سيدي بنور',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'teacher',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number TEXT NOT NULL UNIQUE DEFAULT ('REQ-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category request_category NOT NULL, subject TEXT NOT NULL, description TEXT,
  status request_status NOT NULL DEFAULT 'submitted',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.request_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
  old_status request_status, new_status request_status NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.request_status_history ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL, file_path TEXT NOT NULL, file_size INTEGER, mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  content TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL, message TEXT, is_read BOOLEAN NOT NULL DEFAULT false, link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER FUNCTIONS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_request_owner(_request_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.requests WHERE id = _request_id AND user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_assigned_officer(_request_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.requests WHERE id = _request_id AND assigned_to = _user_id)
$$;

-- TRIGGERS
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON public.requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'teacher');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS: PROFILES
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- RLS: USER_ROLES
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: REQUESTS
CREATE POLICY "Users can view own requests" ON public.requests FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Officers can view assigned requests" ON public.requests FOR SELECT TO authenticated USING (assigned_to = auth.uid());
CREATE POLICY "Admins can view all requests" ON public.requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create own requests" ON public.requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can update any request" ON public.requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Officers can update assigned requests" ON public.requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'union_officer') AND assigned_to = auth.uid());
CREATE POLICY "Anyone can search by tracking number" ON public.requests FOR SELECT TO anon USING (true);

-- RLS: STATUS HISTORY
CREATE POLICY "Request owners can view status history" ON public.request_status_history FOR SELECT TO authenticated USING (public.is_request_owner(request_id, auth.uid()));
CREATE POLICY "Officers can view assigned request history" ON public.request_status_history FOR SELECT TO authenticated USING (public.is_assigned_officer(request_id, auth.uid()));
CREATE POLICY "Admins can view all status history" ON public.request_status_history FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert status history" ON public.request_status_history FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Officers can insert status history" ON public.request_status_history FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'union_officer') AND public.is_assigned_officer(request_id, auth.uid()));

-- RLS: ATTACHMENTS
CREATE POLICY "Request owners can view attachments" ON public.attachments FOR SELECT TO authenticated USING (public.is_request_owner(request_id, auth.uid()));
CREATE POLICY "Officers can view assigned attachments" ON public.attachments FOR SELECT TO authenticated USING (public.is_assigned_officer(request_id, auth.uid()));
CREATE POLICY "Admins can view all attachments" ON public.attachments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can upload attachments to own requests" ON public.attachments FOR INSERT TO authenticated WITH CHECK (public.is_request_owner(request_id, auth.uid()));

-- RLS: COMMENTS
CREATE POLICY "Request owners can view comments" ON public.comments FOR SELECT TO authenticated USING (public.is_request_owner(request_id, auth.uid()));
CREATE POLICY "Officers can view and add comments" ON public.comments FOR ALL TO authenticated USING (public.is_assigned_officer(request_id, auth.uid())) WITH CHECK (public.is_assigned_officer(request_id, auth.uid()) AND user_id = auth.uid());
CREATE POLICY "Admins can manage all comments" ON public.comments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: NOTIFICATIONS
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- STORAGE
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', false);
CREATE POLICY "Users can upload to own folder" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins can view all files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'attachments' AND public.has_role(auth.uid(), 'admin'));
