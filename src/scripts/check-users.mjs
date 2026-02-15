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

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUsers() {
    console.log('\n--- Checking Auth Users ---')
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
    if (authError) {
        console.error('Error fetching auth users:', authError)
    } else {
        console.log('Auth Users Count:', users.length)
        users.forEach(u => {
            console.log(`- ID: ${u.id}, Email: ${u.email}`)
            console.log(`  Metadata: ${JSON.stringify(u.user_metadata, null, 2)}`)
        })
    }

    console.log('\n--- Checking Public Users Table ---')
    const { data: publicUsers, error: publicError } = await supabase.from('users').select('*')
    if (publicError) {
        console.error('Error fetching public users:', publicError)
    } else {
        console.log('Public Users Count:', publicUsers.length)
        console.log(JSON.stringify(publicUsers, null, 2))
    }
}

checkUsers()
