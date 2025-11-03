-- Migration: Add Minimal Enhanced Activity and Trip Fields
-- Date: 2025-01-02
-- Purpose: Add essential fields for comprehensive Japan itinerary planning
-- Philosophy: YAGNI - Only add what we know we'll query. Everything else goes in metadata.

-- ============================================================================
-- ACTIVITIES TABLE ENHANCEMENTS (3 new fields)
-- ============================================================================

-- Booking Requirements
-- Essential for trip planning - users need to know what requires advance booking
-- Simple boolean makes it easy to filter: WHERE booking_required = true
COMMENT ON COLUMN activities.booking_required IS 'Whether advance booking/reservation is required or strongly recommended. Default false. Use to filter activities needing advance planning.';

ALTER TABLE activities ADD COLUMN booking_required BOOLEAN NOT NULL DEFAULT false;

-- Physical Intensity
-- Used to calculate daily pacing and warn users about demanding days
-- Definitions:
--   none:     Sitting activities (meals, rest, transit where you sit)
--   light:    < 2km walking, mostly flat, < 2 hours, minimal stairs
--   moderate: 2-5km walking, some elevation/stairs, 2-4 hours
--   intense:  > 5km walking, significant stairs/hills, > 4 hours, or strenuous (hiking, cycling)
COMMENT ON COLUMN activities.intensity_level IS 'Physical demand level. none (sitting: meals, transit), light (<2km, <2hrs, flat), moderate (2-5km, 2-4hrs, some stairs), intense (>5km, >4hrs, or strenuous). Required for calculating daily pacing. Default: moderate.';

ALTER TABLE activities ADD COLUMN intensity_level TEXT NOT NULL DEFAULT 'moderate' CHECK (
  intensity_level IN ('none', 'light', 'moderate', 'intense')
);

-- Flexible Semi-Structured Data
-- For everything else that doesn't warrant a dedicated column
-- Common keys (but not enforced - this is flexible):
--   Location: city, area, station, line, exit
--   Timing: bestTimeToVisit, busiestTimeOfDay, openingHours, closingHours
--   Booking: bookingLeadTimeDays, bookingUrl
--   Reference: officialWebsite
--   Cultural: dressCode, photoPolicy, quietRequired
--   Seasonal: bestSeason, cherryBlossoms, fallFoliage
--   Transportation: walkingTimeMinutes, transportationMode
-- Example: {"city": "Tokyo", "area": "Asakusa", "bookingLeadTimeDays": 30, "station": "Asakusa", "line": "Ginza", "exit": "1"}
COMMENT ON COLUMN activities.metadata IS 'Flexible JSONB field for semi-structured data. Common keys: city, area, bestTimeToVisit (array), busiestTimeOfDay (array), bookingLeadTimeDays, bookingUrl, officialWebsite, station, line, exit, dressCode, photoPolicy, bestSeason, cherryBlossoms. Add new fields without migrations. Queryable with GIN index.';

ALTER TABLE activities ADD COLUMN metadata JSONB;

-- Create GIN index for efficient JSONB queries
CREATE INDEX idx_activities_metadata ON activities USING GIN (metadata);

-- ============================================================================
-- TRIPS TABLE ENHANCEMENTS
-- ============================================================================

-- Travel Style
-- Helps understand trip pacing preferences, can be used to generate appropriate itineraries

COMMENT ON COLUMN trips.travel_style IS 'Overall trip pacing preference: relaxed (lots of downtime), moderate (balanced), packed (maximize experiences). Derived from TripPreferences during generation.';

ALTER TABLE trips ADD COLUMN travel_style TEXT CHECK (
  travel_style IN ('relaxed', 'moderate', 'packed')
);

-- Trip Notes
-- User-generated content: packing lists, flight info, general reminders

COMMENT ON COLUMN trips.notes IS 'User-generated trip-level notes. Can include: packing lists, flight details, accommodation info, general reminders, or any free-form trip context.';

ALTER TABLE trips ADD COLUMN notes TEXT;

-- ============================================================================
-- INDEXES FOR QUERY PERFORMANCE
-- ============================================================================

-- Partial index for booking-required activities (common filter)
CREATE INDEX idx_activities_booking_required ON activities(booking_required) WHERE booking_required = true;

-- Index for intensity level (used in pacing calculations)
CREATE INDEX idx_activities_intensity_level ON activities(intensity_level);

-- Note: metadata already has GIN index created above

-- ============================================================================
-- UPDATE SCHEMA COMMENTS
-- ============================================================================

COMMENT ON TABLE activities IS 'Individual activities within an itinerary. Can be assigned to specific days or kept in the bucket (backlog). Most detailed information stored in metadata JSONB field for flexibility.';

COMMENT ON TABLE days IS 'Daily itinerary entries. Each day belongs to a trip and contains ordered activities. Pacing level is computed from activity intensity levels, not stored.';

COMMENT ON TABLE trips IS 'Top-level trip container. Includes destination, dates, travel style, and user notes. Contains multiple days and a bucket of unscheduled activities.';
