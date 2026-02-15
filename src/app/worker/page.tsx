'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import { FileText, Calendar, Clock, ChevronRight, BarChart2, CheckCircle, Search, PlayCircle } from 'lucide-react'

interface Survey {
    id: string
    title: string
    created_at: string
    description?: string
}

interface Submission {
    id: string
    created_at: string
    customer_name: string
    cnic?: string
    survey: {
        title: string
    }
}

export default function WorkerDashboard() {
    const [surveys, setSurveys] = useState<Survey[]>([])
    const [stats, setStats] = useState({ total: 0, today: 0, weekly: 0 })
    const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const router = useRouter()
    const supabase = createClient()

    const fetchData = useCallback(async () => {
        setIsLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }
            setUser(user)

            // Fetch active surveys
            const { data: surveysData, error: surveysError } = await (supabase
                .from('surveys') as any)
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })

            if (surveysError) throw surveysError
            setSurveys(surveysData || [])

            // Fetch stats
            const now = new Date()
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString()

            const { count: total } = await supabase
                .from('submissions')
                .select('*', { count: 'exact', head: true })
                .eq('worker_id', user.id)

            const { count: today } = await supabase
                .from('submissions')
                .select('*', { count: 'exact', head: true })
                .eq('worker_id', user.id)
                .gte('created_at', startOfDay)

            const { count: weekly } = await supabase
                .from('submissions')
                .select('*', { count: 'exact', head: true })
                .eq('worker_id', user.id)
                .gte('created_at', startOfWeek)

            setStats({
                total: total || 0,
                today: today || 0,
                weekly: weekly || 0
            })

            // Fetch recent submissions
            const { data: recentData } = await supabase
                .from('submissions')
                .select('id, created_at, customer_name, cnic, survey:surveys(title)')
                .eq('worker_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5)

            setRecentSubmissions(recentData as any || [])

        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setIsLoading(false)
        }
    }, [supabase, router])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    if (isLoading) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Header / Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500">Welcome back, {user?.user_metadata?.name || 'Worker'}!</p>
                </div>
                <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Today&apos;s Submissions</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.today}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl">
                        <CheckCircle className="w-8 h-8 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">This Week</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.weekly}</h3>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-xl">
                        <Calendar className="w-8 h-8 text-purple-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Total Submissions</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.total}</h3>
                    </div>
                    <div className="p-3 bg-green-50 rounded-xl">
                        <BarChart2 className="w-8 h-8 text-green-600" />
                    </div>
                </div>
            </div>

            {/* Main Content Area: Surveys & Recent History */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Surveys Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            Active Surveys
                        </h2>
                    </div>

                    {surveys.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No Active Surveys</h3>
                            <p className="text-gray-500 mt-1">Check back later for new surveys.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {surveys.map((survey) => (
                                <div
                                    key={survey.id}
                                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
                                    onClick={() => router.push(`/worker/survey/${survey.id}`)}
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <PlayCircle className="w-24 h-24 text-blue-600 -mr-8 -mt-8" />
                                    </div>

                                    <div className="relative z-10">
                                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
                                            {survey.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                                            {survey.description || 'No description provided.'}
                                        </p>
                                        <div className="flex items-center text-blue-600 font-medium text-sm">
                                            Start Survey <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Submissions Sidebar */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-500" />
                        Recent History
                    </h2>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {recentSubmissions.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-gray-500 text-sm">No submissions yet.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {recentSubmissions.map((sub) => (
                                    <div key={sub.id} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="font-medium text-gray-900 line-clamp-1">{sub.customer_name}</p>
                                            <span className="text-xs text-gray-500 whitespace-nowrap bg-gray-100 px-2 py-0.5 rounded-full">
                                                {new Date(sub.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <p className="text-xs text-gray-500 line-clamp-1 flex-1 mr-2">{sub.survey?.title}</p>
                                            {sub.cnic && (
                                                <span className="text-[10px] text-gray-400 font-mono">
                                                    {sub.cnic}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {recentSubmissions.length > 0 && (
                            <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                                <button className="text-xs font-medium text-blue-600 hover:text-blue-700">
                                    View All History
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
