-- 1. First, drop the problematic policies to break the loop
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Users can read own data" ON public.users;

-- 2. Ensure the role-checking function is SECURITY DEFINER and non-recursive
-- It should run as the owner (postgres) which bypasses RLS
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Using a direct query on public.users. Since this is SECURITY DEFINER,
    -- it bypasses RLS and won't trigger the infinite recursion.
    SELECT role INTO user_role FROM public.users WHERE id = user_id;
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Create the "read own data" policy (safe, as it doesn't call a function)
CREATE POLICY "Users can read own data" ON public.users
FOR SELECT USING (auth.uid() = id);

-- 4. Create the admin policy using the SECURITY DEFINER function
-- This is now safe because get_user_role bypasses RLS.
CREATE POLICY "Admins can read all users" ON public.users
FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

-- 5. Create a helper function for other tables to use
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_user_role(auth.uid()) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Update other tables to use is_admin() for consistency and efficiency
-- Surveys
DROP POLICY IF EXISTS "Admins can read all surveys" ON surveys;
CREATE POLICY "Admins can read all surveys" ON surveys FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage surveys" ON surveys;
CREATE POLICY "Admins can manage surveys" ON surveys FOR ALL USING (public.is_admin());

-- Survey Questions
DROP POLICY IF EXISTS "Admins can manage questions" ON survey_questions;
CREATE POLICY "Admins can manage questions" ON survey_questions FOR ALL USING (public.is_admin());

-- Submissions
DROP POLICY IF EXISTS "Admins can read all submissions" ON submissions;
CREATE POLICY "Admins can read all submissions" ON submissions FOR SELECT USING (public.is_admin());
