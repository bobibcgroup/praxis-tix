-- Supabase Storage Policies for 'images' bucket
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- First, make sure the bucket exists and is public
-- Go to Storage > Create bucket > Name: "images" > Public bucket: ON

-- Drop existing policies if they exist (for re-running script)
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous deletes" ON storage.objects;

-- Policy 1: Allow public read access (SELECT)
-- This allows anyone to view/download images from the bucket
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'images');

-- Policy 2: Allow anonymous uploads (INSERT)
-- This allows anyone (including anonymous users) to upload images
CREATE POLICY "Allow anonymous uploads"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'images');

-- Policy 3: Allow anonymous updates (UPDATE) - Optional
-- This allows updating existing files (useful if you want to allow overwrites)
CREATE POLICY "Allow anonymous updates"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'images')
WITH CHECK (bucket_id = 'images');

-- Policy 4: Allow anonymous deletes (DELETE) - Optional
-- This allows deleting files (be careful with this in production)
-- You might want to restrict this to authenticated users only
CREATE POLICY "Allow anonymous deletes"
ON storage.objects
FOR DELETE
USING (bucket_id = 'images');
