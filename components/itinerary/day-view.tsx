"use client";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DayItinerary } from "@/lib/types/itinerary";
import { ActivityCard } from "./activity-card";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";
import { format } from "date-fns";

interface DayViewProps {
    day: DayItinerary;
    onReorder: (activities: DayItinerary["activities"]) => void;
    onDeleteActivity: (activityId: string) => void;
    onMoveToBacklog: (activityId: string) => void;
    onAddActivity: () => void;
}

export function DayView({
    day,
    onReorder,
    onDeleteActivity,
    onMoveToBacklog,
    onAddActivity,
}: DayViewProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = day.activities.findIndex(
                (item) => item.id === active.id
            );
            const newIndex = day.activities.findIndex(
                (item) => item.id === over.id
            );

            const newActivities = arrayMove(day.activities, oldIndex, newIndex);
            onReorder(newActivities);
        }
    };

    const formattedDate = format(new Date(day.date), "EEEE, MMMM d, yyyy");

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Day {day.dayNumber}: {formattedDate}
                        </CardTitle>
                        {day.summary && (
                            <CardDescription className="mt-1">
                                {day.summary}
                            </CardDescription>
                        )}
                    </div>
                    <Button onClick={onAddActivity} size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Activity
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={day.activities.map((a) => a.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-3">
                            {day.activities.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No activities planned yet. Add your first
                                    activity!
                                </div>
                            ) : (
                                day.activities.map((activity) => (
                                    <ActivityCard
                                        key={activity.id}
                                        activity={activity}
                                        onDelete={onDeleteActivity}
                                        onMoveToBacklog={onMoveToBacklog}
                                    />
                                ))
                            )}
                        </div>
                    </SortableContext>
                </DndContext>
            </CardContent>
        </Card>
    );
}
