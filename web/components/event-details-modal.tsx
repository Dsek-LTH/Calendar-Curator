"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, ClockIcon, EyeOffIcon, FileTextIcon, MapPinIcon, } from "lucide-react";
import { CalendarEvent } from "@/lib/api";

interface EventDetailsModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleBlock: (eventId: CalendarEvent) => void;
}

export function EventDetailsModal({
                                    event,
                                    isOpen,
                                    onClose,
                                    onToggleBlock,
                                  }: EventDetailsModalProps) {
  if (!event) return null;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const startDateTime = event.start ? formatDateTime(event.start) : null;
  const endDateTime = event.end ? formatDateTime(event.end) : null;
  const isSameDay = startDateTime?.date === endDateTime?.date;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-start gap-3 text-left">
            <CalendarIcon className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h2 className="text-xl font-semibold leading-tight">
                {event.summary}
              </h2>
              {event.blocked && (
                <Badge variant="destructive" className="mt-2">
                  <EyeOffIcon className="h-3 w-3 mr-1" />
                  Blocked Event
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date and Time */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ClockIcon className="h-4 w-4" />
              Date & Time
            </div>
            {startDateTime && endDateTime && (
              <div className="pl-6 space-y-1">
                <div className="font-medium">{startDateTime.date}</div>
                <div className="text-sm text-muted-foreground">
                  {startDateTime.time} -{" "}
                  {isSameDay
                    ? endDateTime.time
                    : `${endDateTime.date} ${endDateTime.time}`}
                </div>
              </div>
            )}
          </div>

          {/* Location */}
          {event.location && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <MapPinIcon className="h-4 w-4" />
                  Location
                </div>
                <div className="pl-6">
                  <div className="font-medium">{event.location}</div>
                </div>
              </div>
            </>
          )}

          {/* Description */}
          {event.description && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <FileTextIcon className="h-4 w-4" />
                  Description
                </div>
                <div className="pl-6">
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {event.description}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <Separator />
          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-muted-foreground">
              {event.blocked
                ? "This event is blocked and won't appear in the filtered calendar."
                : "This event will appear in the filtered calendar."}
            </div>
            <Button
              variant={event.blocked ? "destructive" : "outline"}
              onClick={() => onToggleBlock(event)}
              className="ml-4"
            >
              <EyeOffIcon className="h-4 w-4 mr-2" />
              {event.blocked ? "Unblock Event" : "Block Event"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
