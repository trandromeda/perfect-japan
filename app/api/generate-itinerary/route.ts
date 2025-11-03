import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { Trip } from '@/lib/types/itinerary';
import {
  GenerateItineraryRequestSchema,
  OpenAIResponseSchema,
  TripSchema,
  validateWithLogging
} from '@/lib/validation/schemas';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();

    // Validate request body
    const validationResult = GenerateItineraryRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.format()
        },
        { status: 400 }
      );
    }

    const body = validationResult.data;
    const { destination, startDate, endDate, interests = [], travelStyle = 'moderate' } = body;

    const prompt = `You are an expert Japan travel planner with deep knowledge of Japan's culture, transportation, and travel logistics. Create a comprehensive, actionable itinerary for a trip to ${destination}, Japan.

TRIP DETAILS:
- Dates: ${startDate} to ${endDate}
- Interests: ${interests.join(', ') || 'General sightseeing'}
- Travel Style: ${travelStyle}
  * relaxed: Fewer activities, lots of rest time, slower pace
  * moderate: Balanced mix of activities and downtime
  * packed: Many activities, maximize experiences

ESSENTIAL GUIDELINES FROM SUCCESSFUL JAPAN ITINERARIES:

1. SPECIFICITY IS CRITICAL
   - Use exact names: "Senso-ji Temple" not "a temple"
   - Include neighborhoods: "Asakusa" not just "Tokyo"
   - Name specific restaurants with cuisine types
   - Provide specific costs in JPY

2. PACING & PHYSICAL DEMANDS
   - First day: LIGHT activities only (jet lag recovery)
   - Calculate intensity levels realistically:
     * none: Sitting (meals, transit, rest)
     * light: <2km walking, <2hrs, mostly flat, minimal stairs
     * moderate: 2-5km walking, 2-4hrs, some stairs/elevation
     * intense: >5km walking, >4hrs, or strenuous (hiking, heavy stairs)
   - Balance intense days with rest/light days
   - Typical Japan travel: 20,000 steps/day is exhausting!

3. CROWD MANAGEMENT & TIMING
   - Specify best times to visit (early_morning arrival can avoid 90% of crowds)
   - Mark busiest times to avoid
   - Example: Fushimi Inari at 7am vs 11am is drastically different
   - Time periods: early_morning (6-9am), morning (9am-12pm), midday (12-2pm), afternoon (2-5pm), evening (5-8pm), night (8pm+)

4. BOOKING REQUIREMENTS
   - Flag activities requiring advance reservations
   - Specify lead time (e.g., popular restaurants need 30 days)
   - Provide booking URLs when available
   - Mark with isAnchor: true if time-sensitive

5. NAVIGATION & TRANSPORTATION
   - Include station names, train lines, which exit to use
   - Walking times from stations
   - Transportation modes between activities
   - Station exit matters: "Asakusa Station, Ginza Line, Exit 1"

6. RICH DESCRIPTIONS
   Format descriptions with:
   - What makes this special (historical context, unique features)
   - Transportation: How to get there, which exit, walking time
   - Timing: Best time to visit, when it gets crowded
   - Cost details: Entry fees, typical meal costs
   - Cultural tips: Etiquette, dress codes, photography rules
   - Pro tips: What to try, photo spots, what to skip

7. FOOD AS PRIMARY EXPERIENCE
   - Specific restaurant names with cuisine types
   - Location details (e.g., "basement of Hotel Metropolitan")
   - Estimated costs per person
   - Regional specialties to try
   - Reservation requirements

8. REALISTIC DAILY STRUCTURE
   - Don't over-schedule (quality > quantity)
   - Account for transit time between locations
   - Build in rest/recovery time
   - Mix activity types (not all temples in one day)

REQUIRED JSON STRUCTURE:
{
  "days": [
    {
      "dayNumber": 1,
      "date": "YYYY-MM-DD",
      "summary": "Brief overview (e.g., 'Exploring Eastern Tokyo, light day for jet lag recovery')",
      "activities": [
        {
          "id": "temp-id",
          "title": "Specific Activity Name",
          "description": "Rich description including:\n\n🏛️ **About:** Historical/cultural context\n\n🚇 **Getting There:** Station name, line, exit, walking time\n\n⏰ **Timing:** Best time to visit, crowd patterns\n\n💴 **Cost:** Detailed pricing\n\n📸 **Tips:** Photo spots, etiquette, what to try",
          "category": "see|do|eat|transit|rest",

          // Core fields
          "location": "Full address or landmark name",
          "duration": 90,  // minutes
          "timeOfDay": "9:00 AM",  // Specific time or "morning"/"afternoon"
          "cost": 600,  // JPY
          "currency": "JPY",

          // Required queryable fields
          "bookingRequired": false,  // REQUIRED: true if needs reservation
          "intensityLevel": "moderate",  // REQUIRED: none|light|moderate|intense

          // Management fields
          "status": "planned",
          "isAnchor": false,  // true if reservation/time-sensitive
          "notes": "",  // Leave empty for user

          // METADATA - Put most detailed info here (JSONB field)
          "metadata": {
            // Location details
            "city": "Tokyo",
            "area": "Asakusa",

            // Timing and crowds
            "bestTimeToVisit": ["early_morning", "evening"],
            "busiestTimeOfDay": ["morning", "midday", "afternoon"],

            // Booking details (if bookingRequired = true)
            "bookingLeadTimeDays": 30,  // How far in advance
            "bookingUrl": "https://...",

            // Transportation
            "station": "Asakusa",
            "line": "Ginza Line",
            "exit": "1",
            "walkingTimeMinutes": 3,

            // Reference
            "officialWebsite": "https://www.senso-ji.jp/",

            // Cultural context (if applicable)
            "dressCode": "modest",
            "photoPolicy": "allowed_outside_only",
            "quietRequired": true,
            "shoeRemoval": true,

            // Seasonal (if applicable)
            "bestSeason": "spring",
            "cherryBlossoms": true,
            "peakWeeks": ["late March", "early April"],

            // Food-specific (if category = 'eat')
            "cuisine": "Sushi",
            "style": "Omakase",
            "michelin": 3,
            "seatsTotal": 10
          }
        }
      ]
    }
  ]
}

IMPORTANT: Most detailed information goes in the "metadata" field. This allows flexible data storage without database changes.

CRITICAL REMINDERS:
- First day MUST be light intensity (jet lag recovery)
- Balance intense days with rest days
- Every activity needs intensityLevel
- Specific names, not generic descriptions
- Rich descriptions with practical navigation details
- Food is a primary experience, not an afterthought
- Quality over quantity - don't overschedule`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert Japan travel planner. Respond only with valid JSON, no additional text.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    const rawResult = JSON.parse(content);

    // Validate OpenAI response
    const validatedResponse = validateWithLogging(
      OpenAIResponseSchema,
      rawResult,
      'OpenAI Response'
    );

    // Add unique UUIDs to days and activities since OpenAI doesn't generate proper UUIDs
    const daysWithIds = validatedResponse.days.map((day) => ({
      ...day,
      id: uuidv4(),
      activities: day.activities.map((activity) => ({
        ...activity,
        id: uuidv4(), // Generate UUID for each activity
      })),
    }));

    // Create the full trip object with UUID
    const trip: Trip = {
      id: uuidv4(),
      title: `Trip to ${destination}`,
      startDate,
      endDate,
      destination,
      travelStyle,
      days: daysWithIds,
      bucket: [],
    };

    // Final validation of the complete trip object
    validateWithLogging(
      z.lazy(() => TripSchema),
      trip,
      'Final Trip Object'
    );

    return NextResponse.json(trip);
  } catch (error) {
    console.error('Error generating itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to generate itinerary' },
      { status: 500 }
    );
  }
}
