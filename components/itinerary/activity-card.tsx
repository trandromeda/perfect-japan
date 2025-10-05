'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Activity } from '@/lib/types/itinerary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, MapPin, Clock, DollarSign, Trash2, Archive } from 'lucide-react';

interface ActivityCardProps {
  activity: Activity;
  onEdit?: (activity: Activity) => void;
  onDelete?: (activityId: string) => void;
  onMoveToBacklog?: (activityId: string) => void;
  isDraggable?: boolean;
}

const categoryIcons = {
  see: '👁️',
  do: '🎯',
  eat: '🍜',
  transit: '🚆',
  rest: '💤'
};

const categoryColors = {
  see: 'bg-blue-50 border-blue-200',
  do: 'bg-green-50 border-green-200',
  eat: 'bg-orange-50 border-orange-200',
  transit: 'bg-purple-50 border-purple-200',
  rest: 'bg-gray-50 border-gray-200'
};

export function ActivityCard({
  activity,
  onEdit,
  onDelete,
  onMoveToBacklog,
  isDraggable = true
}: ActivityCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id, disabled: !isDraggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`${categoryColors[activity.category]} ${activity.isAnchor ? 'ring-2 ring-red-500' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            {isDraggable && (
              <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing pt-1">
                <GripVertical className="h-5 w-5 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">{categoryIcons[activity.category]}</span>
                <CardTitle className="text-lg">{activity.title}</CardTitle>
                {activity.isAnchor && <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Anchor</span>}
              </div>
              {activity.description && (
                <CardDescription className="mt-1">{activity.description}</CardDescription>
              )}
            </div>
            <div className="flex gap-1">
              {onMoveToBacklog && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onMoveToBacklog(activity.id)}
                  className="h-8 w-8"
                >
                  <Archive className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(activity.id)}
                  className="h-8 w-8 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
            {activity.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{activity.location}</span>
              </div>
            )}
            {activity.duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{activity.duration} min</span>
              </div>
            )}
            {activity.cost && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                <span>{activity.cost} {activity.currency || 'JPY'}</span>
              </div>
            )}
            {activity.timeOfDay && (
              <div className="text-sm text-gray-500">
                {activity.timeOfDay}
              </div>
            )}
          </div>
          {activity.notes && (
            <div className="mt-2 text-sm text-gray-500 italic">
              {activity.notes}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
