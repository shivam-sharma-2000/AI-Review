-- Migration: Create user_profiles table for Free Trial System
-- Description: Tracks trial limits, counts, plan names, and trial end dates.

-- 1. Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  review_count INTEGER DEFAULT 0 NOT NULL,
  review_limit INTEGER DEFAULT 100 NOT NULL,
  plan TEXT DEFAULT 'free_trial' NOT NULL,
  trial_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Create index on ID for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON public.user_profiles(id);
