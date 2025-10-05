import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Trip } from '@/lib/types/itinerary';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GenerateItineraryRequest {
  destination: string;
  startDate: string;
  endDate: string;
  interests?: string[];
  travelStyle?: 'relaxed' | 'moderate' | 'packed';
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateItineraryRequest = await request.json();
    const { destination, startDate, endDate, interests = [], travelStyle = 'moderate' } = body;

    const prompt = `You are an expert Japan travel planner. Create a detailed itinerary for a trip to ${destination}, Japan.

Trip Details:
- Dates: ${startDate} to ${endDate}
- Interests: ${interests.join(', ') || 'General sightseeing'}
- Travel Style: ${travelStyle} (relaxed = fewer activities with more rest time, moderate = balanced, packed = many activities)

Important Guidelines:
- Japan-specific: Include practical tips about trains, IC cards, queues, reservations
- Realistic timing: Account for travel time between locations, don't pack too much
- First day: Light activities accounting for jet lag and arrival fatigue
- Mix of categories: See (sights), Do (activities), Eat (restaurants), Transit, Rest
- Include specific location names, estimated costs in JPY, and duration
- Mark activities that need reservations with isAnchor: true
- Add helpful notes about best times to visit, how to get there, etc.

Return a JSON object with this structure:
{
  "days": [
    {
      "dayNumber": 1,
      "date": "ISO date string",
      "summary": "Brief description of the day",
      "activities": [
        {
          "id": "unique-id",
          "title": "Activity name",
          "description": "Brief description",
          "category": "see|do|eat|transit|rest",
          "location": "Specific location",
          "duration": minutes as number,
          "cost": amount in JPY as number,
          "currency": "JPY",
          "notes": "Helpful tips",
          "status": "planned",
          "isAnchor": boolean (true if needs reservation),
          "timeOfDay": "9:00 AM" or "afternoon" etc
        }
      ]
    }
  ]
}`;

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

    const result = JSON.parse(content);

    // Create the full trip object
    const trip: Trip = {
      id: `trip-${Date.now()}`,
      title: `Trip to ${destination}`,
      startDate,
      endDate,
      destination,
      days: result.days,
      bucket: [],
    };

    return NextResponse.json(trip);
  } catch (error) {
    console.error('Error generating itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to generate itinerary' },
      { status: 500 }
    );
  }
}
