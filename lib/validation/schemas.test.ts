import { describe, it, expect } from 'vitest';
import {
  ActivitySchema,
  DayItinerarySchema,
  TripSchema,
  GenerateItineraryRequestSchema,
  OpenAIDaySchema,
  safeValidateDayItinerary,
} from './schemas';

describe('Validation Schemas', () => {
  describe('ActivitySchema', () => {
    it('should validate a complete activity', () => {
      const validActivity = {
        id: 'act-1',
        title: 'Visit Senso-ji Temple',
        description: 'Famous temple in Asakusa',
        category: 'see',
        location: 'Asakusa, Tokyo',
        duration: 60,
        cost: 0,
        currency: 'JPY',
        notes: 'Best visited in the morning',
        status: 'planned',
        isAnchor: false,
        timeOfDay: '9:00 AM',
      };

      const result = ActivitySchema.safeParse(validActivity);
      expect(result.success).toBe(true);
    });

    it('should fail if activity ID is missing', () => {
      const invalidActivity = {
        title: 'Visit Temple',
        category: 'see',
        status: 'planned',
        // missing id
      };

      const result = ActivitySchema.safeParse(invalidActivity);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('id');
      }
    });

    it('should fail with invalid category', () => {
      const invalidActivity = {
        id: 'act-1',
        title: 'Activity',
        category: 'invalid-category',
        status: 'planned',
      };

      const result = ActivitySchema.safeParse(invalidActivity);
      expect(result.success).toBe(false);
    });

    it('should accept optional fields as undefined', () => {
      const minimalActivity = {
        id: 'act-1',
        title: 'Minimal Activity',
        category: 'see',
        status: 'planned',
      };

      const result = ActivitySchema.safeParse(minimalActivity);
      expect(result.success).toBe(true);
    });
  });

  describe('DayItinerarySchema', () => {
    it('should validate a day with activities', () => {
      const validDay = {
        id: 'day-1',
        date: '2025-03-25',
        dayNumber: 1,
        summary: 'Arrival day',
        activities: [
          {
            id: 'act-1',
            title: 'Activity 1',
            category: 'see',
            status: 'planned',
          },
        ],
      };

      const result = DayItinerarySchema.safeParse(validDay);
      expect(result.success).toBe(true);
    });

    it('should fail if day ID is missing', () => {
      const invalidDay = {
        // missing id
        date: '2025-03-25',
        dayNumber: 1,
        activities: [],
      };

      const result = DayItinerarySchema.safeParse(invalidDay);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('id'))).toBe(true);
      }
    });

    it('should fail if day ID is undefined', () => {
      const invalidDay = {
        id: undefined,
        date: '2025-03-25',
        dayNumber: 1,
        activities: [],
      };

      const result = DayItinerarySchema.safeParse(invalidDay);
      expect(result.success).toBe(false);
    });

    it('should fail with invalid date format', () => {
      const invalidDay = {
        id: 'day-1',
        date: 'not-a-date',
        dayNumber: 1,
        activities: [],
      };

      const result = DayItinerarySchema.safeParse(invalidDay);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid date format');
      }
    });

    it('should fail with negative day number', () => {
      const invalidDay = {
        id: 'day-1',
        date: '2025-03-25',
        dayNumber: 0,
        activities: [],
      };

      const result = DayItinerarySchema.safeParse(invalidDay);
      expect(result.success).toBe(false);
    });
  });

  describe('OpenAIDaySchema', () => {
    it('should validate OpenAI response without day ID', () => {
      const openAIDay = {
        dayNumber: 1,
        date: '2025-03-25',
        summary: 'Day summary',
        activities: [
          {
            id: 'activity-1',
            title: 'Activity',
            category: 'see',
            status: 'planned',
          },
        ],
      };

      const result = OpenAIDaySchema.safeParse(openAIDay);
      expect(result.success).toBe(true);
    });

    it('should not require day ID field', () => {
      const dayWithoutId = {
        dayNumber: 1,
        date: '2025-03-25',
        activities: [],
      };

      const result = OpenAIDaySchema.safeParse(dayWithoutId);
      expect(result.success).toBe(true);
    });
  });

  describe('GenerateItineraryRequestSchema', () => {
    it('should validate a complete request', () => {
      const validRequest = {
        destination: 'Tokyo',
        startDate: '2025-03-25',
        endDate: '2025-03-30',
        interests: ['temples', 'food', 'anime'],
        travelStyle: 'moderate',
      };

      const result = GenerateItineraryRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should fail with empty destination', () => {
      const invalidRequest = {
        destination: '',
        startDate: '2025-03-25',
        endDate: '2025-03-30',
      };

      const result = GenerateItineraryRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Destination is required');
      }
    });

    it('should fail with invalid travel style', () => {
      const invalidRequest = {
        destination: 'Tokyo',
        startDate: '2025-03-25',
        endDate: '2025-03-30',
        travelStyle: 'extreme',
      };

      const result = GenerateItineraryRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should accept request without optional fields', () => {
      const minimalRequest = {
        destination: 'Tokyo',
        startDate: '2025-03-25',
        endDate: '2025-03-30',
      };

      const result = GenerateItineraryRequestSchema.safeParse(minimalRequest);
      expect(result.success).toBe(true);
    });
  });

  describe('TripSchema', () => {
    it('should validate a complete trip', () => {
      const validTrip = {
        id: 'trip-1',
        title: 'Tokyo Adventure',
        startDate: '2025-03-25',
        endDate: '2025-03-30',
        destination: 'Tokyo',
        days: [
          {
            id: 'day-1',
            date: '2025-03-25',
            dayNumber: 1,
            activities: [],
          },
        ],
        bucket: [],
      };

      const result = TripSchema.safeParse(validTrip);
      expect(result.success).toBe(true);
    });

    it('should fail if any day is missing an ID', () => {
      const tripWithInvalidDay = {
        id: 'trip-1',
        title: 'Tokyo Trip',
        startDate: '2025-03-25',
        endDate: '2025-03-30',
        destination: 'Tokyo',
        days: [
          {
            id: 'day-1',
            date: '2025-03-25',
            dayNumber: 1,
            activities: [],
          },
          {
            // missing id
            date: '2025-03-26',
            dayNumber: 2,
            activities: [],
          },
        ],
        bucket: [],
      };

      const result = TripSchema.safeParse(tripWithInvalidDay);
      expect(result.success).toBe(false);
    });
  });

  describe('Safe validation helpers', () => {
    it('should return success result for valid data', () => {
      const validDay = {
        id: 'day-1',
        date: '2025-03-25',
        dayNumber: 1,
        activities: [],
      };

      const result = safeValidateDayItinerary(validDay);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('day-1');
      }
    });

    it('should return error result for invalid data', () => {
      const invalidDay = {
        // missing required fields
        dayNumber: 1,
      };

      const result = safeValidateDayItinerary(invalidDay);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });
  });
});