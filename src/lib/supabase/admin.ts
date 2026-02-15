import { createClient } from '@supabase/supabase-js'

export const createAdminClient = () => {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceKey) {
        console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing from environment variables. Admin operations will fail.')
    }

    if (!url) {
        console.error('CRITICAL: NEXT_PUBLIC_SUPABASE_URL is missing from environment variables.')
    }

    return createClient(
        url!,
        serviceKey!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}
