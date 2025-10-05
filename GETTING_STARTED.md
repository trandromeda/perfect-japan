# Getting Started with Perfect Japan

## Quick Start Guide

### 1. Prerequisites
- Node.js 18 or higher
- An OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### 2. Installation

```bash
cd perfect-japan-app
npm install
```

### 3. Environment Setup

Create a `.env.local` file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your OpenAI API key:

```
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### 4. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

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

### Activities not saving
- State is currently in-memory only
- Refresh will reset the trip
- Future versions will add persistence

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

Once you've explored the MVP, check out `DEVELOPMENT_SUMMARY.md` for:
- Technical architecture details
- Future enhancement ideas
- Deployment instructions

## Support

For issues or questions:
- Check the GitHub Issues
- Review the README.md
- Read the code comments

Happy trip planning! 🇯🇵 ✨
