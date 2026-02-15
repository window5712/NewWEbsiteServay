import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

async function applyFix() {
    console.log('Applying RLS recursion fix...')

    // We can use the 'rpc' method if we have a function to run raw SQL, 
    // but usually Supabase doesn't have one by default for security.
    // However, we can use the 'pg_query' if it exists or just tell the user.

    // Wait! In this environment, I can't easily run arbitrary SQL through the API 
    // without a pre-existing RPC function.

    // Let's check if we can fix it by just updating the policies via the API? No, policies can't be created via PostgREST.

    console.log('Please run the following SQL in your Supabase SQL Editor:')
    console.log(`
        -- 1. Create a function to check user role without recursion
        CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
        RETURNS TEXT AS $$
        BEGIN
            RETURN (SELECT role FROM public.users WHERE id = user_id);
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- 2. Drop the recursive policy
        DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
        DROP POLICY IF EXISTS "Users can read own data" ON public.users;

        -- 3. Create non-recursive policies
        CREATE POLICY "Users can read own data"
            ON public.users FOR SELECT
            USING (auth.uid() = id);

        CREATE POLICY "Admins can read all users"
            ON public.users
            FOR SELECT
            USING (public.get_user_role(auth.uid()) = 'admin');

        -- 4. Fix other recursive policies
        DROP POLICY IF EXISTS "Admins can read all surveys" ON public.surveys;
        CREATE POLICY "Admins can read all surveys"
            ON public.surveys FOR SELECT
            USING (public.get_user_role(auth.uid()) = 'admin');

        DROP POLICY IF EXISTS "Admins can manage surveys" ON public.surveys;
        CREATE POLICY "Admins can manage surveys"
            ON public.surveys FOR ALL
            USING (public.get_user_role(auth.uid()) = 'admin');

        DROP POLICY IF EXISTS "Admins can manage questions" ON public.survey_questions;
        CREATE POLICY "Admins can manage questions"
            ON public.survey_questions FOR ALL
            USING (public.get_user_role(auth.uid()) = 'admin');

        DROP POLICY IF EXISTS "Admins can read all submissions" ON public.submissions;
        CREATE POLICY "Admins can read all submissions"
            ON public.submissions FOR SELECT
            USING (public.get_user_role(auth.uid()) = 'admin');
    `)
}

applyFix()
