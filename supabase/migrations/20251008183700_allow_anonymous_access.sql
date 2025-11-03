-- Temporarily allow anonymous access for development (until auth is implemented)
-- WARNING: In production, you should have proper authentication and RLS policies

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own trips" ON trips;
DROP POLICY IF EXISTS "Users can insert their own trips" ON trips;
DROP POLICY IF EXISTS "Users can update their own trips" ON trips;
DROP POLICY IF EXISTS "Users can delete their own trips" ON trips;

DROP POLICY IF EXISTS "Users can view days of their trips" ON days;
DROP POLICY IF EXISTS "Users can insert days of their trips" ON days;
DROP POLICY IF EXISTS "Users can update days of their trips" ON days;
DROP POLICY IF EXISTS "Users can delete days of their trips" ON days;

DROP POLICY IF EXISTS "Users can view activities of their trips" ON activities;
DROP POLICY IF EXISTS "Users can insert activities of their trips" ON activities;
DROP POLICY IF EXISTS "Users can update activities of their trips" ON activities;
DROP POLICY IF EXISTS "Users can delete activities of their trips" ON activities;

-- Create permissive policies for development (allow all operations)
CREATE POLICY "Allow anonymous access to trips" ON trips
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous access to days" ON days
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous access to activities" ON activities
  FOR ALL USING (true) WITH CHECK (true);

-- Note: When you implement authentication, you should:
-- 1. Remove these permissive policies
-- 2. Add back proper RLS policies that check auth.uid() = user_id
