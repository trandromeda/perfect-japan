# How Zod Schema Composition Works

## The Key Concept: Schema Composition

When you define schemas that reference other schemas, Zod automatically validates the entire nested structure.

## Visual Example

```typescript
// Define individual schemas
const ActivitySchema = z.object({
  id: z.string(),
  title: z.string()
});

const DaySchema = z.object({
  id: z.string(),
  activities: z.array(ActivitySchema)  // ← References ActivitySchema
});

const TripSchema = z.object({
  id: z.string(),
  days: z.array(DaySchema)  // ← References DaySchema (which references ActivitySchema)
});
```

## What Happens When You Validate

```javascript
// You call this ONCE:
const result = TripSchema.safeParse(tripData);

// But internally, Zod does this:
TripSchema validates {
  id: ✓
  days: [
    DaySchema validates {        // ← Automatically called by TripSchema
      id: ✓
      activities: [
        ActivitySchema validates {  // ← Automatically called by DaySchema
          id: ✓
          title: ✓
        }
        ActivitySchema validates {  // For each activity
          id: ✓
          title: ✓
        }
      ]
    }
    DaySchema validates { ... }  // For each day
  ]
}
```

## The Error Path

When validation fails, you get the exact path to the problem:

```javascript
Error path: ['days', 0, 'activities', 0, 'id']
             ↑       ↑     ↑          ↑    ↑
             |       |     |          |    The field that failed
             |       |     |          First activity
             |       |     activities array (validated by DaySchema)
             |       First day
             days array (validated by TripSchema)
```

This tells you: "In the first day's first activity, the ID field failed validation"

## In Our Production Code

```typescript
// In /api/generate-itinerary/route.ts
const trip = {
  id: 'trip-123',
  title: 'Tokyo Trip',
  // ...
  days: [
    {
      id: 'day-1',
      activities: [
        { id: 'act-1', title: 'Temple Visit', ... },
        { id: 'act-2', title: 'Sushi Dinner', ... }
      ]
    }
  ]
};

// This single call validates:
// - The trip (TripSchema)
// - All days (DayItinerarySchema)
// - All activities in all days (ActivitySchema)
validateWithLogging(TripSchema, trip, 'Final Trip Object');
```

## Why Test Individual Schemas?

Even though we validate trips as a whole, we test individual schemas because:

### 1. They Can Be Used Independently
```typescript
// Future feature: Validate just an activity
function addActivity(activityData: unknown) {
  const validated = ActivitySchema.parse(activityData);
  // ...
}
```

### 2. Error Messages Are Schema-Specific
If `ActivitySchema` changes its validation rules, we want to know immediately:
```typescript
// Someone changes this:
id: z.string().min(1)  // ← Test catches that empty strings now fail

// To this:
id: z.string().optional()  // ← Test catches that undefined is now allowed
```

### 3. Documentation
Tests show exactly what each schema accepts/rejects:
```typescript
it('should fail if activity ID is missing', () => {
  const result = ActivitySchema.safeParse({ title: 'Activity' });
  expect(result.success).toBe(false);
});
```

## Analogy

Think of it like a factory assembly line:

- **TripSchema** = Final Quality Inspector
  - Checks the whole car
  - Automatically checks all components

- **DayItinerarySchema** = Engine Inspector
  - Checks the engine subsystem
  - Automatically checks all engine parts

- **ActivitySchema** = Spark Plug Inspector
  - Checks individual spark plugs

When the Final Inspector checks the car, they don't need to manually call the Spark Plug Inspector. It happens automatically because engines contain spark plugs!

## Summary

```
TripSchema.safeParse(data)
  └─> validates trip.days array
      └─> for each day, DayItinerarySchema validates
          └─> validates day.activities array
              └─> for each activity, ActivitySchema validates
                  └─> validates id, title, category, etc.
```

**You never need to call `ActivitySchema.safeParse()` directly when validating a Trip, because `TripSchema` automatically does it for you through composition.**

But you still test `ActivitySchema` to ensure it works correctly when used (either directly or as part of a larger schema).
