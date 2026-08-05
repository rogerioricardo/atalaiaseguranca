-- Migration: Add support for dual neighborhood access to users profiles
-- Run this script in your Supabase SQL Editor if you are using a real Supabase instance.

-- 1. Add primary_neighborhood_id column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS primary_neighborhood_id UUID REFERENCES public.neighborhoods(id) ON DELETE SET NULL;

-- 2. Add secondary_neighborhood_id column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS secondary_neighborhood_id UUID REFERENCES public.neighborhoods(id) ON DELETE SET NULL;

-- 3. Populate existing primary_neighborhood_id with the legacy neighborhood_id
UPDATE public.profiles 
SET primary_neighborhood_id = neighborhood_id 
WHERE primary_neighborhood_id IS NULL AND neighborhood_id IS NOT NULL;

-- 4. Informational note
COMMENT ON COLUMN public.profiles.primary_neighborhood_id IS 'The primary neighborhood of the resident user';
COMMENT ON COLUMN public.profiles.secondary_neighborhood_id IS 'The secondary neighborhood for dual-access privileges';
