'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, FileText, Clock, LogOut, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navigation = [
    { name: 'Dashboard', href: '/worker', icon: LayoutDashboard },
    { name: 'History', href: '/worker/history', icon: Clock },
    { name: 'Profile', href: '/worker/profile', icon: User },
]

interface SidebarProps {
    onClose?: () => void
}

export default function WorkerSidebar({ onClose }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <div className="flex flex-col h-full bg-white border-r border-gray-200">
            <div className="p-6">
                <h1 className="text-xl font-bold text-gray-900">Mall Survey</h1>
                <p className="text-sm text-gray-600">Worker Portal</p>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={onClose}
                            className={`
                                flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                                ${isActive
                                    ? 'bg-blue-50 text-blue-600 font-medium'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }
                            `}
                        >
                            <Icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-gray-200">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </button>
            </div>
        </div>
    )
}
