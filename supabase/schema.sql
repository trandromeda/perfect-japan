-- Perfect Japan Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trips table
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Days table
CREATE TABLE days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  day_number INTEGER NOT NULL,
  date DATE NOT NULL,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trip_id, day_number)
);

-- Activities table
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  day_id UUID REFERENCES days(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('see', 'do', 'eat', 'transit', 'rest')),
  location TEXT,
  duration INTEGER, -- in minutes
  cost NUMERIC(10, 2),
  currency TEXT DEFAULT 'JPY',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'skipped', 'bucketed')),
  is_anchor BOOLEAN DEFAULT false,
  time_of_day TEXT,
  position INTEGER, -- for ordering within a day
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_days_trip_id ON days(trip_id);
CREATE INDEX idx_activities_trip_id ON activities(trip_id);
CREATE INDEX idx_activities_day_id ON activities(day_id);
CREATE INDEX idx_trips_user_id ON trips(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE days ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Trips policies
CREATE POLICY "Users can view own trips"
  ON trips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own trips"
  ON trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips"
  ON trips FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips"
  ON trips FOR DELETE
  USING (auth.uid() = user_id);

-- Days policies (inherited from trip ownership)
CREATE POLICY "Users can view days of own trips"
  ON days FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = days.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create days for own trips"
  ON days FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = days.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update days of own trips"
  ON days FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = days.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete days of own trips"
  ON days FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = days.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- Activities policies (inherited from trip ownership)
CREATE POLICY "Users can view activities of own trips"
  ON activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = activities.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create activities for own trips"
  ON activities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = activities.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update activities of own trips"
  ON activities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = activities.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete activities of own trips"
  ON activities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = activities.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_days_updated_at BEFORE UPDATE ON days
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper function to get full trip with nested data
CREATE OR REPLACE FUNCTION get_trip_with_details(trip_uuid UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'id', t.id,
    'title', t.title,
    'destination', t.destination,
    'start_date', t.start_date,
    'end_date', t.end_date,
    'created_at', t.created_at,
    'updated_at', t.updated_at,
    'days', (
      SELECT json_agg(
        json_build_object(
          'id', d.id,
          'day_number', d.day_number,
          'date', d.date,
          'summary', d.summary,
          'activities', (
            SELECT json_agg(
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
            )
            FROM activities a
            WHERE a.day_id = d.id AND a.status != 'bucketed'
          )
        ) ORDER BY d.day_number
      )
      FROM days d
      WHERE d.trip_id = t.id
    ),
    'bucket', (
      SELECT json_agg(
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
      )
      FROM activities a
      WHERE a.trip_id = t.id AND a.status = 'bucketed' AND a.day_id IS NULL
    )
  )
  FROM trips t
  WHERE t.id = trip_uuid AND t.user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;