-- Add cv_url column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cv_url TEXT;

-- Create cv_files storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('cv_files', 'cv_files', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for Storage
-- Allow public read access to cv_files
CREATE POLICY "Public Access CV Files"
ON storage.objects FOR SELECT
USING ( bucket_id = 'cv_files' );

-- Allow authenticated users to upload their own CV
-- We use the folder structure: user_id/filename
CREATE POLICY "Users can upload their own CV"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'cv_files' AND
  auth.uid() = owner AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own CV
CREATE POLICY "Users can update their own CV"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'cv_files' AND
  auth.uid() = owner AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own CV
CREATE POLICY "Users can delete their own CV"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'cv_files' AND
  auth.uid() = owner AND
  (storage.foldername(name))[1] = auth.uid()::text
);

