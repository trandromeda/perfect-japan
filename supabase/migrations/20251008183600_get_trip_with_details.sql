-- Create a function to get a trip with all its nested data
-- This includes days with their activities, and bucket activities

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
