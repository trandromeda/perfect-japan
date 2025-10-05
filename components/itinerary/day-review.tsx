'use client';

import { useState } from 'react';
import { Activity } from '@/lib/types/itinerary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Archive } from 'lucide-react';

interface DayReviewProps {
  activities: Activity[];
  onComplete: (activityId: string) => void;
  onSkip: (activityId: string) => void;
  onMoveToBacklog: (activityId: string) => void;
}

export function DayReview({ activities, onComplete, onSkip, onMoveToBacklog }: DayReviewProps) {
  const [reviewedActivities, setReviewedActivities] = useState<Set<string>>(new Set());

  const handleAction = (activityId: string, action: () => void) => {
    action();
    setReviewedActivities(prev => new Set([...prev, activityId]));
  };

  const unreviewedActivities = activities.filter(a => !reviewedActivities.has(a.id));

  return (
    <Card className="w-full bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle>Review Your Day</CardTitle>
        <CardDescription>
          How did it go? Mark activities as completed, skip, or save for later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {unreviewedActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            All activities reviewed! 🎉
          </div>
        ) : (
          <div className="space-y-4">
            {unreviewedActivities.map((activity) => (
              <div key={activity.id} className="bg-white p-4 rounded-lg border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{activity.title}</h4>
                    {activity.location && (
                      <p className="text-sm text-gray-600 mt-1">{activity.location}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleAction(activity.id, () => onComplete(activity.id))}
                    className="flex-1"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Did it!
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(activity.id, () => onMoveToBacklog(activity.id))}
                    className="flex-1"
                  >
                    <Archive className="h-4 w-4 mr-1" />
                    Save for later
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(activity.id, () => onSkip(activity.id))}
                    className="flex-1 text-red-600 hover:text-red-700"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Skip
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
