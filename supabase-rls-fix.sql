-- Fix RLS Policies for Clerk Authentication
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- This allows operations since we filter by user_id in the application layer

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own history" ON outfit_history;
DROP POLICY IF EXISTS "Users can insert own history" ON outfit_history;
DROP POLICY IF EXISTS "Users can update own history" ON outfit_history;
DROP POLICY IF EXISTS "Users can delete own history" ON outfit_history;
DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can insert own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;

-- Profiles policies - Allow all operations (filtered by user_id in app)
CREATE POLICY "Allow all profile operations" ON profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Outfit history policies - Allow all operations (filtered by user_id in app)
CREATE POLICY "Allow all history operations" ON outfit_history
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Favorites policies - Allow all operations (filtered by user_id in app)
CREATE POLICY "Allow all favorites operations" ON favorites
  FOR ALL
  USING (true)
  WITH CHECK (true);
