# Database Schema Fields Guide

**Last Updated:** 2025-01-02
**Purpose:** Comprehensive documentation of database fields
**Philosophy:** YAGNI (You Aren't Gonna Need It) - Only add columns for fields we know we'll query. Everything else goes in flexible metadata.

---

## Table of Contents

1. [Overview](#overview)
2. [Activities Table](#activities-table)
3. [Days Table](#days-table)
4. [Trips Table](#trips-table)
5. [Working with Metadata](#working-with-metadata)
6. [Field Calculation Functions](#field-calculation-functions)
7. [Usage Examples](#usage-examples)

---

## Overview

### Design Philosophy

**Minimal Schema + Flexible Metadata**
- Store only **queryable fields** as database columns
- Store **display/informational data** in JSONB metadata
- Can promote metadata fields to columns later if we find we're querying them frequently

**3 New Activity Fields:**
1. `booking_required` - Boolean column for filtering
2. `intensity_level` - Required for pacing calculation
3. `metadata` - JSONB for everything else (city, area, timing, transportation, cultural tips, etc.)

---

## Activities Table

### Core Fields (Existing)

#### `id`, `trip_id`, `day_id`
Standard identifiers and foreign keys.

#### `title` (TEXT, NOT NULL)
Specific activity name.
- **Example:** "Senso-ji Temple", "Sukiyabashi Jiro", "Fushimi Inari Shrine"
- **Guidelines:** Use specific names, not generic descriptions

#### `description` (TEXT, NULLABLE)
Rich narrative with practical information.

**Recommended Format:**
```markdown
[Brief overview of what makes this special]

🏛️ **About:** Historical/cultural context

🚇 **Getting There:** Station, line, exit, walking time

⏰ **Timing:** Best time to visit, crowd patterns

💴 **Cost:** Detailed pricing

📸 **Tips:** Photo spots, etiquette, what to try
```

#### `category` (TEXT, NOT NULL)
- **Values:** `'see' | 'do' | 'eat' | 'transit' | 'rest'`

#### `location`, `duration`, `cost`, `currency`, `timeOfDay`
Standard fields (already existed).

#### `status`, `notes`, `isAnchor`, `position`
User management fields (already existed).

---

### New Fields (Enhanced Schema)

#### `booking_required` (BOOLEAN, NOT NULL, DEFAULT false)
Whether advance booking/reservation is required or strongly recommended.

**Why a dedicated column?**
- High-value filter: "Show me everything I need to book"
- Simple boolean = fast queries
- Clear actionable information

**When to set true:**
- Popular restaurants (especially omakase, kaiseki)
- Timed entry attractions (TeamLab, Ghibli Museum)
- Special experiences (tea ceremony, sumo tickets)
- Anything likely to sell out

**Query Example:**
```sql
-- Find all activities needing booking
SELECT title, metadata->>'bookingLeadTimeDays', metadata->>'bookingUrl'
FROM activities
WHERE booking_required = true
ORDER BY (metadata->>'bookingLeadTimeDays')::int DESC NULLS LAST;
```

---

#### `intensity_level` (TEXT, NOT NULL, DEFAULT 'moderate')
Physical demand level of the activity.

**Why a dedicated column?**
- Required for calculating daily pacing
- Computed on frequently (every day needs pacing level)
- Clear enumeration for validation

**Values:** `'none' | 'light' | 'moderate' | 'intense'`

**Objective Definitions:**

| Level | Walking | Duration | Terrain | Stairs | Examples |
|-------|---------|----------|---------|--------|----------|
| **none** | Sitting | Any | N/A | None | Meals, train rides, hotel rest, performances |
| **light** | < 2km | < 2hrs | Mostly flat | Minimal | Small museum, garden stroll, shopping, cafes |
| **moderate** | 2-5km | 2-4hrs | Some hills | Some flights | Temple complex, walking tour, market, castle |
| **intense** | > 5km | > 4hrs | Hills/mountains | Many flights | Mt. Fuji, full Fushimi Inari, bamboo trail, cycling |

**Purpose:**
- Calculate daily pacing: `rest | light | moderate | full`
- Warn users about demanding days
- Balance itinerary (avoid too many intense days in a row)

**Example Ratings:**
```typescript
Senso-ji Temple tour: 'moderate'  // 2-3km walking, Nakamise street, some stairs
Kaiseki dinner: 'none'            // Seated meal
Shibuya crossing: 'light'         // Short walk, mostly standing
Full Fushimi Inari: 'intense'     // 4-5km, 1000+ stairs, 3+ hours
TeamLab Borderless: 'light'       // Indoor, 1-2 hours, air-conditioned
```

---

#### `metadata` (JSONB, NULLABLE)
Flexible field for semi-structured data. **Most detailed information goes here.**

**Why JSONB instead of separate columns?**
- ✅ Don't know what we'll actually query yet (YAGNI)
- ✅ Easy to add new fields without migrations
- ✅ Can promote to dedicated column later if needed
- ✅ Still queryable with GIN index
- ✅ Perfect for display-oriented information

**Common Structure:**
See [Working with Metadata](#working-with-metadata) section below.

---

## Days Table

### Existing Fields
- `id`, `trip_id`, `dayNumber`, `date`, `summary`
- `created_at`, `updated_at`

### No New Fields
- Pacing level is **computed**, not stored (see `calculateDayPacing()`)

---

## Trips Table

### Existing Fields
- `id`, `user_id`, `title`, `destination`, `startDate`, `endDate`
- `created_at`, `updated_at`

### New Fields

#### `travel_style` (TEXT, NULLABLE)
Overall trip pacing preference.
- **Values:** `'relaxed' | 'moderate' | 'packed'`
- **relaxed:** Fewer activities, lots of downtime
- **moderate:** Balanced mix
- **packed:** Maximize experiences

**Purpose:** Derived from TripPreferences during generation; helps AI understand desired intensity.

#### `notes` (TEXT, NULLABLE)
User-generated trip-level notes.
- Packing lists, flight info, hotel confirmations, reminders

---

## Working with Metadata

### ActivityMetadata TypeScript Interface

```typescript
interface ActivityMetadata {
  // Location
  city?: string;              // "Tokyo", "Kyoto", "Nara"
  area?: string;              // "Shibuya", "Asakusa", "Gion"

  // Timing and crowds
  bestTimeToVisit?: TimeOfDay[];      // ["early_morning", "evening"]
  busiestTimeOfDay?: TimeOfDay[];     // ["morning", "midday", "afternoon"]

  // Booking details (if bookingRequired = true)
  bookingLeadTimeDays?: number;       // 30
  bookingUrl?: string;                // Direct reservation URL

  // Transportation
  station?: string;                   // "Asakusa"
  line?: string;                      // "Ginza Line"
  exit?: string;                      // "1"
  walkingTimeMinutes?: number;        // 3
  transportationMode?: string;        // "walk" | "train" | "bus"

  // Reference
  officialWebsite?: string;           // For current hours/prices/closures
  snapshotDate?: string;              // When data was captured (ISO date)

  // Opening hours (may become outdated)
  openingHours?: string;              // "09:00"
  closingHours?: string;              // "17:00"
  closedDays?: string[];              // ["Monday", "Tuesday"]

  // Cultural context
  dressCode?: string;                 // "modest" | "casual" | "formal"
  photoPolicy?: string;               // "allowed" | "no_flash" | "outside_only"
  quietRequired?: boolean;
  shoeRemoval?: boolean;

  // Seasonal
  bestSeason?: string;                // "spring" | "fall" | "winter"
  cherryBlossoms?: boolean;
  fallFoliage?: boolean;
  peakWeeks?: string[];               // ["late March", "early April"]

  // Food-specific (for category='eat')
  cuisine?: string;                   // "Sushi" | "Ramen" | "Kaiseki"
  style?: string;                     // "Omakase" | "Izakaya"
  michelin?: number;                  // 1, 2, or 3
  seatsTotal?: number;                // Total seats (exclusivity indicator)

  // Additional flexible fields
  [key: string]: any;
}
```

### Time of Day Values

```typescript
type TimeOfDay =
  | 'early_morning'  // 6:00 AM - 9:00 AM
  | 'morning'        // 9:00 AM - 12:00 PM
  | 'midday'         // 12:00 PM - 2:00 PM
  | 'afternoon'      // 2:00 PM - 5:00 PM
  | 'evening'        // 5:00 PM - 8:00 PM
  | 'night';         // 8:00 PM onwards
```

### Example Metadata

**Temple Visit:**
```json
{
  "city": "Tokyo",
  "area": "Asakusa",
  "bestTimeToVisit": ["early_morning"],
  "busiestTimeOfDay": ["morning", "midday", "afternoon"],
  "station": "Asakusa",
  "line": "Ginza Line",
  "exit": "1",
  "walkingTimeMinutes": 3,
  "officialWebsite": "https://www.senso-ji.jp/",
  "photoPolicy": "allowed_outside_only",
  "quietRequired": true,
  "shoeRemoval": true,
  "bestSeason": "spring",
  "cherryBlossoms": true
}
```

**Restaurant:**
```json
{
  "city": "Tokyo",
  "area": "Ginza",
  "bookingLeadTimeDays": 30,
  "bookingUrl": "https://...",
  "cuisine": "Sushi",
  "style": "Omakase",
  "michelin": 3,
  "seatsTotal": 10,
  "officialWebsite": "https://...",
  "dressCode": "smart_casual"
}
```

**Museum:**
```json
{
  "city": "Tokyo",
  "area": "Odaiba",
  "bestTimeToVisit": ["evening", "night"],
  "busiestTimeOfDay": ["afternoon", "evening"],
  "bookingLeadTimeDays": 7,
  "bookingUrl": "https://teamlab.art/e/borderless/",
  "station": "Aomi",
  "line": "Yurikamome Line",
  "exit": "North",
  "walkingTimeMinutes": 5,
  "officialWebsite": "https://teamlab.art/",
  "photoPolicy": "allowed"
}
```

---

## Field Calculation Functions

### `calculateDayPacing(activities: Activity[]): PacingLevel`

Computes pacing level for a day based on activity intensity levels.

**Algorithm:**
1. Assign scores: `none=0, light=1, moderate=2, intense=3`
2. Calculate average score across all activities
3. Map to pacing level:
   - `≤ 0.5` → `'rest'` (Mostly none/light)
   - `≤ 1.5` → `'light'` (Light to moderate)
   - `≤ 2.3` → `'moderate'` (Moderate mix)
   - `> 2.3` → `'full'` (Heavy day)

**Implementation:**
```typescript
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

  if (avgScore <= 0.5) return 'rest';
  if (avgScore <= 1.5) return 'light';
  if (avgScore <= 2.3) return 'moderate';
  return 'full';
}
```

**Example:**
```typescript
// Day with: 1 rest (none), 2 temples (moderate), 1 meal (none)
const activities = [
  { intensityLevel: 'none' },      // 0
  { intensityLevel: 'moderate' },  // 2
  { intensityLevel: 'moderate' },  // 2
  { intensityLevel: 'none' }       // 0
];
// Total: 4, Average: 1.0 → "light" day
```

---

## Usage Examples

### TypeScript Examples

**Accessing Metadata:**
```typescript
const activity: Activity = { /* ... */ };

// Type-safe metadata access
const city = activity.metadata?.city;
const area = activity.metadata?.area;
const needsEarlyVisit = activity.metadata?.bestTimeToVisit?.includes('early_morning');

// Check if booking needed
if (activity.bookingRequired) {
  const leadTime = activity.metadata?.bookingLeadTimeDays || 0;
  console.log(`Book ${activity.title} at least ${leadTime} days in advance`);
  if (activity.metadata?.bookingUrl) {
    console.log(`Reserve at: ${activity.metadata.bookingUrl}`);
  }
}
```

**Filter Activities by City:**
```typescript
const tokyoActivities = trip.days
  .flatMap(day => day.activities)
  .filter(activity => activity.metadata?.city === 'Tokyo');
```

**Find Booking-Required Activities:**
```typescript
const needsBooking = trip.days
  .flatMap(day => day.activities)
  .filter(activity => activity.bookingRequired)
  .sort((a, b) =>
    (b.metadata?.bookingLeadTimeDays || 0) -
    (a.metadata?.bookingLeadTimeDays || 0)
  );

// Book longest lead time first
needsBooking.forEach(activity => {
  console.log(
    `📅 ${activity.title}: Book ${activity.metadata?.bookingLeadTimeDays} days ahead`
  );
});
```

**Check Daily Pacing:**
```typescript
import { calculateDayPacing } from '@/lib/types/itinerary';

trip.days.forEach(day => {
  const pacing = calculateDayPacing(day.activities);
  console.log(`Day ${day.dayNumber}: ${pacing} day`);

  if (pacing === 'full') {
    console.warn(`⚠️ Day ${day.dayNumber} is demanding - consider rest day after`);
  }
});
```

**Warn About Consecutive Intense Days:**
```typescript
let consecutiveFullDays = 0;
trip.days.forEach(day => {
  const pacing = calculateDayPacing(day.activities);

  if (pacing === 'full') {
    consecutiveFullDays++;
    if (consecutiveFullDays >= 3) {
      console.warn(
        `⚠️ Day ${day.dayNumber}: ${consecutiveFullDays} full days in a row - burnout risk!`
      );
    }
  } else {
    consecutiveFullDays = 0;
  }
});
```

---

### SQL Examples

**Find All Booking-Required Activities:**
```sql
SELECT
  title,
  metadata->>'city' as city,
  metadata->>'bookingLeadTimeDays' as lead_time,
  metadata->>'bookingUrl' as url
FROM activities
WHERE booking_required = true
ORDER BY (metadata->>'bookingLeadTimeDays')::int DESC NULLS LAST;
```

**Find All Activities in Tokyo:**
```sql
SELECT title, metadata->>'area' as area, category
FROM activities
WHERE metadata->>'city' = 'Tokyo';
```

**Find Intense Activities:**
```sql
SELECT
  title,
  metadata->>'city' as city,
  metadata->>'area' as area,
  duration
FROM activities
WHERE intensity_level = 'intense';
```

**Find Activities with Station Info:**
```sql
SELECT
  title,
  metadata->>'station' as station,
  metadata->>'line' as line,
  metadata->>'exit' as exit
FROM activities
WHERE metadata ? 'station';  -- Has 'station' key
```

**Find Early Morning Activities:**
```sql
SELECT
  title,
  metadata->>'city' as city,
  metadata->'bestTimeToVisit' as best_times
FROM activities
WHERE metadata->'bestTimeToVisit' ? 'early_morning';
```

**Find Cherry Blossom Spots:**
```sql
SELECT
  title,
  metadata->>'city' as city,
  metadata->>'area' as area,
  metadata->'peakWeeks' as peak_weeks
FROM activities
WHERE (metadata->>'cherryBlossoms')::boolean = true;
```

---

## Best Practices

### When Generating Itineraries

1. **Always set `intensityLevel`** - Required field, needed for pacing
2. **First day should be light** - Jet lag recovery
3. **Balance intense days** - No more than 2-3 consecutive full days
4. **Populate metadata richly** - City, area, timing, transportation details
5. **Specific names** - "Senso-ji Temple" not "a temple"
6. **Include booking info upfront** - Set `bookingRequired` and populate `metadata.bookingLeadTimeDays`
7. **Rich descriptions** - Use emoji sections for readability

### When Validating Data

1. **Verify intensityLevel exists** - Required field
2. **Check metadata for booking details** - If `bookingRequired = true`, should have `bookingLeadTimeDays`
3. **Ensure first day is light/rest** - Business rule
4. **Validate TimeOfDay arrays** - Should use valid values

### When Displaying to Users

1. **Show warnings for outdated data** - Prices/hours may have changed
2. **Link to officialWebsite** - Let users verify current info
3. **Highlight booking requirements prominently** - Critical for planning
4. **Show daily pacing level** - Help users understand intensity
5. **Display best times** - Crowd management is key to good experience

### When Promoting Metadata to Columns

If you find you're frequently querying specific metadata fields:

```sql
-- Example: Promoting 'city' to a real column
ALTER TABLE activities ADD COLUMN city TEXT;

-- Backfill from metadata
UPDATE activities SET city = metadata->>'city';

-- Create index
CREATE INDEX idx_activities_city ON activities(city);

-- Can keep in metadata too or remove it
UPDATE activities SET metadata = metadata - 'city';
```

---

## Migration History

- **2025-01-02:** Added minimal enhanced fields (`booking_required`, `intensity_level`, `metadata`) and trip fields (`travel_style`, `notes`)
- **Initial:** Basic schema

---

## Related Documentation

- [Itinerary Research Analysis](./itinerary-research-analysis.md) - Research findings that informed this schema
- [Supabase Architecture](./supabase-architecture.md) - Client/server/operations pattern
- [Database Types](../lib/database.types.ts) - Generated Supabase types
- [TypeScript Types](../lib/types/itinerary.ts) - Application type definitions
