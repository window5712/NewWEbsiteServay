'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Power, PowerOff, BarChart2, Users, FileText, MoreVertical, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Survey {
    id: string
    title: string
    is_active: boolean
    created_at: string
    stats?: {
        responseCount: number
        workerCount: number
    }
}

export default function SurveysPage() {
    const [surveys, setSurveys] = useState<Survey[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [newSurveyTitle, setNewSurveyTitle] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const fetchSurveys = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('surveys')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            const surveysWithStats = await Promise.all((data || []).map(async (survey: any) => {
                const { count } = await supabase
                    .from('submissions')
                    .select('*', { count: 'exact', head: true })
                    .eq('survey_id', survey.id)

                const { data: submissions } = await supabase
                    .from('submissions')
                    .select('worker_id')
                    .eq('survey_id', survey.id)

                const uniqueWorkers = new Set(submissions?.map((s: any) => s.worker_id)).size

                return {
                    ...survey,
                    stats: {
                        responseCount: count || 0,
                        workerCount: uniqueWorkers || 0
                    }
                }
            }))

            setSurveys(surveysWithStats)
        } catch (error) {
            console.error('Error fetching surveys:', error)
        } finally {
            setIsLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        fetchSurveys()
    }, [fetchSurveys])

    const toggleSurveyStatus = async (surveyId: string, currentStatus: boolean) => {
        try {
            const { error } = await (supabase
                .from('surveys') as any)
                .update({ is_active: !currentStatus })
                .eq('id', surveyId)

            if (error) throw error
            fetchSurveys()
        } catch (error) {
            console.error('Error updating survey:', error)
        }
    }

    const handleCreateSurvey = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsCreating(true)
        try {
            const { data, error } = await supabase
                .from('surveys')
                .insert({ title: newSurveyTitle })
                .select()
                .single()

            if (error) throw error

            setNewSurveyTitle('')
            setIsCreateModalOpen(false)
            fetchSurveys()
            router.push(`/admin/surveys/${data.id}`)
        } catch (error) {
            console.error('Error creating survey:', error)
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <div className="p-4 md:p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Surveys</h1>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    Create Survey
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : surveys.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No surveys created yet</p>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Create your first survey
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {surveys.map((survey) => (
                        <div
                            key={survey.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                                        <FileText className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${survey.is_active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {survey.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                        <div className="relative">
                                            <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                                    {survey.title}
                                </h3>
                                <p className="text-sm text-gray-500 mb-6">
                                    Created {new Date(survey.created_at).toLocaleDateString()}
                                </p>

                                <div className="flex items-center justify-between text-sm text-gray-600 border-t border-gray-100 pt-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900 text-lg">{survey.stats?.responseCount || 0}</span>
                                        <span className="text-xs">Responses</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="font-bold text-gray-900 text-lg">{survey.stats?.workerCount || 0}</span>
                                        <span className="text-xs">Workers</span>
                                    </div>
                                </div>

                                <div className="mt-6 flex gap-2">
                                    <button
                                        onClick={() => router.push(`/admin/surveys/${survey.id}`)}
                                        className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        View Details
                                    </button>
                                    <button
                                        onClick={() => toggleSurveyStatus(survey.id, survey.is_active)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${survey.is_active
                                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                                            }`}
                                    >
                                        {survey.is_active ? 'Stop' : 'Start'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-slide-down">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Create New Survey</h2>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateSurvey} className="p-6">
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Survey Title
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newSurveyTitle}
                                    onChange={(e) => setNewSurveyTitle(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="e.g., Summer Satisfaction Survey"
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    {isCreating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                                    Create Survey
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
