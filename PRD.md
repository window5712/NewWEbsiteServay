# Mall Survey System – Product Requirements Document (PRD)

## 1. Project Overview

This project is a centralized web-based survey system designed for mall campaigns. Workers collect survey responses from shopping customers inside malls using invoice verification and image uploads. The system is optimized for simplicity, speed, mobile usability, and scalability (30,000+ submissions).

---

## 2. User Roles

### Admin
- Login securely
- Create and manage surveys
- Add/edit survey questions
- Activate/deactivate surveys
- View all submissions
- Filter by date, worker, mall
- Export data to Excel
- Monitor daily, weekly, monthly reports

### Worker
- Login securely
- View active surveys
- Fill survey for mall customers
- Enter invoice number
- Upload invoice image
- Upload customer image (optional)
- Submit form

---

## 3. Core Features

- Invoice uniqueness validation
- Image compression before upload
- Supabase Storage integration
- Excel export functionality
- Role-based access control
- Mobile-first design
- Pagination for large datasets
- Secure API routes
- Row Level Security (RLS)

---

## 4. Non-Functional Requirements

- Handle 30,000+ submissions
- Fast loading on mobile
- Secure authentication
- Optimized database indexing
- Prevent duplicate invoices
- Image validation and compression
