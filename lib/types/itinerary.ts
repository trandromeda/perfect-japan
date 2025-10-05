export type ActivityCategory = 'see' | 'do' | 'eat' | 'transit' | 'rest';

export type ActivityStatus = 'planned' | 'completed' | 'skipped' | 'bucketed';

export interface Activity {
  id: string;
  title: string;
  description?: string;
  category: ActivityCategory;
  location?: string;
  duration?: number; // in minutes
  cost?: number;
  currency?: string;
  notes?: string;
  status: ActivityStatus;
  isAnchor?: boolean; // For activities with reservations/commitments
  timeOfDay?: string; // e.g., "9:00 AM", "afternoon"
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
