/**
 * Hook for syncing trips with Supabase
 * Hybrid approach: localStorage + optional cloud sync
 */

import { useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { saveTrip, getTrip, getUserTrips } from '@/lib/supabase/operations';
import { useItineraryStore } from '@/lib/store/itinerary-store';
import type { Trip } from '@/lib/types/itinerary';

export function useCloudSync() {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedTripIds, setSavedTripIds] = useState<string[]>([]);

  const { currentTrip, setCurrentTrip } = useItineraryStore();

  /**
   * Save current trip to cloud
   */
  const saveToCloud = async () => {
    if (!currentTrip) {
      setError('No trip to save');
      return null;
    }

    setIsSaving(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();

      console.log('Attempting to save trip:', {
        id: currentTrip.id,
        title: currentTrip.title,
        daysCount: currentTrip.days.length,
        bucketCount: currentTrip.bucket.length,
        firstDayId: currentTrip.days[0]?.id,
      });

      // For now, disable RLS since we don't have auth yet
      // In production, you'd use the authenticated user's ID
      const tripId = await saveTrip(supabase, currentTrip, undefined);

      // Update the trip ID in the store if it was generated
      if (tripId !== currentTrip.id) {
        setCurrentTrip({ ...currentTrip, id: tripId });
      }

      // Track saved trip IDs
      setSavedTripIds(prev => [...new Set([...prev, tripId])]);

      return tripId;
    } catch (err) {
      console.error('Full error object:', err);
      console.error('Error type:', typeof err);
      console.error('Error keys:', err ? Object.keys(err) : 'null');

      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err) || 'Failed to save to cloud';
      setError(errorMessage);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Load a trip from cloud
   */
  const loadFromCloud = async (tripId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      const trip = await getTrip(supabase, tripId);

      if (!trip) {
        setError('Trip not found');
        return null;
      }

      // Update the store with the loaded trip
      setCurrentTrip(trip);

      return trip;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load from cloud';
      setError(errorMessage);
      console.error('Error loading from cloud:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get all trips from cloud
   */
  const getAllTrips = async (): Promise<Trip[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      const trips = await getUserTrips(supabase);
      return trips;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load trips';
      setError(errorMessage);
      console.error('Error loading trips:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check if current trip is saved to cloud
   */
  const isTripSaved = currentTrip && savedTripIds.includes(currentTrip.id);

  return {
    saveToCloud,
    loadFromCloud,
    getAllTrips,
    isSaving,
    isLoading,
    error,
    isTripSaved,
  };
}