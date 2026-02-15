import { createServerClient } from '../../lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLayoutClient from '@/components/admin/AdminLayoutClient'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = createServerClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify admin role - use metadata for speed and middleware fallback
    let userRole = user.user_metadata?.role

    if (!userRole) {
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id' as any, user.id as any)
            .single()
        userRole = userData?.role
    }

    if (userRole !== 'admin') {
        console.warn(`[AdminLayout] Access denied for user ${user.id} with role ${userRole}`)
        redirect('/login')
    }

    return (
        <AdminLayoutClient>
            {children}
        </AdminLayoutClient>
    )
}
