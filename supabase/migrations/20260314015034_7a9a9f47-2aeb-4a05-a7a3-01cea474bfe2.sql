
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'developer');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create ai_tools table
CREATE TABLE public.ai_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  logo_url TEXT,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  key_features TEXT[],
  trust_score INTEGER DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 100),
  safety_score INTEGER DEFAULT 0 CHECK (safety_score >= 0 AND safety_score <= 100),
  rating NUMERIC(2,1) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'rejected')),
  price_free TEXT,
  price_paid TEXT,
  polygon_tx_hash TEXT,
  submitted_by UUID REFERENCES auth.users(id),
  last_checked TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create ai_stacks table
CREATE TABLE public.ai_stacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  creator_id UUID REFERENCES auth.users(id),
  save_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create ai_stack_tools junction table
CREATE TABLE public.ai_stack_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stack_id UUID NOT NULL REFERENCES public.ai_stacks(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES public.ai_tools(id) ON DELETE CASCADE,
  UNIQUE (stack_id, tool_id)
);

-- Create user_saved_stacks
CREATE TABLE public.user_saved_stacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stack_id UUID NOT NULL REFERENCES public.ai_stacks(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, stack_id)
);

-- Create user_bookmarks
CREATE TABLE public.user_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES public.ai_tools(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tool_id)
);

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_tools_updated_at
  BEFORE UPDATE ON public.ai_tools FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_stacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_stack_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_saved_stacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- User roles
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- AI Tools
CREATE POLICY "Active tools viewable by all" ON public.ai_tools
  FOR SELECT TO authenticated USING (status = 'active');
CREATE POLICY "Admins see all tools" ON public.ai_tools
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Developers see own submissions" ON public.ai_tools
  FOR SELECT TO authenticated USING (submitted_by = auth.uid());
CREATE POLICY "Authenticated users can submit tools" ON public.ai_tools
  FOR INSERT TO authenticated WITH CHECK (submitted_by = auth.uid());
CREATE POLICY "Admins can update tools" ON public.ai_tools
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete tools" ON public.ai_tools
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- AI Stacks
CREATE POLICY "Stacks viewable by all" ON public.ai_stacks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage stacks" ON public.ai_stacks
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create stacks" ON public.ai_stacks
  FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid());

-- Stack tools
CREATE POLICY "Stack tools viewable by all" ON public.ai_stack_tools
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage stack tools" ON public.ai_stack_tools
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User saved stacks
CREATE POLICY "Users see own saved stacks" ON public.user_saved_stacks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users save stacks" ON public.user_saved_stacks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unsave stacks" ON public.user_saved_stacks
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- User bookmarks
CREATE POLICY "Users see own bookmarks" ON public.user_bookmarks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create bookmarks" ON public.user_bookmarks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete bookmarks" ON public.user_bookmarks
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_ai_tools_category ON public.ai_tools(category);
CREATE INDEX idx_ai_tools_status ON public.ai_tools(status);
CREATE INDEX idx_ai_tools_submitted_by ON public.ai_tools(submitted_by);
CREATE INDEX idx_user_bookmarks_user ON public.user_bookmarks(user_id);
CREATE INDEX idx_user_bookmarks_tool ON public.user_bookmarks(tool_id);
