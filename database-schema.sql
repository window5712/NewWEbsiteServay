-- Mall Survey System Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'worker')),
  mall_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Surveys table
CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Survey questions table
CREATE TABLE IF NOT EXISTS survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'radio', 'checkbox')),
  options JSONB,
  required BOOLEAN DEFAULT false,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id),
  worker_id UUID NOT NULL REFERENCES users(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_image_url TEXT NOT NULL,
  customer_image_url TEXT,
  answers JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_submissions_invoice ON submissions(invoice_number);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_submissions_worker_id ON submissions(worker_id);
CREATE INDEX IF NOT EXISTS idx_submissions_survey_id ON submissions(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_questions_survey_id ON survey_questions(survey_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- 1. Create a function to check user role without recursion
-- Using SECURITY DEFINER to bypass RLS checks on the users table
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM public.users WHERE id = user_id;
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Helper function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_user_role(auth.uid()) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Users policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own data' AND tablename = 'users') THEN
        CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read all users' AND tablename = 'users') THEN
        CREATE POLICY "Admins can read all users" ON users FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');
    END IF;
END
$$;

-- Surveys policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Everyone can read active surveys' AND tablename = 'surveys') THEN
        CREATE POLICY "Everyone can read active surveys" ON surveys FOR SELECT USING (is_active = true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read all surveys' AND tablename = 'surveys') THEN
        CREATE POLICY "Admins can read all surveys" ON surveys FOR SELECT USING (public.is_admin());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage surveys' AND tablename = 'surveys') THEN
        CREATE POLICY "Admins can manage surveys" ON surveys FOR ALL USING (public.is_admin());
    END IF;
END
$$;

-- Survey questions policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Everyone can read questions for active surveys' AND tablename = 'survey_questions') THEN
        CREATE POLICY "Everyone can read questions for active surveys" ON survey_questions FOR SELECT USING (
            EXISTS (SELECT 1 FROM surveys WHERE id = survey_id AND is_active = true)
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage questions' AND tablename = 'survey_questions') THEN
        CREATE POLICY "Admins can manage questions" ON survey_questions FOR ALL USING (public.is_admin());
    END IF;
END
$$;

-- Submissions policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Workers can read own submissions' AND tablename = 'submissions') THEN
        CREATE POLICY "Workers can read own submissions" ON submissions FOR SELECT USING (worker_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Workers can create submissions' AND tablename = 'submissions') THEN
        CREATE POLICY "Workers can create submissions" ON submissions FOR INSERT WITH CHECK (worker_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read all submissions' AND tablename = 'submissions') THEN
        CREATE POLICY "Admins can read all submissions" ON submissions FOR SELECT USING (public.is_admin());
    END IF;
END
$$;

-- Storage bucket for images
-- Note: storage.buckets might not exist in all environments or might have different schema
-- We try to insert only if the project uses Supabase storage
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('survey-uploads', 'survey-uploads', true)
        ON CONFLICT (id) DO NOTHING;
    END IF;
END
$$;

-- Storage policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload' AND tablename = 'objects' AND schemaname = 'storage') THEN
            CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (
                bucket_id = 'survey-uploads' AND auth.role() = 'authenticated'
            );
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read access' AND tablename = 'objects' AND schemaname = 'storage') THEN
            CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'survey-uploads');
        END IF;
    END IF;
END
$$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_surveys_updated_at ON surveys;
CREATE TRIGGER update_surveys_updated_at
    BEFORE UPDATE ON surveys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- New User Sync Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, mall_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'worker', -- Default role
    'Unknown Mall' -- Default mall
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
