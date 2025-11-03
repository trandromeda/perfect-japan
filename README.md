# Perfect Japan - AI-Powered Japan Travel Planner

An adaptive, card-based itinerary planner for trips to Japan, powered by AI.

## Features

### Core MVP Features ✨

- **AI-Powered Itinerary Generation** - Create personalized Japan itineraries based on your preferences
- **Card-Based Interface** - Activities displayed as draggable cards for easy reordering
- **Activity Bucket System** - Save activities you want to do but haven't scheduled yet
- **Day Review** - At the end of each day, mark activities as completed, skip, or save for later
- **Drag & Drop** - Easily reorder activities within a day
- **Hybrid Storage** - Local persistence with optional cloud sync via Supabase
- **Type-Safe Validation** - Zod schemas ensure data integrity throughout the app

### What Makes It "Perfect"

Perfect doesn't mean rigid - it means adaptive!
- **Flexible, not fixed** - Easily move activities around or save them for later
- **Realistic pacing** - AI accounts for travel time, jet lag, and doesn't overpack your days
- **Japan-specific** - Includes tips about trains, reservations, and local gotchas

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS + Turbopack
- **UI Components**: shadcn/ui + lucide-react icons
- **Drag & Drop**: @dnd-kit
- **State Management**: Zustand with localStorage persistence
- **Database**: Supabase (PostgreSQL) with optional cloud sync
- **AI**: OpenAI GPT-4o-mini
- **Date Handling**: date-fns
- **Testing**: Vitest + React Testing Library
- **Validation**: Zod schemas

## Getting Started

### Quick Setup

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Add your OpenAI API key and Supabase credentials to .env.local

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**📖 For detailed setup, usage instructions, and troubleshooting:** See [Getting Started Guide](./docs/getting-started.md)

## ⚠️ Security Warning - Database RLS Policies

**IMPORTANT**: The current database configuration is **NOT SECURE FOR PRODUCTION**.

### Current State
- Row Level Security (RLS) policies are configured to allow **anonymous access**
- **Anyone can view, create, modify, and delete ANY trip** in the database
- There is **NO authentication** or user isolation
- This is acceptable for **local development only**

### Before Production Deployment
You **MUST** implement the following:

1. **Add Authentication** - Implement Supabase Auth (email/password, OAuth, etc.)
2. **Replace RLS Policies** - Remove the permissive policies in `supabase/migrations/20251008183700_allow_anonymous_access.sql`
3. **Implement User-Scoped Policies** - Add policies that check `auth.uid() = user_id`
4. **Update Code** - Pass authenticated user ID to database operations (`lib/hooks/use-cloud-sync.ts`)

### Example Secure RLS Policy
```sql
-- Users can only view their own trips
CREATE POLICY "Users can view their own trips" ON trips
  FOR SELECT USING (auth.uid() = user_id);
```

See `supabase/migrations/20251008183700_allow_anonymous_access.sql` for detailed notes.

**DO NOT deploy this application publicly without implementing proper authentication and RLS policies.**

## Usage

1. **Create Your Trip** - Enter destination, dates, and interests
2. **Review Generated Itinerary** - AI creates a day-by-day plan
3. **Customize** - Drag to reorder, delete unwanted activities, add to bucket
4. **During Your Trip** - Review each day and mark what you did
5. **Adapt On The Go** - Activities you skip get saved to the bucket for later

## Project Structure

```
app/
  api/generate-itinerary/  # OpenAI integration
  page.tsx                 # Main app page
components/
  itinerary/
    activity-card.tsx      # Individual activity display
    day-view.tsx          # Day with drag-drop
    bucket.tsx            # Activity backlog
    day-review.tsx        # End-of-day review
    create-trip-form.tsx  # Initial trip creation
  cloud-sync.tsx          # Save/Load from cloud UI
  ui/                     # shadcn components
lib/
  types/itinerary.ts           # TypeScript types
  store/itinerary-store.ts     # Zustand state management
  validation/schemas.ts        # Zod validation schemas
  hooks/use-cloud-sync.ts      # Cloud sync operations
  supabase/
    client.ts                  # Supabase client (browser)
    server.ts                  # Supabase client (server)
    operations.ts              # Database CRUD operations
  database.types.ts            # Auto-generated Supabase types
supabase/
  migrations/                  # Database schema migrations
  schema.sql                   # Initial database schema
```

## Future Enhancements

### High Priority 🔴
- **Authentication** - Implement Supabase Auth to secure the database (see Security Warning above)
- **User-scoped RLS policies** - Replace permissive policies with user-based access control

### Nice to Have
- Templates from the community
- Budget tracking
- Map integration
- Weather-based rescheduling
- Multi-user trip planning
- Export to PDF/calendar
- Auto-save to cloud (currently manual)

## Documentation

Comprehensive guides and technical documentation are available in the [`docs/`](./docs) folder:

- **[Getting Started Guide](./docs/getting-started.md)** - Complete setup and usage instructions
- **[Supabase Architecture](./docs/supabase-architecture.md)** - Understanding the database layer
- **[shadcn/ui Guide](./docs/shadcn-guide.md)** - UI component system explained
- **[Documentation Index](./docs/README.md)** - Full list of available guides

## License

MIT
