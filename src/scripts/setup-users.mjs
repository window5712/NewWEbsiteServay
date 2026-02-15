import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Simple .env parser
function loadEnv() {
    const envPath = path.resolve(__dirname, '../../.env')
    if (!fs.existsSync(envPath)) return {}
    const content = fs.readFileSync(envPath, 'utf8')
    const env = {}
    content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
        if (match) {
            let value = match[2] || ''
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
            if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
            env[match[1]] = value
        }
    })
    return env
}

const env = loadEnv()
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables in .env file')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function setupUser(email, password, role) {
    console.log(`\n--- Setting up user: ${email} ---`)

    // 1. Check if user exists in Auth
    console.log('Checking Auth...')
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) throw listError

    let user = users.find(u => u.email === email)

    if (user) {
        console.log(`User already exists in Auth (ID: ${user.id}). Updating password and metadata...`)
        const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
            password: password,
            email_confirm: true,
            user_metadata: {
                name: email.split('@')[0],
                role: role
            }
        })
        if (updateError) throw updateError
    } else {
        console.log(`Creating user in Auth...`)
        const { data: { user: newUser }, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                name: email.split('@')[0],
                role: role
            }
        })
        if (createError) throw createError
        user = newUser
        console.log(`Created new Auth user with ID: ${user.id}`)
    }

    // 2. Ensure record exists in public.users
    console.log(`Ensuring record exists in public.users for ${email} with role: ${role}...`)

    // First, try to get existing user
    const { data: existingPublicUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()

    if (existingPublicUser) {
        console.log('Updating existing profile...')
        const { error: updateError } = await supabase
            .from('users')
            .update({
                email: email,
                name: email.split('@')[0],
                role: role
            })
            .eq('id', user.id)
        if (updateError) throw updateError
    } else {
        console.log('Inserting new profile...')
        const { error: insertError } = await supabase
            .from('users')
            .insert({
                id: user.id,
                email: email,
                name: email.split('@')[0],
                role: role,
                mall_name: 'Main Mall'
            })
        if (insertError) throw insertError
    }

    console.log(`SUCCESS: ${email} is now set up as ${role}`)
}

async function main() {
    try {
        // arylfullstackdeveloper@gmail.com -> admin
        await setupUser('aryanfullstackdeveloper@gmail.com', 'Admin123!!!', 'admin')

        // apnaoffice26@gmail.com -> worker
        await setupUser('apnaoffice26@gmail.com', 'Admin123!!!', 'worker')

        console.log('\n=========================================')
        console.log('Summary: All users processed successfully!')
        console.log('=========================================')
    } catch (error) {
        console.error('\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
        console.error('Setup failed:', error.message)
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
        process.exit(1)
    }
}

main()
