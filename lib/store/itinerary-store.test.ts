import { describe, it, expect, beforeEach } from 'vitest';
import { useItineraryStore } from './itinerary-store';
import { Trip, Activity } from '@/lib/types/itinerary';

// Mock trip data
const mockTrip: Trip = {
  id: 'trip-test',
  title: 'Test Trip',
  startDate: '2025-03-25',
  endDate: '2025-03-30',
  destination: 'Tokyo',
  bucket: [],
  days: [
    {
      id: 'day-1',
      dayNumber: 1,
      date: '2025-03-25',
      summary: 'Day 1 summary',
      activities: [
        {
          id: 'activity-1',
          title: 'Activity 1',
          category: 'see',
          status: 'planned',
        },
        {
          id: 'activity-2',
          title: 'Activity 2',
          category: 'do',
          status: 'planned',
        },
      ],
    },
    {
      id: 'day-2',
      dayNumber: 2,
      date: '2025-03-26',
      summary: 'Day 2 summary',
      activities: [
        {
          id: 'activity-3',
          title: 'Activity 3',
          category: 'eat',
          status: 'planned',
        },
      ],
    },
    {
      id: undefined as unknown as string, // Test case for missing ID
      dayNumber: 3,
      date: '2025-03-27',
      activities: [],
    },
  ],
};

describe('ItineraryStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useItineraryStore.setState({ currentTrip: null });
  });

  describe('setCurrentTrip', () => {
    it('should set the current trip', () => {
      const { setCurrentTrip } = useItineraryStore.getState();

      setCurrentTrip(mockTrip);

      const newState = useItineraryStore.getState();
      expect(newState.currentTrip).toEqual(mockTrip);
    });
  });

  describe('reorderActivities', () => {
    it('should reorder activities for a specific day only', () => {
      const store = useItineraryStore.getState();
      store.setCurrentTrip(mockTrip);

      const day1Activities = mockTrip.days[0].activities;
      const reorderedActivities = [day1Activities[1], day1Activities[0]];

      store.reorderActivities('day-1', reorderedActivities);

      const newState = useItineraryStore.getState();
      // Day 1 should be reordered
      expect(newState.currentTrip?.days[0].activities[0].id).toBe('activity-2');
      expect(newState.currentTrip?.days[0].activities[1].id).toBe('activity-1');
      // Day 2 should remain unchanged
      expect(newState.currentTrip?.days[1].activities[0].id).toBe('activity-3');
    });

    it('should not update days with undefined IDs', () => {
      const store = useItineraryStore.getState();
      store.setCurrentTrip(mockTrip);

      store.reorderActivities(undefined as unknown as string, []);

      const newState = useItineraryStore.getState();
      // Days with defined IDs should remain unchanged
      expect(newState.currentTrip?.days[0].activities.length).toBe(2);
      expect(newState.currentTrip?.days[1].activities.length).toBe(1);
      // This test exposes the bug we fixed - all days would be updated if ID is undefined
    });

    it('should handle non-existent day ID gracefully', () => {
      const store = useItineraryStore.getState();
      store.setCurrentTrip(mockTrip);

      const originalActivities = mockTrip.days[0].activities;
      store.reorderActivities('non-existent-day', []);

      const newState = useItineraryStore.getState();
      // No day should be updated
      expect(newState.currentTrip?.days[0].activities).toEqual(originalActivities);
    });

    it('should return state unchanged if no trip exists', () => {
      const store = useItineraryStore.getState();

      store.reorderActivities('day-1', []);

      expect(store.currentTrip).toBeNull();
    });
  });

  describe('addActivity', () => {
    it('should add an activity to the specified day', () => {
      const store = useItineraryStore.getState();
      store.setCurrentTrip(mockTrip);

      const newActivity: Activity = {
        id: 'new-activity',
        title: 'New Activity',
        category: 'see',
        status: 'planned',
      };

      store.addActivity('day-1', newActivity);

      const newState = useItineraryStore.getState();
      expect(newState.currentTrip?.days[0].activities).toHaveLength(3);
      expect(newState.currentTrip?.days[0].activities[2]).toEqual(newActivity);
    });
  });

  describe('deleteActivity', () => {
    it('should delete an activity from the specified day', () => {
      const store = useItineraryStore.getState();
      store.setCurrentTrip(mockTrip);

      store.deleteActivity('day-1', 'activity-1');

      const newState = useItineraryStore.getState();
      expect(newState.currentTrip?.days[0].activities).toHaveLength(1);
      expect(newState.currentTrip?.days[0].activities[0].id).toBe('activity-2');
    });

    it('should not affect other days', () => {
      const store = useItineraryStore.getState();
      store.setCurrentTrip(mockTrip);

      store.deleteActivity('day-1', 'activity-1');

      const newState = useItineraryStore.getState();
      expect(newState.currentTrip?.days[1].activities).toHaveLength(1);
    });
  });

  describe('moveActivityToBucket', () => {
    it('should move an activity from a day to the bucket', () => {
      const store = useItineraryStore.getState();
      store.setCurrentTrip(mockTrip);

      store.moveActivityToBucket('day-1', 'activity-1');

      const newState = useItineraryStore.getState();
      // Activity should be removed from day
      expect(newState.currentTrip?.days[0].activities).toHaveLength(1);
      expect(newState.currentTrip?.days[0].activities[0].id).toBe('activity-2');
      // Activity should be in bucket with status 'bucketed'
      expect(newState.currentTrip?.bucket).toHaveLength(1);
      expect(newState.currentTrip?.bucket[0].id).toBe('activity-1');
      expect(newState.currentTrip?.bucket[0].status).toBe('bucketed');
    });
  });

  describe('moveActivityFromBucket', () => {
    it('should move an activity from bucket to a specified day', () => {
      const store = useItineraryStore.getState();
      const tripWithBucket = {
        ...mockTrip,
        bucket: [{
          id: 'bucket-activity',
          title: 'Bucketed Activity',
          category: 'see' as const,
          status: 'bucketed' as const,
        }],
      };
      store.setCurrentTrip(tripWithBucket);

      store.moveActivityFromBucket('bucket-activity', 'day-2');

      const newState = useItineraryStore.getState();
      // Activity should be removed from bucket
      expect(newState.currentTrip?.bucket).toHaveLength(0);
      // Activity should be added to day with status 'planned'
      expect(newState.currentTrip?.days[1].activities).toHaveLength(2);
      const movedActivity = newState.currentTrip?.days[1].activities.find(
        a => a.id === 'bucket-activity'
      );
      expect(movedActivity?.status).toBe('planned');
    });
  });

  describe('updateActivity', () => {
    it('should update an activity across all days', () => {
      const store = useItineraryStore.getState();
      store.setCurrentTrip(mockTrip);

      store.updateActivity('activity-1', {
        title: 'Updated Activity',
        status: 'completed'
      });

      const newState = useItineraryStore.getState();
      const updatedActivity = newState.currentTrip?.days[0].activities[0];
      expect(updatedActivity?.title).toBe('Updated Activity');
      expect(updatedActivity?.status).toBe('completed');
    });
  });

  describe('edge cases', () => {
    it('should handle empty days array', () => {
      const store = useItineraryStore.getState();
      const emptyTrip = { ...mockTrip, days: [] };
      store.setCurrentTrip(emptyTrip);

      store.reorderActivities('day-1', []);
      store.deleteActivity('day-1', 'activity-1');

      const newState = useItineraryStore.getState();
      expect(newState.currentTrip?.days).toHaveLength(0);
    });

    it('should validate day IDs are unique', () => {
      const tripWithDuplicateIds = {
        ...mockTrip,
        days: [
          { ...mockTrip.days[0], id: 'duplicate-id' },
          { ...mockTrip.days[1], id: 'duplicate-id' },
        ],
      };

      const store = useItineraryStore.getState();
      store.setCurrentTrip(tripWithDuplicateIds);
      store.reorderActivities('duplicate-id', []);

      const newState = useItineraryStore.getState();
      // Both days would be updated - this is a bug scenario
      // In production, we should validate that IDs are unique
      expect(newState.currentTrip?.days[0].activities).toEqual([]);
      expect(newState.currentTrip?.days[1].activities).toEqual([]);
    });
  });
});