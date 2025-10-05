'use client';

import { Activity } from '@/lib/types/itinerary';
import { ActivityCard } from './activity-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Archive } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BucketProps {
  activities: Activity[];
  onMoveToDay: (activityId: string, dayId: string) => void;
  onDelete: (activityId: string) => void;
  availableDays: { id: string; label: string }[];
}

export function Bucket({ activities, onMoveToDay, onDelete, availableDays }: BucketProps) {
  return (
    <Card className="w-full bg-amber-50 border-amber-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="h-5 w-5" />
          Activity Backlog
        </CardTitle>
        <CardDescription>
          Activities you want to do but haven&apos;t scheduled yet. Drag them to a specific day when ready.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No activities in the backlog yet. Activities you skip or save will appear here.
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="space-y-2">
                <ActivityCard
                  activity={activity}
                  onDelete={onDelete}
                  isDraggable={false}
                />
                <div className="flex items-center gap-2 px-2">
                  <span className="text-sm text-gray-600">Move to:</span>
                  <Select onValueChange={(dayId) => onMoveToDay(activity.id, dayId)}>
                    <SelectTrigger className="w-[200px] h-8">
                      <SelectValue placeholder="Select a day" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDays.map((day) => (
                        <SelectItem key={day.id} value={day.id}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
