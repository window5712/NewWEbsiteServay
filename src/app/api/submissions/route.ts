import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { isValidPhone, isRequired, isValidUrl } from '@/lib/utils/validation'

export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient()

        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify admin role
        const response = await supabase
            .from('users')
            .select('role')
            .eq('id' as any, user.id as any)
            .single()

        const userData = response.data as any

        if (!userData || userData.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const dateFilter = searchParams.get('filter') || 'all'
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        let query = (supabase
            .from('submissions') as any)
            .select(`
        *,
        worker:users!worker_id(name, mall_name),
        survey:surveys(title)
      `, { count: 'exact' })

        // Apply date filter
        if (dateFilter !== 'all') {
            const now = new Date()
            let filterStartDate = new Date()

            if (dateFilter === 'today') {
                filterStartDate.setHours(0, 0, 0, 0)
            } else if (dateFilter === 'week') {
                filterStartDate.setDate(now.getDate() - 7)
            } else if (dateFilter === 'month') {
                filterStartDate.setMonth(now.getMonth() - 1)
            } else if (dateFilter === 'custom' && startDate && endDate) {
                query = query
                    .gte('created_at', new Date(startDate).toISOString())
                    .lte('created_at', new Date(endDate).toISOString())
            }

            if (dateFilter !== 'custom') {
                query = query.gte('created_at', filterStartDate.toISOString())
            }
        }

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
            submissions: data,
            total: count,
            page,
            totalPages: Math.ceil((count || 0) / limit),
        })
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

        // Verify worker role
        const userResponse = await supabase
            .from('users')
            .select('role')
            .eq('id' as any, user.id as any)
            .single()

        const userData = userResponse.data as any

        if (!userData || userData.role !== 'worker') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const {
            survey_id,
            customer_name,
            customer_phone,
            invoice_number,
            invoice_image_url,
            customer_image_url,
            answers,
        } = body

        // Validation
        if (!isRequired(survey_id)) {
            return NextResponse.json({ error: 'Survey ID is required' }, { status: 400 })
        }

        if (!isRequired(customer_name)) {
            return NextResponse.json({ error: 'Customer name is required' }, { status: 400 })
        }

        if (!isRequired(customer_phone)) {
            return NextResponse.json({ error: 'Customer phone is required' }, { status: 400 })
        }

        if (!isValidPhone(customer_phone)) {
            return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
        }

        if (!isRequired(invoice_number)) {
            return NextResponse.json({ error: 'Invoice number is required' }, { status: 400 })
        }

        if (!invoice_image_url || !isValidUrl(invoice_image_url)) {
            return NextResponse.json({ error: 'Invoice image is required' }, { status: 400 })
        }

        // Verify survey is active
        const { data: surveyData, error: surveyError } = await (supabase
            .from('surveys') as any)
            .select('is_active')
            .eq('id', survey_id)
            .single()

        if (surveyError || !surveyData) {
            return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
        }

        if (!surveyData.is_active) {
            return NextResponse.json({ error: 'Survey is not active' }, { status: 400 })
        }

        // Insert submission
        const { data: submissionData, error: submissionError } = await (supabase
            .from('submissions') as any)
            .insert({
                survey_id,
                worker_id: user.id,
                customer_name,
                customer_phone,
                invoice_number,
                invoice_image_url,
                customer_image_url: customer_image_url || null,
                answers,
            })
            .select()
            .single()

        if (submissionError) {
            // Check for duplicate invoice
            if (submissionError.code === '23505') {
                return NextResponse.json(
                    { error: 'This invoice number has already been submitted' },
                    { status: 409 }
                )
            }
            return NextResponse.json({ error: submissionError.message }, { status: 500 })
        }

        return NextResponse.json(submissionData, { status: 201 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
