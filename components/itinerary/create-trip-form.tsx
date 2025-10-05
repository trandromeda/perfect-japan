'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { Trip } from '@/lib/types/itinerary';

interface CreateTripFormProps {
  onTripCreated: (trip: Trip) => void;
}

export function CreateTripForm({ onTripCreated }: CreateTripFormProps) {
  const [destination, setDestination] = useState('Tokyo');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [interests, setInterests] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination,
          startDate,
          endDate,
          interests: interests.split(',').map(i => i.trim()).filter(Boolean),
          travelStyle: 'moderate',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate itinerary');
      }

      const trip: Trip = await response.json();
      onTripCreated(trip);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-6 w-6" />
          Plan Your Perfect Trip to Japan
        </CardTitle>
        <CardDescription>
          Tell us about your trip and we&apos;ll create a personalized itinerary
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="destination" className="text-sm font-medium">
              Destination
            </label>
            <Input
              id="destination"
              placeholder="e.g., Tokyo, Kyoto, Osaka"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="startDate" className="text-sm font-medium">
                Start Date
              </label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="endDate" className="text-sm font-medium">
                End Date
              </label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="interests" className="text-sm font-medium">
              Interests (comma-separated)
            </label>
            <Input
              id="interests"
              placeholder="e.g., food, temples, anime, nature, shopping"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating your perfect itinerary...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Itinerary
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
