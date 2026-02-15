import type { Metadata } from 'next'
import './globals.css'
import Toaster from '@/components/ui/Toaster'

export const metadata: Metadata = {
    title: 'Mall Survey System',
    description: 'Centralized survey system for mall campaigns',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>
                {children}
                <Toaster />
            </body>
        </html>
    )
}
