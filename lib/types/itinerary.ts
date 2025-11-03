export type ActivityCategory = 'see' | 'do' | 'eat' | 'transit' | 'rest';

export type ActivityStatus = 'planned' | 'completed' | 'skipped' | 'bucketed';

/**
 * Time of day periods for activity timing and crowd management.
 * Used for both best_time_to_visit and busiest_time_of_day fields.
 *
 * - early_morning: 6:00 AM - 9:00 AM
 * - morning: 9:00 AM - 12:00 PM
 * - midday: 12:00 PM - 2:00 PM
 * - afternoon: 2:00 PM - 5:00 PM
 * - evening: 5:00 PM - 8:00 PM
 * - night: 8:00 PM onwards
 */
export type TimeOfDay = 'early_morning' | 'morning' | 'midday' | 'afternoon' | 'evening' | 'night';

/**
 * Physical intensity levels for activities.
 * Used to calculate daily pacing and warn users about demanding days.
 *
 * - none: Sitting activities (meals, rest, transit where seated)
 * - light: < 2km walking, mostly flat terrain, < 2 hours duration, minimal stairs
 * - moderate: 2-5km walking, some elevation/stairs, 2-4 hours duration
 * - intense: > 5km walking, significant stairs/hills, > 4 hours duration, or strenuous activities (hiking, cycling)
 */
export type IntensityLevel = 'none' | 'light' | 'moderate' | 'intense';

/**
 * Daily pacing level derived from activity intensities.
 * Computed, not stored in database.
 *
 * - rest: Mostly none/light activities, lots of downtime
 * - light: Light to moderate mix, relaxed pace
 * - moderate: Moderate mix of activities, balanced day
 * - full: Heavy day with intense or many moderate activities
 */
export type PacingLevel = 'rest' | 'light' | 'moderate' | 'full';

/**
 * Strongly-typed metadata structure for Activity.
 * Most detailed activity information is stored in this flexible JSONB field.
 */
export interface ActivityMetadata {
  // Location details
  city?: string; // e.g., "Tokyo", "Kyoto", "Nara"
  area?: string; // e.g., "Shibuya", "Asakusa", "Gion"

  // Timing and crowd management
  bestTimeToVisit?: TimeOfDay[]; // Optimal times for visiting
  busiestTimeOfDay?: TimeOfDay[]; // Times to avoid due to crowds

  // Booking details
  bookingLeadTimeDays?: number; // How many days in advance to book
  bookingUrl?: string; // Direct reservation URL

  // Transportation
  station?: string; // Nearest station name
  line?: string; // Train/subway line
  exit?: string; // Which station exit to use
  walkingTimeMinutes?: number; // Walking time from station
  transportationMode?: string; // 'walk' | 'train' | 'bus' | 'taxi' | 'ferry'

  // Reference and verification
  officialWebsite?: string; // Official source for current info
  snapshotDate?: string; // ISO date when data was captured

  // Opening hours (note: may become outdated)
  openingHours?: string; // e.g., "09:00"
  closingHours?: string; // e.g., "17:00"
  closedDays?: string[]; // e.g., ["Monday", "Tuesday"]

  // Cultural context
  dressCode?: string; // e.g., "modest", "casual", "formal"
  photoPolicy?: string; // e.g., "allowed", "no_flash", "outside_only", "prohibited"
  quietRequired?: boolean; // Whether silence is expected
  shoeRemoval?: boolean; // Whether shoes must be removed

  // Seasonal information
  bestSeason?: string; // e.g., "spring", "fall", "winter"
  cherryBlossoms?: boolean; // Cherry blossom spot
  fallFoliage?: boolean; // Autumn foliage spot
  peakWeeks?: string[]; // e.g., ["late March", "early April"]

  // Food-specific metadata
  cuisine?: string; // e.g., "Sushi", "Ramen", "Kaiseki"
  style?: string; // e.g., "Omakase", "Izakaya"
  michelin?: number; // Michelin star rating
  seatsTotal?: number; // Total seats (useful for understanding exclusivity)

  // Additional flexible fields (use unknown for type safety, cast when accessing)
  [key: string]: unknown;
}

export interface Activity {
  id: string;
  title: string;
  description?: string;
  category: ActivityCategory;

  // Location
  location?: string; // Full address or landmark name

  // Timing and logistics
  duration?: number; // Duration in minutes
  cost?: number; // Estimated cost
  currency?: string; // Currency code (default: "JPY")
  timeOfDay?: string; // Specific time (e.g., "9:00 AM") or general (e.g., "afternoon")

  // Core queryable fields (stored as columns)
  bookingRequired: boolean; // Whether advance booking is required (default: false)
  intensityLevel: IntensityLevel; // Physical demand level (default: 'moderate')

  // User management
  notes?: string; // User's personal notes about the activity
  status: ActivityStatus; // Current status in the itinerary
  isAnchor?: boolean; // For activities with fixed commitments (reservations, time-sensitive)

  // Flexible semi-structured data (stored as JSONB)
  // Contains: city, area, timing, booking details, transportation, cultural tips, etc.
  metadata?: ActivityMetadata;
}

export interface DayItinerary {
  id: string;
  date: string; // ISO date string
  dayNumber: number;
  summary?: string; // e.g., "Exploring Tokyo's east side"
  activities: Activity[];
}

export interface Trip {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  destination: string;
  travelStyle?: 'relaxed' | 'moderate' | 'packed'; // Overall trip pacing preference
  notes?: string; // User-generated trip notes (packing, flights, reminders)
  days: DayItinerary[];
  bucket: Activity[]; // Activities saved for later
}

export interface TripPreferences {
  travelStyle?: 'relaxed' | 'moderate' | 'packed';
  interests?: string[];
  budget?: {
    perDay: number;
    currency: string;
  };
  sleepPreference?: 'early' | 'normal' | 'late';
}

/**
 * Calculate the pacing level for a day based on its activities.
 * Used to determine if a day is a rest day, light day, moderate, or full.
 *
 * Algorithm:
 * - Assigns scores: none=0, light=1, moderate=2, intense=3
 * - Calculates average score across all activities
 * - Maps average to pacing levels
 *
 * @param activities - Array of activities for the day
 * @returns PacingLevel - Computed pacing level
 */
export function calculateDayPacing(activities: Activity[]): PacingLevel {
  if (activities.length === 0) return 'rest';

  const intensityScore: Record<IntensityLevel, number> = {
    none: 0,
    light: 1,
    moderate: 2,
    intense: 3,
  };

  const totalScore = activities.reduce(
    (sum, activity) => sum + intensityScore[activity.intensityLevel],
    0
  );
  const avgScore = totalScore / activities.length;

  if (avgScore <= 0.5) return 'rest'; // Mostly none/light
  if (avgScore <= 1.5) return 'light'; // Light to moderate
  if (avgScore <= 2.3) return 'moderate'; // Moderate mix
  return 'full'; // Heavy day
}
