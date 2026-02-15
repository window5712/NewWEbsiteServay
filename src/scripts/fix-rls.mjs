import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixRLS() {
    const sql = `
        -- 1. Create a function to check user role without recursion
        CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
        RETURNS TEXT AS $$
        BEGIN
            RETURN (SELECT role FROM public.users WHERE id = user_id);
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- 2. Drop the recursive policy
        DROP POLICY IF EXISTS "Admins can read all users" ON public.users;

        -- 3. Create a non-recursive policy
        CREATE POLICY "Admins can read all users"
            ON public.users
            FOR SELECT
            USING (public.get_user_role(auth.uid()) = 'admin');

        -- 4. Fix other recursive policies if any
        DROP POLICY IF EXISTS "Admins can read all surveys" ON public.surveys;
        CREATE POLICY "Admins can read all surveys"
            ON public.surveys
            FOR SELECT
            USING (public.get_user_role(auth.uid()) = 'admin');

        DROP POLICY IF EXISTS "Admins can manage surveys" ON public.surveys;
        CREATE POLICY "Admins can manage surveys"
            ON public.surveys
            FOR ALL
            USING (public.get_user_role(auth.uid()) = 'admin');

        DROP POLICY IF EXISTS "Admins can manage questions" ON public.survey_questions;
        CREATE POLICY "Admins can manage questions"
            ON public.survey_questions
            FOR ALL
            USING (public.get_user_role(auth.uid()) = 'admin');

        DROP POLICY IF EXISTS "Admins can read all submissions" ON public.submissions;
        CREATE POLICY "Admins can read all submissions"
            ON public.submissions
            FOR SELECT
            USING (public.get_user_role(auth.uid()) = 'admin');
    `
    // Supabase JS doesn't have a direct raw SQL method for security reasons in the client.
    // However, we can use the RPC or just inform the user if we can't run it.
    // Wait, I can use the Supabase REST API to run SQL if I have a specific endpoint or use a trick.
    // Actually, I'll just check if I can run it via a temporary function or something.
    console.log('SQL to run in Supabase SQL Editor:')
    console.log(sql)
}

fixRLS()
