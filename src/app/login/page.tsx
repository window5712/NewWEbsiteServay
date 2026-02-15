'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { toast } from 'sonner'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (authError) throw authError

            // Fetch user role from users table with a small retry mechanism to handle trigger delay
            if (authData.session) {
                console.log('Session established:', authData.session.user.id)

                // 1. Fast path: Check metadata first
                let userRole = authData.session.user.user_metadata?.role
                if (userRole) {
                    console.log('Role found in session metadata:', userRole)
                } else {
                    // 2. Slow path: Retry database fetch
                    console.log('Role not in metadata, fetching from database...')
                    let retryCount = 0
                    const maxRetries = 3

                    while (retryCount < maxRetries && !userRole) {
                        const { data: userData, error: userError } = await (supabase
                            .from('users') as any)
                            .select('role')
                            .eq('id', authData.session.user.id)
                            .single()

                        if (userData) {
                            userRole = userData.role
                        } else {
                            if (userError) console.error(`DB Fetch error (Attempt ${retryCount + 1}):`, userError)
                            retryCount++
                            if (retryCount < maxRetries) {
                                await new Promise(resolve => setTimeout(resolve, 1000))
                            }
                        }
                    }
                }

                if (!userRole) {
                    toast.error('Account setup in progress. Please refresh in a few seconds.')
                    setIsLoading(false)
                    return
                }

                toast.success('Login successful!')
                const target = userRole === 'admin' ? '/admin' : '/worker'
                console.log('Redirecting to:', target)

                // Perform the redirection
                window.location.href = target // Using window.location to ensure fresh state and break loops
            } else {
                throw new Error('No session found')
            }
        } catch (err: any) {
            console.error('Login error:', err)
            toast.error(err.message || 'Login failed')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Mall Survey System</h1>
                    <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
                </div>

                <form onSubmit={handleLogin} className="mt-8 space-y-6">
                    <div className="space-y-4">
                        <Input
                            label="Email Address"
                            type="email"
                            value={email}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                            required
                            placeholder="Enter your email"
                        />

                        <Input
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                            required
                            placeholder="Enter your password"
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        isLoading={isLoading}
                        className="w-full"
                    >
                        Sign In
                    </Button>
                </form>
            </div>
        </div>
    )
}
