'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '../../lib/supabase/client'

import { Users, FileText, CheckCircle } from 'lucide-react'

interface Stats {
    totalSurveys: number
    totalSubmissions: number
    activeSurveys: number
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats>({ totalSurveys: 0, totalSubmissions: 0, activeSurveys: 0 })
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()
    const fetchStats = useCallback(async () => {
        try {
            const [
                { count: surveysCount },
                { count: activeSurveysCount },
                { count: submissionsCount }
            ] = await Promise.all([
                (supabase.from('surveys') as any).select('*', { count: 'exact', head: true }),
                (supabase.from('surveys') as any).select('*', { count: 'exact', head: true }).eq('is_active', true),
                (supabase.from('submissions') as any).select('*', { count: 'exact', head: true })
            ])

            setStats({
                totalSurveys: surveysCount || 0,
                totalSubmissions: submissionsCount || 0,
                activeSurveys: activeSurveysCount || 0,
            })
        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setIsLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        fetchStats()
    }, [fetchStats])

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard Overview</h1>

            {isLoading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Surveys</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalSurveys}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Active Surveys</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.activeSurveys}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Users className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Submissions</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalSubmissions}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-8 bg-white p-6 rounded-lg shadow border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-3 text-gray-600">
                    <p>• Create a new survey in the <a href="/admin/surveys" className="text-blue-600 hover:underline">Surveys</a> section</p>
                    <p>• View all responses in the <a href="/admin/submissions" className="text-blue-600 hover:underline">Submissions</a> section</p>
                    <p>• Export data to Excel in the <a href="/admin/export" className="text-blue-600 hover:underline">Export Data</a> section</p>
                </div>
            </div>
        </div>
    )
}
