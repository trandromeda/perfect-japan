# Supabase Setup Guide

## Step 1: Create a Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Fill in:
    - **Name**: perfect-japan
    - **Database Password**: (save this securely)
    - **Region**: Choose closest to you
5. Wait for the project to be created (~2 minutes)

## Step 2: Get Your Credentials

1. In your project dashboard, go to **Settings** → **API**
2. Copy these values:
    - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
    - **anon/public key** (starts with `eyJ...`)

## Step 3: Add to Environment Variables

Update your `.env.local` file:

```bash
# Existing
OPENAI_API_KEY=your_openai_key_here

# Add these new ones
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

**Note:** The `NEXT_PUBLIC_` prefix makes these available in the browser (they're safe to expose - the `anon` key is designed for client-side use).

## Step 4: Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase/schema.sql`
4. Paste it into the SQL editor
5. Click **Run** (or press Cmd/Ctrl + Enter)

You should see: "Success. No rows returned"

## Step 5: Verify the Setup

In the SQL Editor, run:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

You should see:

-   trips
-   days
-   activities

## Step 6: Generate TypeScript Types

Install the Supabase CLI:

```bash
npm install -g supabase
```

Then generate types:

```bash
npx supabase gen types typescript --project-id qkxtpbtegexsaahncgsc > lib/database.types.ts
```

Get your `PROJECT_ID` from: Settings → General → Reference ID

## Optional: Enable Email Auth

If you want users to sign up:

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email settings (or use Supabase's default for testing)

## Testing Your Setup

Run this in the SQL Editor to create a test trip:

```sql
-- First, you need to be authenticated
-- For testing, you can disable RLS temporarily:
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE days DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;

-- Insert test data
INSERT INTO trips (title, destination, start_date, end_date)
VALUES ('Test Trip', 'Tokyo', '2025-03-25', '2025-03-30');

-- Re-enable RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE days ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
```

## Next Steps

Once setup is complete:

1. Test the Supabase client in your app
2. Migrate localStorage data to database
3. Add authentication
4. Sync Zustand store with database

## Troubleshooting

**Can't connect to database?**

-   Check environment variables are correct
-   Make sure you've restarted the dev server after adding env vars

**RLS policies blocking queries?**

-   During development, you can temporarily disable RLS (see above)
-   For production, implement authentication first

**Types not generating?**

-   Make sure Supabase CLI is installed globally
-   Check your project ID is correct
-   Run `npx supabase login` first if needed
