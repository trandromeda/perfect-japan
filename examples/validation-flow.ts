/**
 * This file demonstrates how nested Zod validation works
 * Run: npx tsx examples/validation-flow.ts
 */

import { TripSchema, ActivitySchema, DayItinerarySchema } from '../lib/validation/schemas';

// Example data with an invalid activity (missing ID)
const tripData = {
  id: 'trip-123',
  title: 'Tokyo Trip',
  startDate: '2025-03-25',
  endDate: '2025-03-30',
  destination: 'Tokyo',
  bucket: [],
  days: [
    {
      id: 'day-1',
      date: '2025-03-25',
      dayNumber: 1,
      activities: [
        {
          // Missing 'id' field - this should fail validation
          title: 'Visit Temple',
          category: 'see',
          status: 'planned'
        }
      ]
    }
  ]
};

console.log('🔍 Validating Trip Data...\n');

// When we call TripSchema.safeParse(), here's what happens step by step:
const result = TripSchema.safeParse(tripData);

if (!result.success) {
  console.log('❌ Validation Failed!\n');
  console.log('Error path:', result.error.issues[0].path);
  console.log('Error message:', result.error.issues[0].message);
  console.log('\nFull error structure:');
  console.log(JSON.stringify(result.error.format(), null, 2));

  // The error path shows the nested validation chain:
  // ['days', 0, 'activities', 0, 'id']
  //    ↑     ↑      ↑          ↑    ↑
  //    |     |      |          |    |
  //    |     |      |          |    ActivitySchema validated this field
  //    |     |      |          First activity in the array
  //    |     |      DayItinerarySchema validated this array
  //    |     First day in the array
  //    TripSchema validated this array
}

console.log('\n\n📊 How Validation Flows:\n');

console.log(`
1. TripSchema.safeParse(tripData) is called
   ├── Validates trip.id ✓
   ├── Validates trip.title ✓
   ├── Validates trip.startDate ✓
   ├── Validates trip.endDate ✓
   ├── Validates trip.destination ✓
   ├── Validates trip.bucket (array of ActivitySchema) ✓
   └── Validates trip.days (array of DayItinerarySchema)
       └── For each day:
           ├── Validates day.id ✓
           ├── Validates day.date ✓
           ├── Validates day.dayNumber ✓
           └── Validates day.activities (array of ActivitySchema)
               └── For each activity:
                   ├── Validates activity.id ❌ FAILS HERE!
                   ├── Would validate activity.title
                   └── Would validate other fields...
`);

console.log('\n💡 Key Insight:');
console.log(`
When TripSchema.safeParse() runs, it automatically calls:
- DayItinerarySchema validation for each day
  - Which calls ActivitySchema validation for each activity

You don't need to call ActivitySchema.safeParse() yourself!
The parent schema handles it through composition.
`);

// ========================================
// Now let's show successful validation
// ========================================

const validTripData = {
  id: 'trip-123',
  title: 'Tokyo Trip',
  startDate: '2025-03-25',
  endDate: '2025-03-30',
  destination: 'Tokyo',
  bucket: [],
  days: [
    {
      id: 'day-1',
      date: '2025-03-25',
      dayNumber: 1,
      activities: [
        {
          id: 'activity-1',  // Now has ID!
          title: 'Visit Temple',
          category: 'see',
          status: 'planned'
        }
      ]
    }
  ]
};

console.log('\n\n✅ Validating Valid Trip Data...\n');
const validResult = TripSchema.safeParse(validTripData);

if (validResult.success) {
  console.log('✓ Validation successful!');
  console.log('✓ Trip ID:', validResult.data.id);
  console.log('✓ First day ID:', validResult.data.days[0].id);
  console.log('✓ First activity ID:', validResult.data.days[0].activities[0].id);
  console.log('\nAll nested schemas validated successfully through TripSchema!');
}

// ========================================
// Testing individual schemas
// ========================================

console.log('\n\n🔬 Testing Individual Schemas:\n');

// You CAN validate just an activity if you want:
const activityResult = ActivitySchema.safeParse({
  id: 'act-1',
  title: 'Activity',
  category: 'see',
  status: 'planned'
});
console.log('Activity validation:', activityResult.success ? '✓' : '✗');

// Or just a day:
const dayResult = DayItinerarySchema.safeParse({
  id: 'day-1',
  date: '2025-03-25',
  dayNumber: 1,
  activities: []
});
console.log('Day validation:', dayResult.success ? '✓' : '✗');

// But in production, we validate the whole Trip:
// - This automatically validates all days
// - Which automatically validates all activities
// - We get full error paths showing exactly what failed where

console.log('\n' + '='.repeat(60));
console.log('Summary: One TripSchema.safeParse() validates EVERYTHING!');
console.log('='.repeat(60));
