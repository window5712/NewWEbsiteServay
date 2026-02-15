# Mall Survey System – Technical Architecture

## Frontend
- Next.js (App Router)
- Tailwind CSS
- Client-side image compression
- Role-based protected routes

## Backend
- Next.js API Routes
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage

---

## System Flow

Worker Login → Select Survey → Fill Form → Compress Image → Upload to Storage → Save Submission → Admin View Data → Export Excel

---

## Security

- Supabase Auth
- Row Level Security (RLS)
- API validation
- Invoice UNIQUE constraint
- File type validation
- File size limit (5MB before compression)

---

## Performance Optimization

- Indexed columns:
  - invoice_number
  - created_at
  - worker_id
- Pagination
- JSONB for survey answers
