'use client';

import { useState } from 'react';
import { useCloudSync } from '@/lib/hooks/use-cloud-sync';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, CloudOff, Loader2, Check, AlertCircle } from 'lucide-react';
import type { Trip } from '@/lib/types/itinerary';

export function CloudSync() {
  const {
    saveToCloud,
    loadFromCloud,
    getAllTrips,
    isSaving,
    isLoading,
    error,
    isTripSaved,
  } = useCloudSync();

  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [availableTrips, setAvailableTrips] = useState<Trip[]>([]);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

  const handleSave = async () => {
    const tripId = await saveToCloud();
    if (tripId) {
      setLastSavedTime(new Date());
    }
  };

  const handleShowLoadDialog = async () => {
    const trips = await getAllTrips();
    setAvailableTrips(trips);
    setShowLoadDialog(true);
  };

  const handleLoad = async (tripId: string) => {
    await loadFromCloud(tripId);
    setShowLoadDialog(false);
  };

  if (showLoadDialog) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Load Trip from Cloud</CardTitle>
          <CardDescription>
            Select a trip to load from your saved trips
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : availableTrips.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No saved trips found
            </div>
          ) : (
            <div className="space-y-2">
              {availableTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleLoad(trip.id)}
                >
                  <div>
                    <div className="font-medium">{trip.title}</div>
                    <div className="text-sm text-gray-500">
                      {trip.destination} • {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <Cloud className="h-5 w-5 text-blue-500" />
                </div>
              ))}
            </div>
          )}
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowLoadDialog(false)}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
          {error && (
            <div className="mt-4 text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleSave}
        disabled={isSaving}
        variant={isTripSaved ? 'outline' : 'default'}
        size="sm"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : isTripSaved ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            Saved
          </>
        ) : (
          <>
            <Cloud className="h-4 w-4 mr-2" />
            Save to Cloud
          </>
        )}
      </Button>

      <Button
        onClick={handleShowLoadDialog}
        disabled={isLoading}
        variant="outline"
        size="sm"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <CloudOff className="h-4 w-4 mr-2" />
        )}
        Load from Cloud
      </Button>

      {error && (
        <div className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {lastSavedTime && !error && (
        <div className="text-sm text-gray-500">
          Last saved: {lastSavedTime.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}