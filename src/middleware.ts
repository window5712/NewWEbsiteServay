import { createClient } from './lib/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const { supabase, getResponse } = createClient(request)
    const { data: { user } } = await supabase.auth.getUser()
    const path = request.nextUrl.pathname
    let response = getResponse()

    // Helper to create redirect with cookies and log it clearly
    const redirect = (target: string, reason: string) => {
        console.log(`[Middleware] REDIRECT: ${path} -> ${target} | Reason: ${reason} | User: ${user?.email || 'none'}`)
        const redirectRes = NextResponse.redirect(new URL(target, request.url))
        response.cookies.getAll().forEach((cookie: any) => {
            redirectRes.cookies.set(cookie.name, cookie.value, cookie)
        })
        return redirectRes
    }

    if (user) {
        let userRole = user.user_metadata?.role
        let roleSource = 'metadata'

        if (!userRole) {
            const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
            userRole = userData?.role
            roleSource = 'database'
        }

        console.log(`[Middleware] ${path} | User: ${user.email} | Role: ${userRole || 'none'} (${roleSource})`)

        // 1. Handle Login Page Redirection
        if (path === '/login') {
            const target = userRole === 'admin' ? '/admin' : '/worker'
            return redirect(target, 'Logged in user on login page')
        }

        // 2. Protect Admin Routes
        if (path.startsWith('/admin')) {
            if (userRole !== 'admin') {
                console.warn(`[Middleware] ACCESS DENIED: ${user.email} (Role: ${userRole}) tried to access admin`)
                return redirect('/login', 'Insufficient permissions (not admin)')
            }
        }

        // 3. Protect Worker Routes
        if (path.startsWith('/worker')) {
            if (userRole !== 'worker') {
                console.warn(`[Middleware] ACCESS DENIED: ${user.email} (Role: ${userRole}) tried to access worker`)
                return redirect('/login', 'Insufficient permissions (not worker)')
            }
        }
    } else {
        // No user session
        if (path.startsWith('/admin') || path.startsWith('/worker')) {
            return redirect('/login', 'No active session')
        }
    }

    return response
}

export const config = {
    matcher: ['/admin/:path*', '/worker/:path*', '/login'],
}
