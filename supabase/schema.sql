-- ==============================================================================
-- VIDEO DELIVERY TRACKER - Supabase Schema Migration
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  role TEXT CHECK (role IN ('admin', 'client')) DEFAULT 'client',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Clients Table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  contact_email TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('active', 'completed', 'on_hold')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Videos Table (Deliverables)
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'review', 'revision', 'delivered')) DEFAULT 'not_started',
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  thumbnail_url TEXT,
  due_date DATE,
  delivered_at TIMESTAMPTZ,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Kanban Columns Table (Customizable per project)
CREATE TABLE IF NOT EXISTS public.kanban_columns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  position INTEGER DEFAULT 0
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;

-- Helper security-definer function to check if current user is admin without recursive RLS loop
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- PROFILES POLICIES:
CREATE POLICY "Allow authenticated users to read profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow users to update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Allow admin full access to profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_admin());

-- CLIENTS POLICIES:
CREATE POLICY "Admin full access to clients"
  ON public.clients FOR ALL
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Client read own client record"
  ON public.clients FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- PROJECTS POLICIES:
CREATE POLICY "Admin full access to projects"
  ON public.projects FOR ALL
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Client read own projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE owner_id = auth.uid()
    )
  );

-- VIDEOS POLICIES:
CREATE POLICY "Admin full access to videos"
  ON public.videos FOR ALL
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Client read own videos"
  ON public.videos FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT p.id FROM public.projects p
      JOIN public.clients c ON p.client_id = c.id
      WHERE c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Client update own videos"
  ON public.videos FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT p.id FROM public.projects p
      JOIN public.clients c ON p.client_id = c.id
      WHERE c.owner_id = auth.uid()
    )
  );

-- KANBAN COLUMNS POLICIES:
CREATE POLICY "Admin full access to kanban_columns"
  ON public.kanban_columns FOR ALL
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Client read own kanban_columns"
  ON public.kanban_columns FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT p.id FROM public.projects p
      JOIN public.clients c ON p.client_id = c.id
      WHERE c.owner_id = auth.uid()
    )
  );

-- ==============================================================================
-- AUTOMATED TRIGGERS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'client'),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION public.create_default_kanban_columns()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.kanban_columns (project_id, name, position) VALUES
    (NEW.id, 'Not Started', 0),
    (NEW.id, 'In Progress', 1),
    (NEW.id, 'Review', 2),
    (NEW.id, 'Revision', 3),
    (NEW.id, 'Delivered', 4);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_project_created ON public.projects;
CREATE TRIGGER on_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE PROCEDURE public.create_default_kanban_columns();

-- ==============================================================================
-- STORAGE BUCKETS (Thumbnails and Video Deliverables)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('thumbnails', 'thumbnails', true),
  ('deliverables', 'deliverables', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read thumbnails"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'thumbnails');

CREATE POLICY "Authenticated users can upload thumbnails"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'thumbnails');

CREATE POLICY "Authenticated users can manage deliverables"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'deliverables');
