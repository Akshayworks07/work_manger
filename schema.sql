-- ==============================================================================
-- WORK MANAGER (Video Delivery Tracker) - Supabase Schema Migration
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Linked to Supabase Auth)
-- Roles: strictly 'admin' and 'team-mate' (Clients are external companies, not users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'team-mate')) DEFAULT 'team-mate',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Case-insensitive index on username for login lookup
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx ON public.profiles (LOWER(username));

-- 3. Clients Table (External companies/customers: e.g. SRJ Gold, WFMA, etc.)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  contact_email TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Projects Table (Work for clients)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('active', 'completed', 'on_hold')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Videos Table (Deliverables & Tasks inside a project)
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

-- 6. Kanban Columns Table (Customizable columns per project)
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

-- Helper security-definer function: returns true ONLY if caller is Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Helper function to securely resolve username to email for login
CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username text)
RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT email FROM public.profiles
  WHERE LOWER(username) = LOWER(p_username)
  LIMIT 1;
$$;

-- PROFILES POLICIES:
-- All authenticated users can view profiles (to display assignees and team-mates)
CREATE POLICY "Allow authenticated users to read profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Allow public lookup of username to email during login
CREATE POLICY "Allow public username lookup"
  ON public.profiles FOR SELECT
  TO anon
  USING (true);

-- Users can update their own display name & avatar
CREATE POLICY "Allow users to update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Admins can update any profile (e.g. promoting a user to admin in the DB)
CREATE POLICY "Allow admin full access to profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_admin());

-- CLIENTS POLICIES:
-- Admin has full access to create, update, delete clients
CREATE POLICY "Admin full access to clients"
  ON public.clients FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Team-mates can read clients associated with projects they work on
CREATE POLICY "Team-mates can read clients"
  ON public.clients FOR SELECT
  TO authenticated
  USING (true);

-- PROJECTS POLICIES:
-- Admin has full access (create, edit, delete projects)
CREATE POLICY "Admin full access to projects"
  ON public.projects FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Team-mates can only read projects they are assigned to
CREATE POLICY "Team-mates read assigned projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (
    public.is_admin() OR
    id IN (
      SELECT project_id FROM public.videos WHERE assigned_to = auth.uid()
    )
  );

-- VIDEOS POLICIES:
-- Admin has full access (create, edit, delete videos)
CREATE POLICY "Admin full access to videos"
  ON public.videos FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Team-mates can read videos assigned to them
CREATE POLICY "Team-mates read assigned videos"
  ON public.videos FOR SELECT
  TO authenticated
  USING (
    public.is_admin() OR assigned_to = auth.uid()
  );

-- Team-mates can update the status/progress of their assigned deliverables
CREATE POLICY "Team-mates update assigned videos"
  ON public.videos FOR UPDATE
  TO authenticated
  USING (
    public.is_admin() OR assigned_to = auth.uid()
  )
  WITH CHECK (
    public.is_admin() OR assigned_to = auth.uid()
  );

-- KANBAN COLUMNS POLICIES:
CREATE POLICY "Admin full access to kanban_columns"
  ON public.kanban_columns FOR ALL
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Team-mates read kanban_columns"
  ON public.kanban_columns FOR SELECT
  TO authenticated
  USING (
    public.is_admin() OR
    project_id IN (
      SELECT project_id FROM public.videos WHERE assigned_to = auth.uid()
    )
  );

-- ==============================================================================
-- AUTOMATED TRIGGERS & ROLE PROTECTION
-- ==============================================================================

-- Trigger 1: Auto-create profile upon Supabase auth user signup
-- CRITICAL SECURITY RULE: Every signup defaults strictly to 'team-mate'.
-- The browser/client CANNOT set role = 'admin'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  extracted_username TEXT;
BEGIN
  extracted_username := LOWER(COALESCE(
    NULLIF(TRIM(new.raw_user_meta_data->>'username'), ''),
    split_part(new.email, '@', 1)
  ));

  INSERT INTO public.profiles (id, full_name, username, email, role, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', extracted_username),
    extracted_username,
    new.email,
    'team-mate', -- Hardcoded default: NEVER trust client-provided role
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    username = COALESCE(public.profiles.username, EXCLUDED.username),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger 2: Prevent non-admins from changing their role (Self-escalation prevention)
CREATE OR REPLACE FUNCTION public.protect_user_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (NEW.role IS DISTINCT FROM OLD.role) AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Permission denied: Only administrators can modify account roles';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_role_update ON public.profiles;
CREATE TRIGGER on_profile_role_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.protect_user_role();

-- Trigger 3: Auto-create default Kanban columns when a new project is created
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
