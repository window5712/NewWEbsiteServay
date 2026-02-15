'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '../../../../lib/supabase/client'
import { isValidPhone, isValidCNIC, isRequired } from '../../../../lib/utils/validation'
import Input from '../../../../components/ui/Input'
import Button from '../../../../components/ui/Button'
import ImageUpload from '../../../../components/worker/ImageUpload'
import { ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'

interface Question {
    id: string
    question: string
    type: 'text' | 'radio' | 'checkbox'
    options: string[] | null
    required: boolean
    order_index: number
}

interface Survey {
    id: string
    title: string
    is_active: boolean
}

export default function SurveySubmissionPage() {
    const params = useParams()
    const router = useRouter()
    const supabase = createClient()

    const [survey, setSurvey] = useState<Survey | null>(null)
    const [questions, setQuestions] = useState<Question[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form state
    const [customerName, setCustomerName] = useState('')
    const [customerPhone, setCustomerPhone] = useState('')
    const [customerCnic, setCustomerCnic] = useState('')
    const [invoiceNumber, setInvoiceNumber] = useState('')
    const [invoiceImageUrl, setInvoiceImageUrl] = useState('')
    const [customerImageUrl, setCustomerImageUrl] = useState('')
    const [answers, setAnswers] = useState<{ [key: string]: any }>({})
    const [errors, setErrors] = useState<{ [key: string]: string }>({})

    const fetchSurveyData = useCallback(async () => {
        try {
            // Fetch survey
            const { data: surveyData, error: surveyError } = await (supabase
                .from('surveys') as any)
                .select('*')
                .eq('id', params.id as string)
                .single()

            if (surveyError) throw surveyError

            if (!surveyData.is_active) {
                throw new Error('This survey is not active')
            }

            setSurvey(surveyData)

            // Fetch questions
            const { data: questionsData, error: questionsError } = await (supabase
                .from('survey_questions') as any)
                .select('*')
                .eq('survey_id', params.id as string)
                .order('order_index', { ascending: true })

            if (questionsError) throw questionsError
            setQuestions(questionsData || [])
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch survey')
        } finally {
            setIsLoading(false)
        }
    }, [supabase, params.id])

    useEffect(() => {
        fetchSurveyData()
    }, [fetchSurveyData])

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {}

        if (!isRequired(customerName)) {
            newErrors.customerName = 'Customer name is required'
        }

        if (!isRequired(customerPhone)) {
            newErrors.customerPhone = 'Phone number is required'
        } else if (!isValidPhone(customerPhone)) {
            newErrors.customerPhone = 'Invalid phone number (must be 11 digits starting with 03)'
        }

        if (!isRequired(customerCnic)) {
            newErrors.customerCnic = 'CNIC is required'
        } else if (!isValidCNIC(customerCnic)) {
            newErrors.customerCnic = 'Invalid CNIC format (e.g., 13101-2345678-9)'
        }

        if (!isRequired(invoiceNumber)) {
            newErrors.invoiceNumber = 'Invoice number is required'
        }

        if (!invoiceImageUrl) {
            newErrors.invoiceImage = 'Invoice image is required'
        }

        // Validate required questions
        questions.forEach((question) => {
            if (question.required && !answers[question.id]) {
                newErrors[`question_${question.id}`] = 'This field is required'
            }
        })

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        setIsSubmitting(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                throw new Error('Not authenticated')
            }

            const { error } = await (supabase
                .from('submissions') as any)
                .insert({
                    survey_id: params.id as string,
                    worker_id: user.id,
                    customer_name: customerName,
                    customer_phone: customerPhone,
                    cnic: customerCnic,
                    invoice_number: invoiceNumber,
                    invoice_image_url: invoiceImageUrl,
                    customer_image_url: customerImageUrl || null,
                    answers: answers,
                })

            if (error) {
                // Check for duplicate invoice
                if (error.code === '23505') {
                    throw new Error('This invoice number has already been submitted')
                }
                throw error
            }

            toast.success('Survey submitted successfully!')

            // Reset form
            setTimeout(() => {
                window.location.href = '/worker'
            }, 2000)
        } catch (err: any) {
            toast.error(err.message || 'Failed to submit survey')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '')
        if (value.length > 13) value = value.slice(0, 13)

        // Auto-format: 12345-1234567-1
        if (value.length > 5 && value.length <= 12) {
            value = `${value.slice(0, 5)}-${value.slice(5)}`
        } else if (value.length > 12) {
            value = `${value.slice(0, 5)}-${value.slice(5, 12)}-${value.slice(12)}`
        }

        setCustomerCnic(value)
    }

    const handleAnswerChange = (questionId: string, value: any) => {
        setAnswers({ ...answers, [questionId]: value })
        // Clear error for this question
        const newErrors = { ...errors }
        delete newErrors[`question_${questionId}`]
        setErrors(newErrors)
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!survey) {
        return (
            <div className="p-4 max-w-2xl mx-auto">
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <p className="text-red-700">Survey not found</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 max-w-2xl mx-auto pb-20">
            <button
                onClick={() => router.push('/worker')}
                className="flex items-center text-blue-600 mb-4 hover:text-blue-700"
            >
                <ChevronLeft className="w-5 h-5" />
                Back to Surveys
            </button>

            <h1 className="text-2xl font-bold text-gray-900 mb-6">{survey.title}</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Information */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Customer Information</h2>

                    <Input
                        label="Customer Name"
                        type="text"
                        value={customerName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerName(e.target.value)}
                        error={errors.customerName}
                        required
                        placeholder="Enter customer name"
                    />

                    <Input
                        label="Customer Phone"
                        type="tel"
                        value={customerPhone}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerPhone(e.target.value)}
                        error={errors.customerPhone}
                        required
                        placeholder="Enter 11-digit phone number (03...)"
                    />

                    <Input
                        label="Customer CNIC"
                        type="text"
                        value={customerCnic}
                        onChange={handleCnicChange}
                        error={errors.customerCnic}
                        required
                        placeholder="13101-2345678-9"
                        maxLength={15}
                    />

                    <Input
                        label="Invoice Number"
                        type="text"
                        value={invoiceNumber}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvoiceNumber(e.target.value)}
                        error={errors.invoiceNumber}
                        required
                        placeholder="Enter invoice number"
                    />
                </div>

                {/* Image Uploads */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Upload Images</h2>

                    <ImageUpload
                        label="Invoice Image"
                        required
                        folder="invoice"
                        onUploadComplete={(url: string) => {
                            setInvoiceImageUrl(url)
                            const newErrors = { ...errors }
                            delete newErrors.invoiceImage
                            setErrors(newErrors)
                        }}
                    />
                    {errors.invoiceImage && (
                        <p className="text-sm text-red-600">{errors.invoiceImage}</p>
                    )}

                    <ImageUpload
                        label="Customer Photo (Optional)"
                        folder="customer"
                        onUploadComplete={setCustomerImageUrl}
                    />
                </div>

                {/* Survey Questions */}
                {questions.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900">Survey Questions</h2>

                        {questions.map((question) => (
                            <div key={question.id} className="bg-white p-4 rounded-lg border border-gray-200">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {question.question}
                                    {question.required && <span className="text-red-500 ml-1">*</span>}
                                </label>

                                {question.type === 'text' && (
                                    <input
                                        type="text"
                                        value={answers[question.id] || ''}
                                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter your answer"
                                    />
                                )}

                                {question.type === 'radio' && question.options && (
                                    <div className="space-y-2">
                                        {(question.options as string[]).map((option, index) => (
                                            <label key={index} className="flex items-center space-x-3 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name={question.id}
                                                    value={option}
                                                    checked={answers[question.id] === option}
                                                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                                    className="w-5 h-5 text-blue-600"
                                                />
                                                <span className="text-gray-700">{option}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {question.type === 'checkbox' && question.options && (
                                    <div className="space-y-2">
                                        {(question.options as string[]).map((option, index) => (
                                            <label key={index} className="flex items-center space-x-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    value={option}
                                                    checked={(answers[question.id] || []).includes(option)}
                                                    onChange={(e) => {
                                                        const currentAnswers = answers[question.id] || []
                                                        const newAnswers = e.target.checked
                                                            ? [...currentAnswers, option]
                                                            : currentAnswers.filter((a: string) => a !== option)
                                                        handleAnswerChange(question.id, newAnswers)
                                                    }}
                                                    className="w-5 h-5 text-blue-600 rounded"
                                                />
                                                <span className="text-gray-700">{option}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {errors[`question_${question.id}`] && (
                                    <p className="mt-2 text-sm text-red-600">{errors[`question_${question.id}`]}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isSubmitting}
                    className="w-full"
                >
                    Submit Survey
                </Button>
            </form>
        </div>
    )
}
