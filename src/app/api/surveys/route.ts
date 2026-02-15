import { createServerClient } from '../../../lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient()

        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch user role
        const { data: userData, error: userError } = await (supabase
            .from('users') as any)
            .select('role')
            .eq('id', user.id)
            .single()

        if (userError) {
            return NextResponse.json({ error: userError.message }, { status: 500 })
        }

        const role = userData?.role;

        if (role === 'worker') {
            const { data, error } = await (supabase
                .from('surveys') as any)
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 })
            }
            return NextResponse.json(data)
        }

        // For admin or other roles, fetch all surveys
        const { data: surveys, error } = await (supabase
            .from('surveys') as any)
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(surveys)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = createServerClient()

        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify admin role
        const { data: userData } = await (supabase
            .from('users') as any)
            .select('role')
            .eq('id', user.id)
            .single()

        if (!userData || userData.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { title, questions } = body

        if (!title || !questions || questions.length === 0) {
            return NextResponse.json(
                { error: 'Title and questions are required' },
                { status: 400 }
            )
        }

        // Create survey
        const { data: survey, error: surveyError } = await (supabase
            .from('surveys') as any)
            .insert({ title, is_active: false })
            .select()
            .single()

        if (surveyError) {
            return NextResponse.json({ error: surveyError.message }, { status: 500 })
        }

        // Create questions
        const questionsToInsert = questions.map((q: any, index: number) => ({
            survey_id: survey.id,
            question: q.question,
            type: q.type,
            options: q.type === 'radio' || q.type === 'checkbox' ? q.options : null,
            required: q.required || false,
            order_index: index,
        }))

        const { error: questionsError } = await (supabase
            .from('survey_questions') as any)
            .insert(questionsToInsert)

        if (questionsError) {
            // Rollback survey creation
            await (supabase.from('surveys') as any).delete().eq('id', survey.id)
            return NextResponse.json({ error: questionsError.message }, { status: 500 })
        }

        return NextResponse.json(survey, { status: 201 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
