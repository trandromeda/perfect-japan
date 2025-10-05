# Perfect Japan - AI-Powered Japan Travel Planner

An adaptive, card-based itinerary planner for trips to Japan, powered by AI.

## Features

### Core MVP Features ✨

- **AI-Powered Itinerary Generation** - Create personalized Japan itineraries based on your preferences
- **Card-Based Interface** - Activities displayed as draggable cards for easy reordering
- **Activity Bucket System** - Save activities you want to do but haven't scheduled yet
- **Day Review** - At the end of each day, mark activities as completed, skip, or save for later
- **Drag & Drop** - Easily reorder activities within a day

### What Makes It "Perfect"

Perfect doesn't mean rigid - it means adaptive!
- **Flexible, not fixed** - Easily move activities around or save them for later
- **Realistic pacing** - AI accounts for travel time, jet lag, and doesn't overpack your days
- **Japan-specific** - Includes tips about trains, reservations, and local gotchas

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **UI Components**: shadcn/ui + lucide-react icons
- **Drag & Drop**: @dnd-kit
- **State Management**: Zustand
- **AI**: OpenAI GPT-4o-mini
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file:
   ```bash
   cp .env.example .env.local
   ```

4. Add your OpenAI API key to `.env.local`:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

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
  ui/                     # shadcn components
lib/
  types/itinerary.ts     # TypeScript types
  store/itinerary-store.ts # Zustand state management
```

## Future Enhancements

- Templates from the community
- Budget tracking
- Map integration
- Weather-based rescheduling
- Multi-user trip planning
- Export to PDF/calendar

## License

MIT
