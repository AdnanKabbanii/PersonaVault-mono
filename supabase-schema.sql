-- =============================================
-- PersonaVault minimal Supabase-safe schema
-- (no ownership changes to auth.users; uses RPC to onboard)
-- Automatic user profile creation via database trigger
-- =============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- CORE TABLES
-- =============================================

-- Users table extending auth.users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspaces
CREATE TABLE IF NOT EXISTS public.user_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enforce a single default workspace per user
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_default_workspace
  ON public.user_workspaces(user_id)
  WHERE is_default;

-- Documents
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES public.user_workspaces(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  source_file TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  chunk_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing','completed','failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document chunks
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES public.user_workspaces(id) ON DELETE CASCADE NOT NULL,
  chunk_index INTEGER NOT NULL,
  total_chunks INTEGER NOT NULL,
  text_content TEXT NOT NULL,
  token_count INTEGER,
  qdrant_vector_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_user_workspaces_user_id ON public.user_workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_workspace_id ON public.documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_user_id ON public.document_chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_workspace_id ON public.document_chunks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON public.document_chunks(document_id);

-- =============================================
-- ROW LEVEL SECURITY ENABLE
-- =============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES (idempotent checks)
-- =============================================

-- public.users policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'self_select_users'
      AND schemaname = 'public'
      AND tablename = 'users'
  ) THEN
    EXECUTE '
      CREATE POLICY "self_select_users" ON public.users
        FOR SELECT USING (auth.uid() = id)
    ';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'self_insert_users'
      AND schemaname = 'public'
      AND tablename = 'users'
  ) THEN
    EXECUTE '
      CREATE POLICY "self_insert_users" ON public.users
        FOR INSERT WITH CHECK (auth.uid() = id)
    ';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'self_update_users'
      AND schemaname = 'public'
      AND tablename = 'users'
  ) THEN
    EXECUTE '
      CREATE POLICY "self_update_users" ON public.users
        FOR UPDATE USING (auth.uid() = id)
    ';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- public.user_workspaces policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'self_select_user_workspaces'
      AND schemaname = 'public'
      AND tablename = 'user_workspaces'
  ) THEN
    EXECUTE '
      CREATE POLICY "self_select_user_workspaces" ON public.user_workspaces
        FOR SELECT USING (auth.uid() = user_id)
    ';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'self_insert_user_workspaces'
      AND schemaname = 'public'
      AND tablename = 'user_workspaces'
  ) THEN
    EXECUTE '
      CREATE POLICY "self_insert_user_workspaces" ON public.user_workspaces
        FOR INSERT WITH CHECK (auth.uid() = user_id)
    ';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'self_update_user_workspaces'
      AND schemaname = 'public'
      AND tablename = 'user_workspaces'
  ) THEN
    EXECUTE '
      CREATE POLICY "self_update_user_workspaces" ON public.user_workspaces
        FOR UPDATE USING (auth.uid() = user_id)
    ';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'self_delete_user_workspaces'
      AND schemaname = 'public'
      AND tablename = 'user_workspaces'
  ) THEN
    EXECUTE '
      CREATE POLICY "self_delete_user_workspaces" ON public.user_workspaces
        FOR DELETE USING (auth.uid() = user_id)
    ';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- public.documents policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'self_select_documents'
      AND schemaname = 'public'
      AND tablename = 'documents'
  ) THEN
    EXECUTE '
      CREATE POLICY "self_select_documents" ON public.documents
        FOR SELECT USING (auth.uid() = user_id)
    ';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'self_insert_documents'
      AND schemaname = 'public'
      AND tablename = 'documents'
  ) THEN
    EXECUTE '
      CREATE POLICY "self_insert_documents" ON public.documents
        FOR INSERT WITH CHECK (auth.uid() = user_id)
    ';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'self_update_documents'
      AND schemaname = 'public'
      AND tablename = 'documents'
  ) THEN
    EXECUTE '
      CREATE POLICY "self_update_documents" ON public.documents
        FOR UPDATE USING (auth.uid() = user_id)
    ';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'self_delete_documents'
      AND schemaname = 'public'
      AND tablename = 'documents'
  ) THEN
    EXECUTE '
      CREATE POLICY "self_delete_documents" ON public.documents
        FOR DELETE USING (auth.uid() = user_id)
    ';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- public.document_chunks policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'self_select_document_chunks'
      AND schemaname = 'public'
      AND tablename = 'document_chunks'
  ) THEN
    EXECUTE '
      CREATE POLICY "self_select_document_chunks" ON public.document_chunks
        FOR SELECT USING (auth.uid() = user_id)
    ';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'self_insert_document_chunks'
      AND schemaname = 'public'
      AND tablename = 'document_chunks'
  ) THEN
    EXECUTE '
      CREATE POLICY "self_insert_document_chunks" ON public.document_chunks
        FOR INSERT WITH CHECK (auth.uid() = user_id)
    ';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'self_update_document_chunks'
      AND schemaname = 'public'
      AND tablename = 'document_chunks'
  ) THEN
    EXECUTE '
      CREATE POLICY "self_update_document_chunks" ON public.document_chunks
        FOR UPDATE USING (auth.uid() = user_id)
    ';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'self_delete_document_chunks'
      AND schemaname = 'public'
      AND tablename = 'document_chunks'
  ) THEN
    EXECUTE '
      CREATE POLICY "self_delete_document_chunks" ON public.document_chunks
        FOR DELETE USING (auth.uid() = user_id)
    ';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- UTILITY FUNCTIONS & TRIGGERS
-- =============================================

-- updated_at trigger helper
CREATE OR REPLACE FUNCTION public.set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- AUTOMATIC USER PROFILE CREATION TRIGGER
-- =============================================

-- Function to automatically create user profile and default workspace
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile (bypass RLS for this function)
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Create default workspace (bypass RLS for this function)
  INSERT INTO public.user_workspaces (user_id, name, description, is_default)
  VALUES (NEW.id, 'Default Workspace', 'Auto-created default workspace', true);
  
  RAISE NOTICE 'Automatically created profile and default workspace for user %', NEW.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGER ATTACHMENT
-- =============================================

-- Attach the trigger to automatically create profiles on user signup
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Attach updated_at triggers if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'users_updated_at_trg') THEN
    CREATE TRIGGER users_updated_at_trg
      BEFORE UPDATE ON public.users
      FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'user_workspaces_updated_at_trg') THEN
    CREATE TRIGGER user_workspaces_updated_at_trg
      BEFORE UPDATE ON public.user_workspaces
      FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'documents_updated_at_trg') THEN
    CREATE TRIGGER documents_updated_at_trg
      BEFORE UPDATE ON public.documents
      FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'document_chunks_updated_at_trg') THEN
    CREATE TRIGGER document_chunks_updated_at_trg
      BEFORE UPDATE ON public.document_chunks
      FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();
  END IF;
END;
$$ LANGUAGE plpgsql;

-- RPC: upsert user + ensure default workspace (FIXED VERSION)
CREATE OR REPLACE FUNCTION public.upsert_user_and_default_workspace(
  _id UUID,
  _email TEXT,
  _full_name TEXT DEFAULT NULL,
  _avatar_url TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  _workspace_id UUID;
BEGIN
  -- Check if user exists in auth.users first
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _id) THEN
    RAISE EXCEPTION 'User % does not exist in auth.users', _id;
  END IF;

  -- Upsert user profile (bypass RLS for this function)
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (_id, _email, _full_name, _avatar_url)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW();

  -- Ensure default workspace exists (bypass RLS for this function)
  INSERT INTO public.user_workspaces (user_id, name, description, is_default)
  SELECT _id, 'Default Workspace', 'Auto-created default workspace', true
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_workspaces uw
    WHERE uw.user_id = _id AND uw.is_default = true
  )
  RETURNING id INTO _workspace_id;

  -- Log success
  RAISE NOTICE 'User % and default workspace created/updated successfully', _id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- END OF SCRIPT
-- =============================================
