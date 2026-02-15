'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createWorker(formData: FormData) {
    const supabase = createAdminClient()
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const mall_name = formData.get('mall_name') as string

    if (!email || !password || !name) {
        return { error: 'Missing required fields' }
    }

    try {
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                name,
                role: 'worker',
                mall_name
            }
        })

        if (error) throw error

        // Manually insert into public.users to ensure all fields like mall_name are saved correctly
        // This acts as a fallback/confirmation even if the trigger exists
        const { error: profileError } = await supabase
            .from('users')
            .upsert({
                id: data.user.id,
                email: email,
                name: name,
                role: 'worker',
                mall_name: mall_name
            })

        if (profileError) {
            console.error('Error creating user profile:', profileError)
            // We don't throw here to avoid failing the whole request if the auth user was created
            // The trigger might have handled it, or we can deal with it later
        }

        revalidatePath('/admin/workers')
        return { success: true, user: data.user }
    } catch (error: any) {
        console.error('Create worker error:', error)
        return { error: error.message }
    }
}

export async function updateWorker(userId: string, formData: FormData) {
    const supabase = createAdminClient()
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const mall_name = formData.get('mall_name') as string
    const password = formData.get('password') as string

    try {
        const updates: any = {
            email,
            user_metadata: {
                name,
                mall_name
            }
        }

        if (password && password.trim() !== '') {
            updates.password = password
        }

        // Update auth user
        const { error: authError } = await supabase.auth.admin.updateUserById(
            userId,
            {
                ...updates,
                email_confirm: true // Ensure email is confirmed automatically when admin updates it
            }
        )

        if (authError) throw authError

        // Update public user
        const { error: dbError } = await supabase
            .from('users')
            .update({
                name,
                email,
                mall_name
            })
            .eq('id', userId)

        if (dbError) throw dbError

        revalidatePath('/admin/workers')
        return { success: true }
    } catch (error: any) {
        console.error('Update worker error:', error)
        return { error: error.message || 'Failed to update worker' }
    }
}

export async function deleteWorker(userId: string) {
    const supabase = createAdminClient()

    try {
        // 1. Delete from public.users first
        // If ON DELETE SET NULL is set in DB, this will successfully unlink submissions
        const { error: dbError } = await supabase
            .from('users')
            .delete()
            .eq('id', userId)

        if (dbError) {
            console.error('Error deleting from public.users:', dbError)
            throw new Error(`Database error: ${dbError.message}`)
        }

        // 2. Delete from auth.users
        const { error: authError } = await supabase.auth.admin.deleteUser(userId)

        if (authError) {
            // If the user was already deleted from Auth but still existed in our DB (partial state),
            // we might want to ignore "User not found" errors here.
            if (authError.message?.includes('User not found')) {
                console.log('User already deleted from Auth')
            } else {
                console.error('Error deleting from auth.users:', authError)
                throw new Error(`Auth error: ${authError.message}`)
            }
        }

        revalidatePath('/admin/workers')
        return { success: true }
    } catch (error: any) {
        console.error('Delete worker error:', error)
        return { error: error.message || 'Failed to delete worker' }
    }
}
