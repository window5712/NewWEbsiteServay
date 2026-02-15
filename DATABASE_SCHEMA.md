# Database Schema

## users
- id (uuid, primary key)
- name (text)
- email (text)
- role (admin / worker)
- mall_name (text)
- created_at (timestamp)

---

## surveys
- id (uuid, primary key)
- title (text)
- is_active (boolean)
- created_at (timestamp)

---

## survey_questions
- id (uuid, primary key)
- survey_id (uuid, foreign key)
- question (text)
- type (text)
- required (boolean)

---

## submissions
- id (uuid, primary key)
- survey_id (uuid)
- worker_id (uuid)
- customer_name (text)
- customer_phone (text)
- invoice_number (text UNIQUE)
- invoice_image_url (text)
- customer_image_url (text)
- answers (jsonb)
- created_at (timestamp)

---

## Indexes

CREATE INDEX idx_invoice ON submissions(invoice_number);
CREATE INDEX idx_date ON submissions(created_at);
CREATE INDEX idx_worker ON submissions(worker_id);
