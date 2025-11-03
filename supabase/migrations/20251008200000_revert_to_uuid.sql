-- Revert IDs back to UUID type (they were accidentally changed to TEXT)
-- This migration reverts the database to use proper UUIDs

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Disable RLS entirely so we can change column types
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE days DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;

-- Drop all policies (they'll prevent column type changes even with RLS disabled)
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on trips table
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'trips' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON trips';
    END LOOP;

    -- Drop all policies on days table
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'days' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON days';
    END LOOP;

    -- Drop all policies on activities table
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'activities' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON activities';
    END LOOP;
END $$;

-- Drop foreign key constraints
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_trip_id_fkey;
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_day_id_fkey;
ALTER TABLE days DROP CONSTRAINT IF EXISTS days_trip_id_fkey;

-- Change trip IDs back to UUID
ALTER TABLE trips ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE trips ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Change day IDs back to UUID
ALTER TABLE days ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE days ALTER COLUMN id SET DEFAULT uuid_generate_v4();
ALTER TABLE days ALTER COLUMN trip_id TYPE UUID USING trip_id::uuid;

-- Change activity IDs back to UUID
ALTER TABLE activities ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE activities ALTER COLUMN id SET DEFAULT uuid_generate_v4();
ALTER TABLE activities ALTER COLUMN trip_id TYPE UUID USING trip_id::uuid;
ALTER TABLE activities ALTER COLUMN day_id TYPE UUID USING day_id::uuid;

-- Re-add foreign key constraints with UUID type
ALTER TABLE days ADD CONSTRAINT days_trip_id_fkey
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE;

ALTER TABLE activities ADD CONSTRAINT activities_trip_id_fkey
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE;

ALTER TABLE activities ADD CONSTRAINT activities_day_id_fkey
  FOREIGN KEY (day_id) REFERENCES days(id) ON DELETE CASCADE;

-- Update the RPC function to use UUID parameter
DROP FUNCTION IF EXISTS get_trip_with_details(TEXT);

CREATE OR REPLACE FUNCTION get_trip_with_details(trip_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'id', t.id,
    'title', t.title,
    'destination', t.destination,
    'start_date', t.start_date,
    'end_date', t.end_date,
    'days', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', d.id,
          'day_number', d.day_number,
          'date', d.date,
          'summary', d.summary,
          'activities', (
            SELECT COALESCE(json_agg(
              json_build_object(
                'id', a.id,
                'title', a.title,
                'description', a.description,
                'category', a.category,
                'location', a.location,
                'duration', a.duration,
                'cost', a.cost,
                'currency', a.currency,
                'notes', a.notes,
                'status', a.status,
                'is_anchor', a.is_anchor,
                'time_of_day', a.time_of_day,
                'position', a.position
              ) ORDER BY a.position
            ), '[]'::json)
            FROM activities a
            WHERE a.day_id = d.id
          )
        ) ORDER BY d.day_number
      ), '[]'::json)
      FROM days d
      WHERE d.trip_id = t.id
    ),
    'bucket', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', a.id,
          'title', a.title,
          'description', a.description,
          'category', a.category,
          'location', a.location,
          'duration', a.duration,
          'cost', a.cost,
          'currency', a.currency,
          'notes', a.notes,
          'status', a.status,
          'is_anchor', a.is_anchor,
          'time_of_day', a.time_of_day
        )
      ), '[]'::json)
      FROM activities a
      WHERE a.trip_id = t.id AND a.day_id IS NULL
    )
  ) INTO result
  FROM trips t
  WHERE t.id = trip_uuid;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-enable RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE days ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Recreate the permissive policies for development
CREATE POLICY "Allow anonymous access to trips" ON trips
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous access to days" ON days
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous access to activities" ON activities
  FOR ALL USING (true) WITH CHECK (true);
