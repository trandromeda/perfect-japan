/**
 * Database operations for Perfect Japan
 * These functions provide a clean API for interacting with Supabase
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Trip, Activity, ActivityCategory, ActivityStatus } from '@/lib/types/itinerary';
import type { Database } from '@/lib/database.types';

/**
 * Database response types
 */
interface DbActivity {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  location?: string | null;
  duration?: number | null;
  cost?: number | null;
  currency?: string | null;
  notes?: string | null;
  status: string;
  is_anchor?: boolean | null;
  time_of_day?: string | null;
  position?: number | null;
}

interface DbDay {
  id: string;
  day_number: number;
  date: string;
  summary?: string | null;
  activities?: DbActivity[] | null;
}

interface DbTrip {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  destination: string;
  days?: DbDay[] | null;
  bucket?: DbActivity[] | null;
}

/**
 * Save a complete trip to the database
 * This will insert the trip, days, and activities
 */
export async function saveTrip(
  supabase: SupabaseClient,
  trip: Omit<Trip, 'id'> & { id?: string },
  userId?: string
) {
  // 1. Insert the trip
  const { data: tripData, error: tripError } = await supabase
    .from('trips')
    .insert({
      id: trip.id,
      user_id: userId,
      title: trip.title,
      destination: trip.destination,
      start_date: trip.startDate,
      end_date: trip.endDate,
    })
    .select()
    .single();

  if (tripError) {
    console.error('Trip insert error:', tripError);
    throw tripError;
  }

  // 2. Insert days
  const daysToInsert = trip.days.map((day) => ({
    id: day.id,
    trip_id: tripData.id,
    day_number: day.dayNumber,
    date: day.date,
    summary: day.summary,
  }));

  const { error: daysError } = await supabase
    .from('days')
    .insert(daysToInsert);

  if (daysError) {
    console.error('Days insert error:', daysError);
    throw daysError;
  }

  // 3. Insert activities (both in days and bucket)
  const activitiesToInsert: Database['public']['Tables']['activities']['Insert'][] = [];

  // Activities in days
  for (const day of trip.days) {
    day.activities.forEach((activity, index) => {
      activitiesToInsert.push({
        id: activity.id,
        trip_id: tripData.id,
        day_id: day.id,
        title: activity.title,
        description: activity.description,
        category: activity.category,
        location: activity.location,
        duration: activity.duration,
        cost: activity.cost,
        currency: activity.currency,
        notes: activity.notes,
        status: activity.status,
        is_anchor: activity.isAnchor,
        time_of_day: activity.timeOfDay,
        position: index,
      });
    });
  }

  // Bucket activities (no day_id)
  trip.bucket.forEach((activity) => {
    activitiesToInsert.push({
      id: activity.id,
      trip_id: tripData.id,
      day_id: null,
      title: activity.title,
      description: activity.description,
      category: activity.category,
      location: activity.location,
      duration: activity.duration,
      cost: activity.cost,
      currency: activity.currency,
      notes: activity.notes,
      status: activity.status,
      is_anchor: activity.isAnchor,
      time_of_day: activity.timeOfDay,
      position: null,
    });
  });

  if (activitiesToInsert.length > 0) {
    const { error: activitiesError } = await supabase
      .from('activities')
      .insert(activitiesToInsert);

    if (activitiesError) {
      console.error('Activities insert error:', activitiesError);
      throw activitiesError;
    }
  }

  return tripData.id;
}

/**
 * Get a trip with all its days and activities
 */
export async function getTrip(
  supabase: SupabaseClient,
  tripId: string
): Promise<Trip | null> {
  // Use the custom SQL function for efficient nested query
  const { data, error } = await supabase
    .rpc('get_trip_with_details', { trip_uuid: tripId })
    .single();

  if (error) {
    console.error('Error fetching trip:', error);
    return null;
  }

  if (!data) return null;

  // Transform database format to app format
  // RPC returns Json type, so we need to cast it to our expected structure
  return transformDatabaseTrip(data as unknown as DbTrip);
}

/**
 * Get all trips for the current user
 */
export async function getUserTrips(
  supabase: SupabaseClient
): Promise<Trip[]> {
  const { data: trips, error } = await supabase
    .from('trips')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Fetch full details for each trip
  const fullTrips = await Promise.all(
    trips.map((trip) => getTrip(supabase, trip.id))
  );

  return fullTrips.filter((trip): trip is Trip => trip !== null);
}

/**
 * Update activity positions after reordering
 */
export async function reorderActivities(
  supabase: SupabaseClient,
  dayId: string,
  activityIds: string[]
) {
  // Update position for each activity
  const updates = activityIds.map((activityId, index) => ({
    id: activityId,
    position: index,
  }));

  const { error } = await supabase
    .from('activities')
    .upsert(updates, { onConflict: 'id' });

  if (error) throw error;
}

/**
 * Move activity to bucket
 */
export async function moveActivityToBucket(
  supabase: SupabaseClient,
  activityId: string
) {
  const { error } = await supabase
    .from('activities')
    .update({
      day_id: null,
      status: 'bucketed',
      position: null,
    })
    .eq('id', activityId);

  if (error) throw error;
}

/**
 * Move activity from bucket to a day
 */
export async function moveActivityFromBucket(
  supabase: SupabaseClient,
  activityId: string,
  dayId: string,
  position: number
) {
  const { error } = await supabase
    .from('activities')
    .update({
      day_id: dayId,
      status: 'planned',
      position,
    })
    .eq('id', activityId);

  if (error) throw error;
}

/**
 * Delete a trip and all its associated data
 * (CASCADE will handle days and activities)
 */
export async function deleteTrip(
  supabase: SupabaseClient,
  tripId: string
) {
  const { error } = await supabase
    .from('trips')
    .delete()
    .eq('id', tripId);

  if (error) throw error;
}

/**
 * Update activity status (planned, completed, skipped)
 */
export async function updateActivityStatus(
  supabase: SupabaseClient,
  activityId: string,
  status: Activity['status']
) {
  const { error } = await supabase
    .from('activities')
    .update({ status })
    .eq('id', activityId);

  if (error) throw error;
}

/**
 * Helper: Transform database format to app format
 */
function transformDatabaseTrip(data: DbTrip): Trip {
  return {
    id: data.id,
    title: data.title,
    startDate: data.start_date,
    endDate: data.end_date,
    destination: data.destination,
    days: (data.days || []).map((day: DbDay) => ({
      id: day.id,
      dayNumber: day.day_number,
      date: day.date,
      summary: day.summary ?? undefined,
      activities: (day.activities || []).map((activity: DbActivity) => ({
        id: activity.id,
        title: activity.title,
        description: activity.description ?? undefined,
        category: activity.category as ActivityCategory,
        location: activity.location ?? undefined,
        duration: activity.duration ?? undefined,
        cost: activity.cost ?? undefined,
        currency: activity.currency ?? undefined,
        notes: activity.notes ?? undefined,
        status: activity.status as ActivityStatus,
        isAnchor: activity.is_anchor ?? undefined,
        timeOfDay: activity.time_of_day ?? undefined,
      })),
    })),
    bucket: (data.bucket || []).map((activity: DbActivity) => ({
      id: activity.id,
      title: activity.title,
      description: activity.description ?? undefined,
      category: activity.category as ActivityCategory,
      location: activity.location ?? undefined,
      duration: activity.duration ?? undefined,
      cost: activity.cost ?? undefined,
      currency: activity.currency ?? undefined,
      notes: activity.notes ?? undefined,
      status: activity.status as ActivityStatus,
      isAnchor: activity.is_anchor ?? undefined,
      timeOfDay: activity.time_of_day ?? undefined,
    })),
  };
}