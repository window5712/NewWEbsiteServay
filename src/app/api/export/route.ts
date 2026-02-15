import { createServerClient } from '../../../lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateExcel, SubmissionExportData } from '../../../lib/utils/excelExport'

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
        const dateFilter = searchParams.get('filter') || 'all'
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        let query = (supabase
            .from('submissions') as any)
            .select(`
        *,
        worker:users!worker_id(name, mall_name),
        survey:surveys(title)
      `)

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

        const { data, error } = await query.order('created_at', { ascending: false })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Transform data for export
        const exportData: SubmissionExportData[] = (data || []).map((submission: any) => ({
            id: submission.id,
            customer_name: submission.customer_name,
            customer_phone: submission.customer_phone,
            cnic: submission.cnic,
            invoice_number: submission.invoice_number,
            invoice_image_url: submission.invoice_image_url,
            customer_image_url: submission.customer_image_url,
            worker_name: submission.worker.name,
            mall_name: submission.worker.mall_name,
            survey_title: submission.survey.title,
            answers: submission.answers,
            created_at: submission.created_at,
        }))

        // Generate Excel file
        const excelBuffer = await generateExcel(exportData)

        return new NextResponse(new Uint8Array(excelBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=survey-submissions-${new Date().toISOString().split('T')[0]}.xlsx`,
            },
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
