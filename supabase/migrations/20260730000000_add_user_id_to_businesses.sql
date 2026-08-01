-- Migration: Add user_id column to businesses table
-- Description: Links businesses to the auth.users table to enable owner-based authorization.

-- 1. Add user_id column if it does not already exist
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Create an index on user_id to optimize filtering queries
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON public.businesses(user_id);
