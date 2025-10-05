'use client';

import { useState } from 'react';
import { useItineraryStore } from '@/lib/store/itinerary-store';
import { CreateTripForm } from '@/components/itinerary/create-trip-form';
import { DayView } from '@/components/itinerary/day-view';
import { Bucket } from '@/components/itinerary/bucket';
import { DayReview } from '@/components/itinerary/day-review';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Home() {
  const {
    currentTrip,
    setCurrentTrip,
    reorderActivities,
    deleteActivity,
    moveActivityToBucket,
    moveActivityFromBucket,
    removeFromBucket,
    updateActivity,
  } = useItineraryStore();

  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [showReview, setShowReview] = useState(false);

  if (!currentTrip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Perfect Japan</h1>
            <p className="text-lg text-gray-600">Plan your perfect trip to Japan</p>
          </div>
          <CreateTripForm onTripCreated={setCurrentTrip} />
        </div>
      </div>
    );
  }

  const currentDay = currentTrip.days[currentDayIndex];
  const availableDays = currentTrip.days.map(day => ({
    id: day.id,
    label: `Day ${day.dayNumber} - ${format(new Date(day.date), 'MMM d')}`,
  }));

  const handleNextDay = () => {
    if (currentDayIndex < currentTrip.days.length - 1) {
      setCurrentDayIndex(currentDayIndex + 1);
      setShowReview(false);
    }
  };

  const handlePrevDay = () => {
    if (currentDayIndex > 0) {
      setCurrentDayIndex(currentDayIndex - 1);
      setShowReview(false);
    }
  };

  const handleReviewComplete = (activityId: string) => {
    updateActivity(activityId, { status: 'completed' });
  };

  const handleReviewSkip = (activityId: string) => {
    updateActivity(activityId, { status: 'skipped' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{currentTrip.title}</h1>
          <p className="text-gray-600">
            {format(new Date(currentTrip.startDate), 'MMM d')} - {format(new Date(currentTrip.endDate), 'MMM d, yyyy')}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={handlePrevDay}
            disabled={currentDayIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous Day
          </Button>

          <div className="flex gap-2">
            <Button
              variant={showReview ? 'outline' : 'default'}
              onClick={() => setShowReview(false)}
            >
              Itinerary
            </Button>
            <Button
              variant={showReview ? 'default' : 'outline'}
              onClick={() => setShowReview(true)}
            >
              Review Day
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={handleNextDay}
            disabled={currentDayIndex === currentTrip.days.length - 1}
          >
            Next Day
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {showReview ? (
              <DayReview
                activities={currentDay.activities}
                onComplete={handleReviewComplete}
                onSkip={handleReviewSkip}
                onMoveToBacklog={(activityId) => moveActivityToBucket(currentDay.id, activityId)}
              />
            ) : (
              <DayView
                key={currentDay.id}
                day={currentDay}
                onReorder={(activities) => reorderActivities(currentDay.id, activities)}
                onDeleteActivity={(activityId) => deleteActivity(currentDay.id, activityId)}
                onMoveToBacklog={(activityId) => moveActivityToBucket(currentDay.id, activityId)}
                onAddActivity={() => alert('Add activity feature coming soon!')}
              />
            )}
          </div>

          <div className="lg:col-span-1">
            <Bucket
              activities={currentTrip.bucket}
              onMoveToDay={(activityId, dayId) => moveActivityFromBucket(activityId, dayId)}
              onDelete={removeFromBucket}
              availableDays={availableDays}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Day {currentDayIndex + 1} of {currentTrip.days.length}</p>
        </div>
      </div>
    </div>
  );
}
