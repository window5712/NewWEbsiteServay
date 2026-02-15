'use client'

import { useState } from 'react'
import WorkerSidebar from './WorkerSidebar'
import { Menu } from 'lucide-react'

export default function WorkerLayoutClient({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 w-full bg-white border-b border-gray-200 z-20 px-4 py-3 flex items-center justify-between shadow-sm">
                <span className="font-bold text-lg text-gray-900">Worker Portal</span>
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 shadow-xl md:shadow-none
                transform transition-transform duration-300 ease-in-out 
                md:transform-none md:static md:inset-auto md:h-screen md:block
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <WorkerSidebar onClose={() => setIsSidebarOpen(false)} />
            </div>

            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 w-full pt-16 md:pt-0 min-h-screen overflow-y-auto overflow-x-hidden">
                {children}
            </main>
        </div>
    )
}
