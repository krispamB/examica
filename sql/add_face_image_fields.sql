-- Migration: Add face image fields to user_profiles table
-- Execute this SQL in your Supabase SQL editor

-- Add face image fields to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS face_image_url TEXT,
ADD COLUMN IF NOT EXISTS face_image_uploaded_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient face image queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_face_image 
ON user_profiles(face_image_uploaded_at) 
WHERE face_image_url IS NOT NULL;

-- Add comments to document the new fields
COMMENT ON COLUMN user_profiles.face_image_url IS 'URL of the face image stored in Supabase Storage for facial recognition';
COMMENT ON COLUMN user_profiles.face_image_uploaded_at IS 'Timestamp when the face image was uploaded by admin';

-- Create storage bucket for face images (if not exists)
-- Note: This needs to be done through Supabase Dashboard -> Storage
-- Bucket name: face-images
-- Public: false (controlled access only)
-- RLS: enabled

-- Example RLS policies for face-images bucket (to be created in Dashboard):
-- Policy name: "Admins can upload face images"
-- Operation: INSERT
-- Target roles: authenticated
-- SQL condition: auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin')

-- Policy name: "Admins can view face images"  
-- Operation: SELECT
-- Target roles: authenticated
-- SQL condition: auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin')

-- Policy name: "Users can view their own face image"
-- Operation: SELECT  
-- Target roles: authenticated
-- SQL condition: storage.foldername(name) = auth.uid()::text