'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

import { ArrowLeft, User, Phone, FileText, Image as ImageIcon, Calendar, Users, PieChart, Edit2, Plus, Trash2, Save, X, GripVertical } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'

interface Question {
    id: string
    question: string
    type: 'text' | 'radio' | 'checkbox'
    options: string[] | null
    required: boolean
    order_index: number
}

interface Submission {
    id: string
    created_at: string
    customer_name: string
    customer_phone: string
    cnic?: string
    invoice_number: string
    invoice_image_url: string
    customer_image_url: string | null
    answers: Record<string, any>
    worker_id: string
    users: {
        name: string
        mall_name: string
    }
}

interface WorkerStat {
    name: string
    mall_name: string
    count: number
}

export default function SurveyDetailPage() {
    const params = useParams()
    const id = params?.id as string
    const [survey, setSurvey] = useState<any>(null)
    const [questions, setQuestions] = useState<Question[]>([])
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [workerStats, setWorkerStats] = useState<WorkerStat[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null)
    const [isEditMode, setIsEditMode] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [editedQuestions, setEditedQuestions] = useState<Question[]>([])
    const supabase = createClient()

    useEffect(() => {
        const fetchSurveyDetails = async () => {
            if (!id) return

            setIsLoading(true)
            try {
                // Fetch survey details
                const { data: surveyData, error: surveyError } = await supabase
                    .from('surveys')
                    .select('*')
                    .eq('id', id)
                    .single()

                if (surveyError) throw surveyError
                setSurvey(surveyData)

                // Fetch survey questions
                const { data: questionsData, error: questionsError } = await supabase
                    .from('survey_questions')
                    .select('*')
                    .eq('survey_id', id)
                    .order('order_index', { ascending: true })

                if (questionsError) throw questionsError
                setQuestions(questionsData || [])
                setEditedQuestions(questionsData || [])

                // Fetch submissions with worker details
                const { data: submissionsData, error: submissionsError } = await supabase
                    .from('submissions')
                    .select('*, cnic, users(name, mall_name)')
                    .eq('survey_id', id)
                    .order('created_at', { ascending: false })

                if (submissionsError) throw submissionsError
                setSubmissions(submissionsData as any || [])

                // Calculate worker stats
                const statsMap = new Map<string, WorkerStat>()
                submissionsData?.forEach((sub: any) => {
                    const workerId = sub.worker_id
                    const workerName = sub.users?.name || 'Unknown'
                    const mallName = sub.users?.mall_name || 'Unknown'

                    if (statsMap.has(workerId)) {
                        statsMap.get(workerId)!.count++
                    } else {
                        statsMap.set(workerId, { name: workerName, mall_name: mallName, count: 1 })
                    }
                })
                setWorkerStats(Array.from(statsMap.values()).sort((a, b) => b.count - a.count))

            } catch (error) {
                console.error('Error fetching details:', error)
                toast.error('Failed to load survey details')
            } finally {
                setIsLoading(false)
            }
        }

        fetchSurveyDetails()
    }, [id, supabase])

    const handleAddQuestion = () => {
        const newQuestion: Question = {
            id: `temp-${Date.now()}`,
            question: '',
            type: 'text',
            options: null,
            required: false,
            order_index: editedQuestions.length
        }
        setEditedQuestions([...editedQuestions, newQuestion])
    }

    const handleUpdateQuestion = (index: number, field: keyof Question, value: any) => {
        const updated = [...editedQuestions]
        updated[index] = { ...updated[index], [field]: value }
        setEditedQuestions(updated)
    }

    const handleDeleteQuestion = (index: number) => {
        const updated = editedQuestions.filter((_, i) => i !== index)
        // Update order indices
        updated.forEach((q, i) => q.order_index = i)
        setEditedQuestions(updated)
    }

    const handleAddOption = (questionIndex: number) => {
        const updated = [...editedQuestions]
        const currentOptions = updated[questionIndex].options || []
        updated[questionIndex].options = [...currentOptions, '']
        setEditedQuestions(updated)
    }

    const handleUpdateOption = (questionIndex: number, optionIndex: number, value: string) => {
        const updated = [...editedQuestions]
        const options = [...(updated[questionIndex].options || [])]
        options[optionIndex] = value
        updated[questionIndex].options = options
        setEditedQuestions(updated)
    }

    const handleDeleteOption = (questionIndex: number, optionIndex: number) => {
        const updated = [...editedQuestions]
        const options = (updated[questionIndex].options || []).filter((_, i) => i !== optionIndex)
        updated[questionIndex].options = options.length > 0 ? options : null
        setEditedQuestions(updated)
    }

    const handleSaveQuestions = async () => {
        // Validate questions
        for (const q of editedQuestions) {
            if (!q.question.trim()) {
                toast.error('All questions must have text')
                return
            }
            if ((q.type === 'radio' || q.type === 'checkbox') && (!q.options || q.options.length === 0)) {
                toast.error('Multiple choice questions need at least one option')
                return
            }
        }

        setIsSaving(true)
        try {
            // Delete existing questions
            const { error: deleteError } = await supabase
                .from('survey_questions')
                .delete()
                .eq('survey_id', id)

            if (deleteError) throw deleteError

            // Insert updated questions (filter out temp IDs)
            const questionsToInsert = editedQuestions.map((q, index) => ({
                survey_id: id,
                question: q.question,
                type: q.type,
                options: (q.type === 'radio' || q.type === 'checkbox') ? q.options : null,
                required: q.required,
                order_index: index
            }))

            const { error: insertError } = await supabase
                .from('survey_questions')
                .insert(questionsToInsert)

            if (insertError) throw insertError

            // Refresh questions
            const { data: freshQuestions } = await supabase
                .from('survey_questions')
                .select('*')
                .eq('survey_id', id)
                .order('order_index', { ascending: true })

            setQuestions(freshQuestions || [])
            setEditedQuestions(freshQuestions || [])
            setIsEditMode(false)
            toast.success('Questions saved successfully!')
        } catch (error: any) {
            console.error('Error saving questions:', error)
            toast.error(error.message || 'Failed to save questions')
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancelEdit = () => {
        setEditedQuestions(questions)
        setIsEditMode(false)
    }

    // Create question map for displaying answers
    const questionMap = questions.reduce<Record<string, string>>((acc, q) => {
        acc[q.id] = q.question
        return acc
    }, {})

    if (isLoading) {
        return (
            <div className="p-4 md:p-8 flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!survey) {
        return (
            <div className="p-4 md:p-8 text-center">
                <h1 className="text-2xl font-bold text-gray-900">Survey not found</h1>
                <Link href="/admin/surveys" className="text-blue-600 hover:underline mt-4 inline-block">
                    Back to Surveys
                </Link>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8">
            <div className="mb-8">
                <Link href="/admin/surveys" className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Surveys
                </Link>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{survey.title}</h1>
                        <p className="text-gray-500 mt-2">
                            Created on {new Date(survey.created_at).toLocaleDateString()}
                        </p>
                    </div>
                    {!isEditMode && (
                        <Button
                            onClick={() => setIsEditMode(true)}
                            variant="outline"
                            size="md"
                        >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit Questions
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {/* Stats Card */}
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Submissions</p>
                            <p className="text-2xl font-bold text-gray-900">{submissions.length}</p>
                        </div>
                    </div>
                </div>

                {/* Worker Stats Table */}
                <div className="md:col-span-3 bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-gray-500" />
                        Worker Participation
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 font-medium">
                                <tr>
                                    <th className="px-4 py-2 rounded-l-lg">Worker</th>
                                    <th className="px-4 py-2">Mall</th>
                                    <th className="px-4 py-2 text-right rounded-r-lg">Submissions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {workerStats.map((stat, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 font-medium text-gray-900">{stat.name}</td>
                                        <td className="px-4 py-2 text-gray-600">{stat.mall_name}</td>
                                        <td className="px-4 py-2 text-right font-bold text-blue-600">{stat.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Questions Section */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Survey Questions</h2>
                    {isEditMode && (
                        <div className="flex gap-2">
                            <Button onClick={handleCancelEdit} variant="outline" size="sm">
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </Button>
                            <Button onClick={handleSaveQuestions} variant="primary" size="sm" isLoading={isSaving}>
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </Button>
                        </div>
                    )}
                </div>

                {isEditMode ? (
                    <div className="space-y-4">
                        {editedQuestions.map((question, qIndex) => (
                            <div key={qIndex} className="p-4 border border-gray-300 rounded-lg bg-gray-50 space-y-3">
                                <div className="flex items-start gap-2">
                                    <GripVertical className="w-5 h-5 text-gray-400 mt-2" />
                                    <div className="flex-1 space-y-3">
                                        <Input
                                            label={`Question ${qIndex + 1}`}
                                            value={question.question}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateQuestion(qIndex, 'question', e.target.value)}
                                            placeholder="Enter question text"
                                        />

                                        <div className="grid grid-cols-2 gap-3">
                                            <Select
                                                label="Type"
                                                value={question.type}
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleUpdateQuestion(qIndex, 'type', e.target.value as any)}
                                                options={[
                                                    { value: 'text', label: 'Text Input' },
                                                    { value: 'radio', label: 'Radio Buttons' },
                                                    { value: 'checkbox', label: 'Checkboxes' },
                                                ]}
                                            />

                                            <div className="flex items-end">
                                                <label className="flex items-center gap-2 pb-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={question.required}
                                                        onChange={(e) => handleUpdateQuestion(qIndex, 'required', e.target.checked)}
                                                        className="w-4 h-4 text-blue-600 rounded"
                                                    />
                                                    <span className="text-sm text-gray-700">Required</span>
                                                </label>
                                            </div>
                                        </div>

                                        {(question.type === 'radio' || question.type === 'checkbox') && (
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-700">Options</label>
                                                {(question.options || []).map((option, oIndex) => (
                                                    <div key={oIndex} className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={option}
                                                            onChange={(e) => handleUpdateOption(qIndex, oIndex, e.target.value)}
                                                            placeholder={`Option ${oIndex + 1}`}
                                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteOption(qIndex, oIndex)}
                                                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddOption(qIndex)}
                                                    className="text-sm text-blue-600 hover:text-blue-700"
                                                >
                                                    + Add Option
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteQuestion(qIndex)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        <Button onClick={handleAddQuestion} variant="outline" size="md">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Question
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {questions.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No questions added yet. Click &apos;Edit Questions&apos; to add questions.
                            </div>
                        ) : (
                            questions.map((question, index) => (
                                <div key={question.id} className="p-4 border border-gray-200 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                                            {index + 1}
                                        </span>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 mb-2">
                                                {question.question}
                                                {question.required && <span className="text-red-500 ml-1">*</span>}
                                            </p>
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <span className="px-2 py-1 bg-gray-100 rounded">
                                                    {question.type === 'text' ? 'Text Input' : question.type === 'radio' ? 'Single Choice' : 'Multiple Choice'}
                                                </span>
                                                {question.options && question.options.length > 0 && (
                                                    <span>{question.options.length} options</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Submissions List */}
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Submissions</h2>

            {submissions.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-lg shadow border border-gray-200 text-gray-500">
                    No submissions yet.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {submissions.map((submission) => (
                        <div key={submission.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                            <div className="p-6">
                                {/* Header Info */}
                                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-6 border-b border-gray-100 pb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <span className="font-semibold text-gray-900">{submission.customer_name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                                            <Phone className="w-4 h-4" />
                                            {submission.customer_phone}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <FileText className="w-4 h-4" />
                                            Invoice: {submission.invoice_number}
                                        </div>
                                    </div>

                                    <div className="text-right md:text-right">
                                        <div className="flex items-center gap-2 justify-end mb-1">
                                            <Users className="w-4 h-4 text-gray-400" />
                                            <span className="font-medium text-gray-900">{submission.users?.name}</span>
                                        </div>
                                        <p className="text-sm text-gray-500">{submission.users?.mall_name}</p>
                                        <div className="flex items-center gap-2 justify-end text-sm text-gray-500 mt-1">
                                            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs border border-gray-200">
                                                CNIC: {submission.cnic || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 justify-end text-sm text-gray-400 mt-1">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(submission.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                {/* Images Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                                        <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide flex items-center gap-1">
                                            <ImageIcon className="w-3 h-3" /> Invoice Image
                                        </p>
                                        <div className="relative h-48 w-full">
                                            <Image
                                                src={submission.invoice_image_url}
                                                alt="Invoice"
                                                fill
                                                className="object-contain rounded"
                                            />
                                        </div>
                                        <a href={submission.invoice_image_url} target="_blank" rel="noopener noreferrer" className="block text-center text-xs text-blue-600 mt-2 hover:underline">View Full Size</a>
                                    </div>
                                    {submission.customer_image_url && (
                                        <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                                            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide flex items-center gap-1">
                                                <ImageIcon className="w-3 h-3" /> Customer Image
                                            </p>
                                            <div className="relative h-48 w-full">
                                                <Image
                                                    src={submission.customer_image_url}
                                                    alt="Customer"
                                                    fill
                                                    className="object-contain rounded"
                                                />
                                            </div>
                                            <a href={submission.customer_image_url} target="_blank" rel="noopener noreferrer" className="block text-center text-xs text-blue-600 mt-2 hover:underline">View Full Size</a>
                                        </div>
                                    )}
                                </div>

                                {/* Collapsible Answers */}
                                <button
                                    onClick={() => setExpandedSubmission(expandedSubmission === submission.id ? null : submission.id)}
                                    className="w-full text-left text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors"
                                >
                                    {expandedSubmission === submission.id ? 'Hide Survey Answers' : 'Show Survey Answers'}
                                </button>

                                {expandedSubmission === submission.id && (
                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100 animate-slide-down">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Survey Responses</h4>
                                        <div className="space-y-3">
                                            {Object.entries(submission.answers).map(([questionId, answer], index) => {
                                                const questionText = questionMap[questionId] || questionId
                                                const formattedAnswer = Array.isArray(answer) ? answer.join(', ') : String(answer)

                                                return (
                                                    <div key={index} className="border-b border-gray-200 last:border-0 pb-2 last:pb-0">
                                                        <p className="text-sm font-medium text-gray-800">{questionText}</p>
                                                        <p className="text-sm text-gray-600 mt-1">{formattedAnswer}</p>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
