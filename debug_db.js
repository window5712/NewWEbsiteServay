const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function check() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('Checking connection...');

    try {
        const { count: surveysCount, error: surveysError } = await supabase
            .from('surveys')
            .select('*', { count: 'exact', head: true });

        if (surveysError) console.error('Surveys error:', surveysError);
        else console.log('Surveys count:', surveysCount);

        const { count: submissionsCount, error: submissionsError } = await supabase
            .from('submissions')
            .select('*', { count: 'exact', head: true });

        if (submissionsError) console.error('Submissions error:', submissionsError);
        else console.log('Submissions count:', submissionsCount);

        const { data: latestSubmissions, error: listError } = await supabase
            .from('submissions')
            .select('id, created_at')
            .limit(5);

        if (listError) console.error('List error:', listError);
        else console.log('Latest 5 submissions:', latestSubmissions);

    } catch (err) {
        console.error('Fatal error:', err);
    }
}

check();
