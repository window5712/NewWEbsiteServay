'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Mail, Building, Shield } from 'lucide-react'

export default function WorkerProfile() {
    const [user, setUser] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                // Fetch additional details from 'users' table if needed, 
                // but metadata might have most of it.
                // Let's fetch from table to be sure about mall_name etc.
                const { data: profile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                setUser({ ...user, ...profile })
            }
            setIsLoading(false)
        }
        fetchProfile()
    }, [supabase])

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!user) return null

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-blue-600 h-32 relative">
                    <div className="absolute -bottom-12 left-8">
                        <div className="w-24 h-24 bg-white rounded-full p-1 shadow-md">
                            <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
                                {user.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-16 pb-8 px-8 space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                        <p className="text-gray-500">{user.email}</p>
                    </div>

                    <div className="grid gap-6 border-t border-gray-100 pt-6">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <Building className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Assigned Location</p>
                                <p className="text-gray-900 font-medium">{user.mall_name || 'Not assigned'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                <Shield className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Role</p>
                                <p className="text-gray-900 font-medium capitalize">{user.role}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Email Address</p>
                                <p className="text-gray-900 font-medium">{user.email}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
