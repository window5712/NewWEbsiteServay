'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

import { Plus, Pencil, Trash2, Search, User, Key, Building, Mail } from 'lucide-react'
import { createWorker, updateWorker, deleteWorker } from './actions'
import { toast } from 'sonner'

interface Worker {
    id: string
    name: string
    email: string
    mall_name: string
    role: string
    created_at: string
    total_submissions?: number
    today_submissions?: number
}

export default function WorkersPage() {
    const [workers, setWorkers] = useState<Worker[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingWorker, setEditingWorker] = useState<Worker | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const supabase = createClient()

    const fetchWorkers = useCallback(async () => {
        setIsLoading(true)
        try {
            // Fetch workers
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('*')
                .eq('role', 'worker')
                .order('created_at', { ascending: false })

            if (usersError) throw usersError

            // Fetch submission stats
            const now = new Date()
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

            const workersWithStats = await Promise.all(usersData.map(async (user: any) => {
                const { count: total } = await supabase
                    .from('submissions')
                    .select('*', { count: 'exact', head: true })
                    .eq('worker_id', user.id)

                const { count: today } = await supabase
                    .from('submissions')
                    .select('*', { count: 'exact', head: true })
                    .eq('worker_id', user.id)
                    .gte('created_at', startOfDay)

                return {
                    ...user,
                    total_submissions: total || 0,
                    today_submissions: today || 0
                }
            }))

            setWorkers(workersWithStats)
        } catch (error) {
            console.error('Error fetching workers:', error)
            toast.error('Failed to load workers')
        } finally {
            setIsLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        fetchWorkers()
    }, [fetchWorkers])

    const handleCreate = async (formData: FormData) => {
        const result = await createWorker(formData)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Worker created successfully')
            setIsModalOpen(false)
            fetchWorkers()
        }
    }

    const handleUpdate = async (formData: FormData) => {
        if (!editingWorker) return
        const result = await updateWorker(editingWorker.id, formData)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Worker updated successfully')
            setIsModalOpen(false)
            setEditingWorker(null)
            fetchWorkers()
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this worker? This action cannot be undone.')) return

        const result = await deleteWorker(id)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Worker deleted successfully')
            fetchWorkers()
        }
    }

    const openCreateModal = () => {
        setEditingWorker(null)
        setIsModalOpen(true)
    }

    const openEditModal = (worker: Worker) => {
        setEditingWorker(worker)
        setIsModalOpen(true)
    }

    const filteredWorkers = workers.filter(worker =>
        worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.mall_name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="p-4 md:p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Worker Management</h1>
                    <p className="text-gray-600 mt-1">Manage survey workers and view their performance</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add Worker
                </button>
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search workers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-700 text-sm font-semibold">
                                <th className="px-6 py-4 border-b">Worker</th>
                                <th className="px-6 py-4 border-b">Mall</th>
                                <th className="px-6 py-4 border-b text-center">Today&apos;s Submissions</th>
                                <th className="px-6 py-4 border-b text-center">Total Submissions</th>
                                <th className="px-6 py-4 border-b text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex justify-center items-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            <span className="ml-3">Loading workers...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredWorkers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No workers found
                                    </td>
                                </tr>
                            ) : (
                                filteredWorkers.map((worker) => (
                                    <tr key={worker.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900">{worker.name}</p>
                                                <p className="text-sm text-gray-500">{worker.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">{worker.mall_name}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                {worker.today_submissions}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-medium text-gray-900">
                                            {worker.total_submissions}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(worker)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(worker.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Worker Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-900">
                                {editingWorker ? 'Edit Worker' : 'Create New Worker'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                &times;
                            </button>
                        </div>

                        <form action={editingWorker ? handleUpdate : handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        name="name"
                                        type="text"
                                        required
                                        defaultValue={editingWorker?.name}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        name="email"
                                        type="email"
                                        required
                                        defaultValue={editingWorker?.email}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {editingWorker ? 'New Password (leave empty to keep current)' : 'Password'}
                                </label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        name="password"
                                        type="password"
                                        required={!editingWorker}
                                        minLength={6}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mall Name</label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        name="mall_name"
                                        type="text"
                                        required
                                        defaultValue={editingWorker?.mall_name}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        placeholder="Central Mall"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors shadow-lg shadow-blue-600/20 mt-6"
                            >
                                {editingWorker ? 'Update Worker' : 'Create Worker'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
