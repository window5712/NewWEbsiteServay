'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { createClient } from '../../lib/supabase/client'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import { toast } from 'sonner'

interface Question {
    id: string
    question: string
    type: 'text' | 'radio' | 'checkbox'
    options: string[]
    required: boolean
}

export default function SurveyForm({ onSuccess }: { onSuccess: () => void }) {
    const [title, setTitle] = useState('')
    const [questions, setQuestions] = useState<Question[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const supabase = createClient()

    const addQuestion = () => {
        const newQuestion: Question = {
            id: `q-${Date.now()}`,
            question: '',
            type: 'text',
            options: [],
            required: false,
        }
        setQuestions([...questions, newQuestion])
    }

    const updateQuestion = (id: string, field: keyof Question, value: any) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q))
    }

    const removeQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id))
    }

    const addOption = (questionId: string) => {
        setQuestions(questions.map(q =>
            q.id === questionId ? { ...q, options: [...q.options, ''] } : q
        ))
    }

    const updateOption = (questionId: string, index: number, value: string) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                const newOptions = [...q.options]
                newOptions[index] = value
                return { ...q, options: newOptions }
            }
            return q
        }))
    }

    const removeOption = (questionId: string, index: number) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                return { ...q, options: q.options.filter((_, i) => i !== index) }
            }
            return q
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) {
            toast.error('Survey title is required')
            return
        }

        if (questions.length === 0) {
            toast.error('Add at least one question')
            return
        }

        // Validate questions
        for (const q of questions) {
            if (!q.question.trim()) {
                toast.error('All questions must have text')
                return
            }
            if ((q.type === 'radio' || q.type === 'checkbox') && q.options.length === 0) {
                toast.error(`Question needs at least one option`)
                return
            }
        }

        setIsSubmitting(true)

        try {
            // Create survey
            const { data: surveyData, error: surveyError } = await (supabase
                .from('surveys') as any)
                .insert({ title, is_active: false })
                .select()
                .single()

            if (surveyError) throw surveyError

            // Create questions
            const questionsToInsert = questions.map((q, index) => ({
                survey_id: surveyData.id,
                question: q.question,
                type: q.type,
                options: (q.type === 'radio' || q.type === 'checkbox') ? q.options : null,
                required: q.required,
                order_index: index,
            }))

            const { error: questionsError } = await (supabase
                .from('survey_questions') as any)
                .insert(questionsToInsert)

            if (questionsError) throw questionsError

            // Reset form
            setTitle('')
            setQuestions([])
            toast.success('Survey created successfully!')
            onSuccess()
        } catch (err: any) {
            toast.error(err.message || 'Failed to create survey')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Input
                label="Survey Title"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                placeholder="Enter survey title"
                required
            />

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
                    <Button type="button" onClick={addQuestion} variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Question
                    </Button>
                </div>

                {questions.map((question, qIndex) => (
                    <div key={question.id} className="p-4 border border-gray-300 rounded-lg bg-gray-50 space-y-3">
                        <div className="flex items-start gap-2">
                            <GripVertical className="w-5 h-5 text-gray-400 mt-2" />
                            <div className="flex-1 space-y-3">
                                <Input
                                    label={`Question ${qIndex + 1}`}
                                    value={question.question}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateQuestion(question.id, 'question', e.target.value)}
                                    placeholder="Enter question text"
                                />

                                <div className="grid grid-cols-2 gap-3">
                                    <Select
                                        label="Type"
                                        value={question.type}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateQuestion(question.id, 'type', e.target.value as any)}
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
                                                onChange={(e) => updateQuestion(question.id, 'required', e.target.checked)}
                                                className="w-4 h-4 text-blue-600 rounded"
                                            />
                                            <span className="text-sm text-gray-700">Required</span>
                                        </label>
                                    </div>
                                </div>

                                {(question.type === 'radio' || question.type === 'checkbox') && (
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Options</label>
                                        {question.options.map((option, oIndex) => (
                                            <div key={oIndex} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={option}
                                                    onChange={(e) => updateOption(question.id, oIndex, e.target.value)}
                                                    placeholder={`Option ${oIndex + 1}`}
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeOption(question.id, oIndex)}
                                                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => addOption(question.id)}
                                            className="text-sm text-blue-600 hover:text-blue-700"
                                        >
                                            + Add Option
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => removeQuestion(question.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}

                {questions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No questions added yet. Click &apos;Add Question&apos; to get started.
                    </div>
                )}
            </div>

            <div className="flex gap-3">
                <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting}>
                    Create Survey
                </Button>
            </div>
        </form>
    )
}
