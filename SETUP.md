# Mall Survey System - Setup Guide

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- npm or yarn package manager

## 1. Supabase Setup

### Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and API keys
3. Wait for the database to be fully provisioned

### Run Database Setup

1. Go to the SQL Editor in your Supabase dashboard
2. Copy the contents of `database-schema.sql`
3. Paste and execute the SQL to create all tables, indexes, and RLS policies

### Create Storage Bucket

The SQL script creates the storage bucket automatically. Verify in Storage section:
- Bucket name: `survey-uploads`
- Public access: Enabled

### Create Initial Admin User

1. In Supabase Dashboard, go to Authentication > Users
2. Click "Add User"
3. Enter email and password
4. Go to Table Editor > users
5. Insert a new row:
   - id: (copy the UUID from the auth.users table)
   - email: (same as authentication email)
   - name: "Admin Name"
   - role: "admin"
   - mall_name: "Head Office"

### Create Test Worker User

1. Create another authentication user
2. Add to users table with role: "worker" and appropriate mall_name

## 2. Environment Configuration

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

   Find these values in:
   - Supabase Dashboard > Project Settings > API

## 3. Install Dependencies

```bash
npm install
```

## 4. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 5. First Login

1. Navigate to `http://localhost:3000`
2. Login with your admin credentials
3. Create your first survey
4. Activate the survey

Worker Login:
1. Login with worker credentials
2. Select active survey
3. Start collecting responses

## Production Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### VPS/Self-hosted

1. Build the project:
   ```bash
   npm run build
   ```

2. Start production server:
   ```bash
   npm start
   ```

3. Use PM2 or similar for process management
4. Set up Nginx as reverse proxy
5. Enable SSL with Let's Encrypt

## Troubleshooting

### Images not uploading
- Verify storage bucket exists and is public
- Check RLS policies on storage.objects
- Ensure NEXT_PUBLIC_SUPABASE_URL is correct

### Duplicate invoice error
- This is expected behavior for invoice uniqueness
- Check if invoice already exists in submissions table

### Login issues
- Verify user exists in both auth.users and users table
- Check that role field is set correctly
- Ensure RLS policies are applied

### Performance issues with many submissions
- Indexes are already created
- Consider adding more filters
- Use date range filters for exports

## Support

For issues or questions:
1. Check database schema matches `database-schema.sql`
2. Verify all environment variables are set
3. Check browser console for client errors
4. Check API route errors in terminal
