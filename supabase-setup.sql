-- Praxis Supabase Database Setup
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  style_dna JSONB,
  fit_calibration JSONB,
  lifestyle TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outfit history table
CREATE TABLE IF NOT EXISTS outfit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  outfit_id INTEGER NOT NULL,
  occasion TEXT NOT NULL,
  outfit_data JSONB NOT NULL,
  try_on_image_url TEXT,
  animated_video_url TEXT,
  selected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  outfit_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, outfit_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running script)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own history" ON outfit_history;
DROP POLICY IF EXISTS "Users can insert own history" ON outfit_history;
DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;

-- Create a function to get user_id from JWT (for Clerk integration)
-- Note: This requires setting up Clerk JWT in Supabase, but for MVP we'll use a simpler approach

-- For MVP: Allow authenticated users to access their own data
-- We'll filter by user_id in the application layer
-- For now, we'll create policies that allow access when user_id matches

-- RLS Policies for profiles (simplified for MVP with Clerk)
-- Note: In production, you'd want to use Supabase Auth or a custom JWT function
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (true); -- Filtered by user_id in app

CREATE POLICY "Users can update own profile" ON profiles
  FOR ALL USING (true); -- Filtered by user_id in app

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (true); -- Filtered by user_id in app

-- RLS Policies for outfit_history
CREATE POLICY "Users can view own history" ON outfit_history
  FOR SELECT USING (true); -- Filtered by user_id in app

CREATE POLICY "Users can insert own history" ON outfit_history
  FOR INSERT WITH CHECK (true); -- Filtered by user_id in app

-- RLS Policies for favorites
CREATE POLICY "Users can view own favorites" ON favorites
  FOR SELECT USING (true); -- Filtered by user_id in app

CREATE POLICY "Users can manage own favorites" ON favorites
  FOR ALL USING (true); -- Filtered by user_id in app

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_outfit_history_user_id ON outfit_history(user_id);
CREATE INDEX IF NOT EXISTS idx_outfit_history_selected_at ON outfit_history(selected_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
