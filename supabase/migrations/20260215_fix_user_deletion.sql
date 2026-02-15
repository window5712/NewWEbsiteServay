-- Migration to fix user deletion issues
-- This allows deleting a worker while preserving their survey submissions

-- 1. Modify the submissions table: make worker_id nullable and set ON DELETE SET NULL
ALTER TABLE public.submissions 
  DROP CONSTRAINT IF EXISTS submissions_worker_id_fkey,
  ALTER COLUMN worker_id DROP NOT NULL,
  ADD CONSTRAINT submissions_worker_id_fkey 
    FOREIGN KEY (worker_id) 
    REFERENCES public.users(id) 
    ON DELETE SET NULL;

-- 2. Improve the handle_new_user trigger to handle potential conflicts better
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, mall_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'worker'),
    COALESCE(NEW.raw_user_meta_data->>'mall_name', 'Unknown Mall')
  )
  ON CONFLICT (email) DO UPDATE SET
    id = EXCLUDED.id,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    mall_name = EXCLUDED.mall_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
