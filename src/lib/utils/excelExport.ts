import ExcelJS from 'exceljs'

export interface SubmissionExportData {
    id: string
    customer_name: string
    customer_phone: string
    cnic?: string
    invoice_number: string
    invoice_image_url: string
    customer_image_url: string | null
    worker_name: string
    mall_name: string
    survey_title: string
    answers: any
    question_map?: { [id: string]: string }
    created_at: string
}

/**
 * Generates Excel file from submission data
 * @param submissions - Array of submission data
 * @returns Excel buffer
 */
export async function generateExcel(submissions: SubmissionExportData[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Survey Submissions')

    // Define basic columns
    const columns: any[] = [
        { header: 'Submission ID', key: 'id', width: 15 },
        { header: 'Customer Name', key: 'customer_name', width: 20 },
        { header: 'Customer Phone', key: 'customer_phone', width: 15 },
        { header: 'CNIC', key: 'cnic', width: 20 },
        { header: 'Invoice Number', key: 'invoice_number', width: 18 },
        { header: 'Worker Name', key: 'worker_name', width: 20 },
        { header: 'Mall Name', key: 'mall_name', width: 20 },
        { header: 'Survey Title', key: 'survey_title', width: 25 },
    ]

    // Add dynamic question columns if available
    const questionIds: string[] = []
    if (submissions.length > 0 && submissions[0].question_map) {
        const questionMap = submissions[0].question_map
        Object.entries(questionMap).forEach(([id, text]) => {
            columns.push({ header: text, key: `q_${id}`, width: 30 })
            questionIds.push(id)
        })
    }

    // Add remaining standard columns
    columns.push(
        { header: 'All Answers (JSON)', key: 'answers', width: 50 },
        { header: 'Invoice Image URL', key: 'invoice_image_url', width: 40 },
        { header: 'Customer Image URL', key: 'customer_image_url', width: 40 },
        { header: 'Submission Date', key: 'created_at', width: 20 },
    )

    worksheet.columns = columns

    // Style header row
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4B5563' },
    }
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

    // Add data rows
    submissions.forEach((submission) => {
        const rowData: any = {
            id: submission.id,
            customer_name: submission.customer_name,
            customer_phone: submission.customer_phone,
            cnic: submission.cnic || 'N/A',
            invoice_number: submission.invoice_number,
            worker_name: submission.worker_name,
            mall_name: submission.mall_name,
            survey_title: submission.survey_title,
            answers: JSON.stringify(submission.answers, null, 2),
            invoice_image_url: submission.invoice_image_url,
            customer_image_url: submission.customer_image_url || 'N/A',
            created_at: new Date(submission.created_at).toLocaleString(),
        }

        // Fill dynamic question columns
        if (submission.question_map) {
            Object.keys(submission.question_map).forEach((qId) => {
                const answer = submission.answers[qId]
                rowData[`q_${qId}`] = Array.isArray(answer) ? answer.join(', ') : (answer || '')
            })
        }

        worksheet.addRow(rowData)
    })

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
}
