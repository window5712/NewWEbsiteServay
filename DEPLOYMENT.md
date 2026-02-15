# Deployment Guide

## Environment Variables

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

---

## Storage Setup

Create bucket:
survey-uploads

Folders:
- invoice/
- customer/

Enable public access or signed URLs.

---

## Production Deployment

- Deploy on VPS or Vercel
- Enable SSL
- Set environment variables
- Test file uploads
- Test Excel export
