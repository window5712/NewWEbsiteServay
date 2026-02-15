# API Specification

## POST /api/login
Authenticate user via Supabase.

## GET /api/surveys
Fetch active surveys.

## POST /api/surveys
Create new survey (Admin only).

## POST /api/submissions
Create submission.
Validations:
- Required fields
- Invoice uniqueness
- Survey active
- Image URL present

## GET /api/submissions
Admin fetch submissions (paginated).

## GET /api/export
Generate Excel file and download.
