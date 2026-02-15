-- Add cnic column to submissions table
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS cnic TEXT;

-- Create index for cnic
CREATE INDEX IF NOT EXISTS idx_submissions_cnic ON submissions(cnic);
