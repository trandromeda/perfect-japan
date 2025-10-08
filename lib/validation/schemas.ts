import { z } from 'zod';

// Activity validation schemas
export const ActivityCategorySchema = z.enum(['see', 'do', 'eat', 'transit', 'rest']);
export const ActivityStatusSchema = z.enum(['planned', 'completed', 'skipped', 'bucketed']);

export const ActivitySchema = z.object({
  id: z.string().min(1, 'Activity ID is required'),
  title: z.string().min(1, 'Activity title is required'),
  description: z.string().optional(),
  category: ActivityCategorySchema,
  location: z.string().optional(),
  duration: z.number().min(0).optional(), // in minutes
  cost: z.number().min(0).optional(),
  currency: z.string().optional(),
  notes: z.string().optional(),
  status: ActivityStatusSchema,
  isAnchor: z.boolean().optional(),
  timeOfDay: z.string().optional(),
});

// Day itinerary schema
export const DayItinerarySchema = z.object({
  id: z.string().min(1, 'Day ID is required'),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  dayNumber: z.number().min(1),
  summary: z.string().optional(),
  activities: z.array(ActivitySchema),
});

// Trip schema
export const TripSchema = z.object({
  id: z.string().min(1, 'Trip ID is required'),
  title: z.string().min(1, 'Trip title is required'),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid start date format',
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid end date format',
  }),
  destination: z.string().min(1, 'Destination is required'),
  days: z.array(DayItinerarySchema),
  bucket: z.array(ActivitySchema),
});

// API request schemas
export const GenerateItineraryRequestSchema = z.object({
  destination: z.string().min(1, 'Destination is required'),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid start date format',
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid end date format',
  }),
  interests: z.array(z.string()).optional(),
  travelStyle: z.enum(['relaxed', 'moderate', 'packed']).optional(),
});

// OpenAI response schema (without IDs)
export const OpenAIActivitySchema = ActivitySchema.omit({ id: true }).extend({
  id: z.string(), // OpenAI does provide activity IDs
});

export const OpenAIDaySchema = z.object({
  dayNumber: z.number(),
  date: z.string(),
  summary: z.string().optional(),
  activities: z.array(OpenAIActivitySchema),
  // Note: no id field expected from OpenAI
});

export const OpenAIResponseSchema = z.object({
  days: z.array(OpenAIDaySchema),
});

// Type exports
export type Activity = z.infer<typeof ActivitySchema>;
export type DayItinerary = z.infer<typeof DayItinerarySchema>;
export type Trip = z.infer<typeof TripSchema>;
export type GenerateItineraryRequest = z.infer<typeof GenerateItineraryRequestSchema>;
export type OpenAIResponse = z.infer<typeof OpenAIResponseSchema>;

// Validation helpers
export function validateTrip(data: unknown): Trip {
  return TripSchema.parse(data);
}

export function validateDayItinerary(data: unknown): DayItinerary {
  return DayItinerarySchema.parse(data);
}

export function validateActivity(data: unknown): Activity {
  return ActivitySchema.parse(data);
}

// Safe validation (returns errors instead of throwing)
export function safeValidateTrip(data: unknown) {
  return TripSchema.safeParse(data);
}

export function safeValidateDayItinerary(data: unknown) {
  return DayItinerarySchema.safeParse(data);
}

// Development-only validation with detailed logging
export function validateWithLogging<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context: string
): T {
  if (process.env.NODE_ENV === 'development') {
    const result = schema.safeParse(data);
    if (!result.success) {
      console.error(`[Validation Error] ${context}:`, result.error.format());
      throw new Error(`Validation failed for ${context}: ${result.error.message}`);
    }
    console.log(`[Validation Success] ${context}`);
    return result.data;
  }
  return schema.parse(data);
}