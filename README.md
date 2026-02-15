# Mall Survey System

A full-stack web application for collecting survey responses from shopping mall customers. Built with Next.js, Supabase, and optimized for mobile-first data collection.

## Features

### Admin Dashboard
- ✅ Create and manage surveys with dynamic questions
- ✅ Support for text, radio, and checkbox question types
- ✅ Activate/deactivate surveys
- ✅ View all submissions with pagination (50 per page)
- ✅ Filter by date range (daily, weekly, monthly, custom)
- ✅ Export data to Excel (.xlsx)

### Worker Dashboard
- ✅ Mobile-optimized interface
- ✅ Select active surveys
- ✅ Collect customer information
- ✅ Upload invoice and customer images
- ✅ Automatic image compression (WebP, 1MB max, 1200px width)
- ✅ Invoice uniqueness validation

### System Features
- ✅ Role-based access control (Admin/Worker)
- ✅ Supabase authentication
- ✅ Row Level Security (RLS)
- ✅ Invoice duplicate detection
- ✅ Scalable for 30,000+ submissions
- ✅ Performance-optimized database indexes

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Image Processing**: browser-image-compression
- **Excel Export**: ExcelJS
- **Icons**: Lucide React

## Quick Start

1. **Clone and install**:
   ```bash
   npm install
   ```

2. **Setup Supabase**:
   - Create a Supabase project
   - Run `database-schema.sql` in SQL Editor
   - Create admin and worker users

3. **Configure environment**:
   ```bash
   cp .env.example .env.local
   # Add your Supabase credentials
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **Open browser**: `http://localhost:3000`

See [SETUP.md](SETUP.md) for detailed instructions.

## Project Structure

```
src/
├── app/
│   ├── admin/           # Admin dashboard pages
│   ├── worker/          # Worker dashboard pages
│   ├── api/            # API routes
│   └── login/          # Authentication
├── components/
│   ├── admin/          # Admin components
│   ├── worker/         # Worker components
│   └── ui/             # Reusable UI components
└── lib/
    ├── supabase/       # Supabase clients
    ├── utils/          # Utility functions
    └── types/          # TypeScript types
```

## Key Features Explained

### Invoice Uniqueness
The system enforces invoice uniqueness at the database level with a UNIQUE constraint. Attempting to submit a duplicate invoice will result in a clear error message.

### Image Compression
All images are compressed client-side before upload:
- Format: WebP
- Max file size: 1MB
- Max width: 1200px
- Metadata removed for privacy

### Row Level Security
Database access is controlled through Supabase RLS policies:
- Workers can only see their own submissions
- Admins can see all data
- Active surveys are visible to all authenticated users

### Performance Optimization
- Database indexes on invoice_number, created_at, worker_id
- Pagination for large datasets (50 records per page)
- JSONB for flexible survey answers storage

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

### Self-hosted
```bash
npm run build
npm start
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Documentation

- [SETUP.md](SETUP.md) - Complete setup instructions
- [PRD.md](PRD.md) - Product requirements
- [DESIGN.md](DESIGN.md) - Design specifications
- [API_SPEC.md](API_SPEC.md) - API documentation
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Database structure
- [TECH_ARCHITECTURE.md](TECH_ARCHITECTURE.md) - Technical architecture

## License

MIT
