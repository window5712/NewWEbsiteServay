'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { ChevronLeft, ChevronRight, Eye, X, User, Phone, FileText, Calendar, Users, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface Question {
    id: string
    question: string
    type: 'text' | 'radio' | 'checkbox'
    options: string[] | null
    required: boolean
}

interface Submission {
    id: string
    customer_name: string
    customer_phone: string
    cnic?: string
    invoice_number: string
    invoice_image_url: string
    customer_image_url: string | null
    answers: any
    created_at: string
    worker: { name: string; mall_name: string }
    survey: { title: string; id: string }
}

export default function SubmissionsPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [dateFilter, setDateFilter] = useState('all')
    const [customStartDate, setCustomStartDate] = useState('')
    const [customEndDate, setCustomEndDate] = useState('')
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
    const [submissionQuestions, setSubmissionQuestions] = useState<Question[]>([])
    const supabase = createClient()
    const ITEMS_PER_PAGE = 50

    const fetchSubmissions = useCallback(async () => {
        setIsLoading(true)
        try {
            let query = (supabase
                .from('submissions') as any)
                .select(`
          *,
          cnic,
          worker:users!worker_id(name, mall_name),
          survey:surveys(title, id)
        `, { count: 'exact' })

            // Apply date filter
            if (dateFilter !== 'all') {
                const now = new Date()
                let startDate = new Date()

                if (dateFilter === 'today') {
                    startDate.setHours(0, 0, 0, 0)
                } else if (dateFilter === 'week') {
                    startDate.setDate(now.getDate() - 7)
                } else if (dateFilter === 'month') {
                    startDate.setMonth(now.getMonth() - 1)
                } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
                    query = query
                        .gte('created_at', new Date(customStartDate).toISOString())
                        .lte('created_at', new Date(customEndDate).toISOString())
                }

                if (dateFilter !== 'custom') {
                    query = query.gte('created_at', startDate.toISOString())
                }
            }

            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1)

            if (error) throw error

            setSubmissions(data || [])
            setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE))
        } catch (error) {
            console.error('Error fetching submissions:', error)
        } finally {
            setIsLoading(false)
        }
    }, [supabase, currentPage, dateFilter, customStartDate, customEndDate, ITEMS_PER_PAGE])

    useEffect(() => {
        fetchSubmissions()
    }, [fetchSubmissions])

    const handleViewDetails = async (submission: Submission) => {
        setSelectedSubmission(submission)

        // Fetch questions for this survey
        try {
            const { data: questionsData } = await supabase
                .from('survey_questions')
                .select('*')
                .eq('survey_id', submission.survey.id)
                .order('order_index', { ascending: true })

            setSubmissionQuestions(questionsData || [])
        } catch (error) {
            console.error('Error fetching questions:', error)
        }
    }

    const closeModal = () => {
        setSelectedSubmission(null)
        setSubmissionQuestions([])
    }

    // Create question map for the selected submission
    const questionMap = submissionQuestions.reduce<Record<string, string>>((acc, q) => {
        acc[q.id] = q.question
        return acc
    }, {})

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Submissions</h1>

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select
                        label="Date Range"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        options={[
                            { value: 'all', label: 'All Time' },
                            { value: 'today', label: 'Today' },
                            { value: 'week', label: 'Last 7 Days' },
                            { value: 'month', label: 'Last 30 Days' },
                            { value: 'custom', label: 'Custom Range' },
                        ]}
                    />

                    {dateFilter === 'custom' && (
                        <>
                            <Input
                                label="Start Date"
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                            />
                            <Input
                                label="End Date"
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                            />
                        </>
                    )}
                </div>
                {dateFilter === 'custom' && (
                    <Button
                        onClick={() => fetchSubmissions()}
                        className="mt-4"
                        variant="primary"
                        size="sm"
                    >
                        Apply Filter
                    </Button>
                )}
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : submissions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <p className="text-gray-500 text-lg">No submissions found</p>
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Phone
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        CNIC
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Invoice
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Worker
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Mall
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Survey
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {submissions.map((submission) => (
                                    <tr key={submission.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {submission.customer_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {submission.customer_phone}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                            {submission.cnic || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {submission.invoice_number}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {submission.worker.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {submission.worker.mall_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {submission.survey.title}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(submission.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <button
                                                onClick={() => handleViewDetails(submission)}
                                                className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center mt-6">
                            <p className="text-sm text-gray-700">
                                Page {currentPage} of {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    variant="outline"
                                    size="sm"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                    Previous
                                </Button>
                                <Button
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    variant="outline"
                                    size="sm"
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Detail Modal */}
            {selectedSubmission && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10">
                            <h2 className="text-2xl font-bold text-gray-900">Submission Details</h2>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Customer & Worker Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Customer Info */}
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                                    <h3 className="text-sm font-semibold text-blue-900 mb-3 uppercase tracking-wide">Customer Information</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-medium text-gray-900">{selectedSubmission.customer_name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm text-gray-700">{selectedSubmission.customer_phone}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm text-gray-700 font-mono">CNIC: {selectedSubmission.cnic || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm text-gray-700">Invoice: {selectedSubmission.invoice_number}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Worker Info */}
                                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                                    <h3 className="text-sm font-semibold text-green-900 mb-3 uppercase tracking-wide">Worker Information</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-green-600" />
                                            <span className="text-sm font-medium text-gray-900">{selectedSubmission.worker.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-green-600" />
                                            <span className="text-sm text-gray-700">{selectedSubmission.worker.mall_name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-green-600" />
                                            <span className="text-sm text-gray-700">{selectedSubmission.survey.title}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-green-600" />
                                            <span className="text-sm text-gray-700">{new Date(selectedSubmission.created_at).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Images */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                    <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide flex items-center gap-1">
                                        <ImageIcon className="w-3 h-3" /> Invoice Image
                                    </p>
                                    <div className="relative h-64 w-full">
                                        <Image
                                            src={selectedSubmission.invoice_image_url}
                                            alt="Invoice"
                                            fill
                                            className="object-contain rounded"
                                        />
                                    </div>
                                    <a
                                        href={selectedSubmission.invoice_image_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block text-center text-xs text-blue-600 mt-2 hover:underline"
                                    >
                                        View Full Size
                                    </a>
                                </div>
                                {selectedSubmission.customer_image_url && (
                                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                        <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide flex items-center gap-1">
                                            <ImageIcon className="w-3 h-3" /> Customer Image
                                        </p>
                                        <div className="relative h-64 w-full">
                                            <Image
                                                src={selectedSubmission.customer_image_url}
                                                alt="Customer"
                                                fill
                                                className="object-contain rounded"
                                            />
                                        </div>
                                        <a
                                            href={selectedSubmission.customer_image_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block text-center text-xs text-blue-600 mt-2 hover:underline"
                                        >
                                            View Full Size
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Survey Answers */}
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Survey Responses</h3>
                                <div className="space-y-4">
                                    {Object.entries(selectedSubmission.answers).map(([questionId, answer], index) => {
                                        const questionText = questionMap[questionId] || questionId
                                        const formattedAnswer = Array.isArray(answer) ? answer.join(', ') : String(answer)

                                        return (
                                            <div key={index} className="bg-white p-3 rounded border border-gray-200">
                                                <p className="text-sm font-medium text-gray-800 mb-1">{questionText}</p>
                                                <p className="text-sm text-gray-600">{formattedAnswer}</p>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
