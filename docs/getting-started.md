# Getting Started with Perfect Japan

A complete guide to setting up and using the Perfect Japan itinerary planner.

---

## Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **OpenAI API Key** - [Get one here](https://platform.openai.com/api-keys) (required for AI itinerary generation)
- **Supabase Account** - [Sign up here](https://supabase.com/) for cloud database and sync

---

## Installation

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd perfect-japan
npm install
```

### 2. Set Up Supabase

#### Create a Supabase Project

1. Go to https://supabase.com and sign up/log in
2. Click "New Project"
3. Fill in:
   - **Name**: perfect-japan
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to you
4. Wait for the project to be created (~2 minutes)

#### Get Your Credentials

1. In your project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

#### Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase/schema.sql` from the project
4. Paste it into the SQL editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. You should see: "Success. No rows returned"

#### Apply Migrations

In the SQL Editor, run each migration file in `supabase/migrations/` in order:
1. `20251008183600_get_trip_with_details.sql`
2. `20251008183700_allow_anonymous_access.sql`
3. `20251008200000_revert_to_uuid.sql`
4. `20250102120000_add_enhanced_activity_fields.sql`

### 3. Environment Setup

Create a `.env.local` file:

```bash
cp .env.example .env.local
```

Add your credentials to `.env.local`:

```env
# Required - For AI itinerary generation
OPENAI_API_KEY=sk-your-actual-api-key-here

# Required - For database and cloud sync
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key-here
```

**Note:** The `NEXT_PUBLIC_` prefix makes these available in the browser (they're safe to expose - the `anon` key is designed for client-side use with Row Level Security).

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Using the App

### Creating Your First Itinerary

1. **Fill out the form:**
   - Destination: Enter a Japanese city (e.g., Tokyo, Kyoto, Osaka)
   - Dates: Select your trip start and end dates
   - Interests: Add comma-separated interests (e.g., "food, temples, anime, nature")

2. **Click "Generate Itinerary"**
   - The AI will create a personalized itinerary
   - This takes 5-10 seconds

3. **Explore your itinerary:**
   - Each day shows activities as cards
   - Activities are color-coded by type
   - Red "Anchor" tags indicate reservations needed

### Managing Activities

**Reorder Activities:**
- Grab the ⋮⋮ handle on any card
- Drag and drop to reorder

**Delete Activity:**
- Click the 🗑️ trash icon

**Save for Later:**
- Click the 📦 archive icon
- Activity moves to "Activity Backlog" on the right

**Add from Backlog:**
- In the backlog section, select a day from the dropdown
- Activity moves to that day

### Reviewing Your Day

1. **Click "Review Day" button** (top center)

2. **For each activity, choose:**
   - ✅ **Did it!** - Mark as completed
   - 📦 **Save for later** - Move to backlog
   - ❌ **Skip** - Mark as skipped

3. **Navigate days** with Previous/Next buttons

## Testing Without an API Key

If you don't have an OpenAI API key yet, you can test with mock data:

1. Edit `app/page.tsx`
2. Import the mock data at the top:
   ```typescript
   import { mockTrip } from '@/lib/mock-data';
   ```
3. Replace the initial state with mock data:
   ```typescript
   const [currentTrip, setCurrentTrip] = useState<Trip | null>(mockTrip);
   ```

This bypasses the AI generation and loads a sample Tokyo itinerary.

## Troubleshooting

### "Failed to generate itinerary"
- Check that your OpenAI API key is correct in `.env.local`
- Ensure you have credits in your OpenAI account
- Check the browser console for error messages

### Build errors
- Run `npm install` again
- Delete `.next` folder and rebuild: `rm -rf .next && npm run build`

### Drag and drop not working
- Make sure you're clicking the ⋮⋮ grip handle
- Try a different browser (Chrome/Firefox/Safari recommended)

### Supabase connection errors
- Verify your `.env.local` has correct credentials
- Check that you've run all database migrations
- Ensure Row Level Security policies allow anonymous access (development mode)

## Development Commands

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Next Steps

### Learn More

Once you've explored the app, dive deeper:

- **[Schema Fields Guide](./schema-fields-guide.md)** - Database schema documentation
- **[Itinerary Research](./itinerary-research-analysis.md)** - Research that informed the design
- **[Supabase Architecture](./supabase-architecture.md)** - Understanding the client/server/operations pattern
- **[shadcn/ui Guide](./shadcn-guide.md)** - Learn about the UI component system
- **[Validation Explained](./validation-explained.md)** - How Zod validation works

### Development Commands

```bash
# Development
npm run dev          # Start dev server with Turbopack
npm run build        # Build for production
npm start           # Start production server

# Testing
npm test            # Run tests
npm run lint        # Run ESLint
```

---

## Support

**Having issues?**
- Check the [Troubleshooting](#troubleshooting) section above
- Review the [main README](../README.md)
- Check [GitHub Issues](../../issues)
- Read the inline code comments

**Want to contribute?**
- See [CLAUDE.md](../CLAUDE.md) for development guidelines
- Check [docs/README.md](./README.md) for all documentation

---

Happy trip planning! 🇯🇵 ✨
