"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { CalendarEvent } from "@/lib/api";

interface BlockedEventsPanelProps {
  events: CalendarEvent[];
  onUnblock: (eventId: CalendarEvent) => void;
}

export function BlockedEventsPanel({
  events,
  onUnblock,
}: BlockedEventsPanelProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <EyeOffIcon className="h-5 w-5" />
          Manually Blocked Events ({events.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
        {events.map((event) => (
          <div
            key={event.original.uid}
            className="p-3 border rounded-lg bg-muted/50 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-sm leading-tight">
                {event.original.summary}
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUnblock(event)}
              >
                <EyeIcon className="h-4 w-4" />
                Unblock
              </Button>
            </div>

            {event.original.start && (
              <div className="text-xs text-muted-foreground">
                {formatDate(event.original.start)}
              </div>
            )}

            {event.original.location && (
              <div className="text-xs text-muted-foreground">
                📍 {event.original.location}
              </div>
            )}

            <Badge variant="destructive" className="text-xs">
              Filtered out of proxy
            </Badge>
          </div>
        ))}

        {events.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No blocked events
          </div>
        )}
      </CardContent>
    </Card>
  );
}
