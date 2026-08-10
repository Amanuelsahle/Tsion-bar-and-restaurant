-- Add status column to employees table
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
