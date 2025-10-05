import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Activity, Trip } from '@/lib/types/itinerary';

interface ItineraryState {
  currentTrip: Trip | null;
  setCurrentTrip: (trip: Trip) => void;

  // Activity management
  addActivity: (dayId: string, activity: Activity) => void;
  updateActivity: (activityId: string, updates: Partial<Activity>) => void;
  deleteActivity: (dayId: string, activityId: string) => void;
  reorderActivities: (dayId: string, activities: Activity[]) => void;

  // Bucket management
  moveActivityToBucket: (dayId: string, activityId: string) => void;
  moveActivityFromBucket: (activityId: string, dayId: string) => void;
  removeFromBucket: (activityId: string) => void;

  // Day management
  updateDaySummary: (dayId: string, summary: string) => void;
}

export const useItineraryStore = create<ItineraryState>()(
  persist(
    (set) => ({
      currentTrip: null,

  setCurrentTrip: (trip) => set({ currentTrip: trip }),

  addActivity: (dayId, activity) => set((state) => {
    if (!state.currentTrip) return state;

    const updatedDays = state.currentTrip.days.map(day =>
      day.id === dayId
        ? { ...day, activities: [...day.activities, activity] }
        : day
    );

    return {
      currentTrip: {
        ...state.currentTrip,
        days: updatedDays
      }
    };
  }),

  updateActivity: (activityId, updates) => set((state) => {
    if (!state.currentTrip) return state;

    const updatedDays = state.currentTrip.days.map(day => ({
      ...day,
      activities: day.activities.map(activity =>
        activity.id === activityId
          ? { ...activity, ...updates }
          : activity
      )
    }));

    return {
      currentTrip: {
        ...state.currentTrip,
        days: updatedDays
      }
    };
  }),

  deleteActivity: (dayId, activityId) => set((state) => {
    if (!state.currentTrip) return state;

    const updatedDays = state.currentTrip.days.map(day =>
      day.id === dayId
        ? { ...day, activities: day.activities.filter(a => a.id !== activityId) }
        : day
    );

    return {
      currentTrip: {
        ...state.currentTrip,
        days: updatedDays
      }
    };
  }),

  reorderActivities: (dayId, activities) => set((state) => {
    if (!state.currentTrip) return state;

    const updatedDays = state.currentTrip.days.map(day =>
      day.id === dayId
        ? { ...day, activities }
        : day
    );

    return {
      currentTrip: {
        ...state.currentTrip,
        days: updatedDays
      }
    };
  }),

  moveActivityToBucket: (dayId, activityId) => set((state) => {
    if (!state.currentTrip) return state;

    let activityToMove: Activity | undefined;

    const updatedDays = state.currentTrip.days.map(day => {
      if (day.id === dayId) {
        const activity = day.activities.find(a => a.id === activityId);
        if (activity) {
          activityToMove = { ...activity, status: 'bucketed' as const };
        }
        return {
          ...day,
          activities: day.activities.filter(a => a.id !== activityId)
        };
      }
      return day;
    });

    if (!activityToMove) return state;

    return {
      currentTrip: {
        ...state.currentTrip,
        days: updatedDays,
        bucket: [...state.currentTrip.bucket, activityToMove]
      }
    };
  }),

  moveActivityFromBucket: (activityId, dayId) => set((state) => {
    if (!state.currentTrip) return state;

    const activityToMove = state.currentTrip.bucket.find(a => a.id === activityId);
    if (!activityToMove) return state;

    const updatedActivity = { ...activityToMove, status: 'planned' as const };

    const updatedDays = state.currentTrip.days.map(day =>
      day.id === dayId
        ? { ...day, activities: [...day.activities, updatedActivity] }
        : day
    );

    return {
      currentTrip: {
        ...state.currentTrip,
        days: updatedDays,
        bucket: state.currentTrip.bucket.filter(a => a.id !== activityId)
      }
    };
  }),

  removeFromBucket: (activityId) => set((state) => {
    if (!state.currentTrip) return state;

    return {
      currentTrip: {
        ...state.currentTrip,
        bucket: state.currentTrip.bucket.filter(a => a.id !== activityId)
      }
    };
  }),

  updateDaySummary: (dayId, summary) => set((state) => {
    if (!state.currentTrip) return state;

    const updatedDays = state.currentTrip.days.map(day =>
      day.id === dayId
        ? { ...day, summary }
        : day
    );

    return {
      currentTrip: {
        ...state.currentTrip,
        days: updatedDays
      }
    };
  }),
    }),
    {
      name: 'perfect-japan-storage', // localStorage key
    }
  )
);
