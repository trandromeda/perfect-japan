/**
 * Type guards and validation utilities for runtime safety
 */

import { DayItinerarySchema, ActivitySchema, TripSchema } from './schemas';
import type { DayItinerary, Activity, Trip } from '@/lib/types/itinerary';

/**
 * Runtime validation that should be added to critical paths
 */

// 1. When loading from localStorage (Zustand persist)
export function validateStoredTrip(data: unknown): Trip | null {
  const result = TripSchema.safeParse(data);
  if (!result.success) {
    console.error('Invalid stored trip data:', result.error);
    return null;
  }
  return result.data;
}

// 2. Before critical operations in the store
export function assertValidDayId(
  dayId: string | undefined,
  context: string
): asserts dayId is string {
  if (!dayId || dayId === 'undefined') {
    throw new Error(`Invalid day ID in ${context}: ${dayId}`);
  }
}

// 3. Before drag-and-drop operations
export function validateDayForReorder(day: unknown): DayItinerary {
  const result = DayItinerarySchema.safeParse(day);
  if (!result.success) {
    throw new Error('Invalid day data for reordering');
  }
  if (!result.data.id) {
    throw new Error('Day must have an ID for reordering');
  }
  return result.data;
}

// 4. Type guard for safer operations
export function isDayItinerary(value: unknown): value is DayItinerary {
  return DayItinerarySchema.safeParse(value).success;
}

export function isActivity(value: unknown): value is Activity {
  return ActivitySchema.safeParse(value).success;
}

// 5. Development-only assertions
export function assertValidTrip(trip: unknown): asserts trip is Trip {
  if (process.env.NODE_ENV === 'development') {
    const result = TripSchema.safeParse(trip);
    if (!result.success) {
      console.error('Trip validation failed:', result.error.format());
      throw new Error('Invalid trip structure');
    }
  }
}

/**
 * Example usage in store:
 *
 * reorderActivities: (dayId, activities) => set((state) => {
 *   assertValidDayId(dayId, 'reorderActivities');
 *   // ... rest of the function
 * })
 */