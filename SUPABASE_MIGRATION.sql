-- Supabase Migration: Add email column and fix RLS policies for Clerk authentication
-- Run this in your Supabase SQL Editor

-- Step 1: Add email column to outfit_history table
ALTER TABLE outfit_history 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Step 2: Add email column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Step 3: Add email column to favorites table
ALTER TABLE favorites 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Step 4: Add style_name column to outfit_history (if it doesn't exist)
-- This column stores the style name for each outfit entry
ALTER TABLE outfit_history 
ADD COLUMN IF NOT EXISTS style_name TEXT;

-- Step 5: Create indexes for faster email queries
CREATE INDEX IF NOT EXISTS idx_outfit_history_email ON outfit_history(email);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_favorites_email ON favorites(email);

-- Step 6: Update RLS policies to work with Clerk authentication
-- Since we're using Clerk (not Supabase Auth), we need to allow access based on user_id
-- These policies allow users to access their own data by user_id matching

-- Drop existing policies if they exist (optional - only if you want to replace them)
-- DROP POLICY IF EXISTS "Users can view own outfit_history" ON outfit_history;
-- DROP POLICY IF EXISTS "Users can insert own outfit_history" ON outfit_history;
-- DROP POLICY IF EXISTS "Users can update own outfit_history" ON outfit_history;
-- DROP POLICY IF EXISTS "Users can delete own outfit_history" ON outfit_history;

-- Enable RLS on tables (if not already enabled)
ALTER TABLE outfit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for outfit_history
-- Note: These policies use user_id directly since Clerk user IDs are stored in user_id column
-- If your RLS needs to check auth.uid(), you'll need to set up Clerk JWT integration with Supabase

-- Policy: Users can view their own outfit history
CREATE POLICY "Users can view own outfit_history"
ON outfit_history
FOR SELECT
USING (true); -- Allow all selects - filter by user_id in application code
-- Alternative if you want RLS filtering: USING (user_id = current_setting('app.user_id', true)::text)

-- Policy: Users can insert their own outfit history
CREATE POLICY "Users can insert own outfit_history"
ON outfit_history
FOR INSERT
WITH CHECK (true); -- Allow all inserts - validate user_id in application code

-- Policy: Users can update their own outfit history
CREATE POLICY "Users can update own outfit_history"
ON outfit_history
FOR UPDATE
USING (true) -- Allow all updates - filter by user_id in application code
WITH CHECK (true);

-- Policy: Users can delete their own outfit history
CREATE POLICY "Users can delete own outfit_history"
ON outfit_history
FOR DELETE
USING (true); -- Allow all deletes - filter by user_id in application code

-- Create policies for profiles
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
USING (true);

CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Create policies for favorites
CREATE POLICY "Users can view own favorites"
ON favorites
FOR SELECT
USING (true);

CREATE POLICY "Users can insert own favorites"
ON favorites
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can delete own favorites"
ON favorites
FOR DELETE
USING (true);

-- Note: The policies above allow all operations because we're filtering by user_id in the application code.
-- If you want stricter RLS, you can use service role key or set up Clerk JWT integration with Supabase.
-- For now, this allows the app to work while filtering happens in the WHERE clauses.
