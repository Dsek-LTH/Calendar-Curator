"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EyeIcon, EyeOffIcon, ShieldCheckIcon, ShieldXIcon } from "lucide-react";
import { CalendarEvent } from "@/lib/api";

interface BlockedEventsPanelProps {
  events: CalendarEvent[];
  onUnblock: (eventId: CalendarEvent) => void;
  onRemoveFromAllowlist: (eventId: CalendarEvent) => void;
}

export function BlockedEventsPanel({
                                     events,
                                     onUnblock,
                                     onRemoveFromAllowlist,
                                   }: BlockedEventsPanelProps) {
  const blockedEvents = events.filter((e) => e.manually_blocked);
  const allowlistedEvents = events.filter((e) => e.manually_allowlisted);
  const totalEvents = blockedEvents.length + allowlistedEvents.length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: localStorage.getItem("calendar-time-format") === "12-hour" || false,
    });
  };

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-orange-50">
      <CardHeader className="">
        <CardTitle className="flex items-center gap-2">
          <EyeOffIcon className="h-5 w-5"/>
          Manual Overrides ({totalEvents})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pb-52 max-h-[600px] p-6">
        {/* Blocked Events Section */}
        {blockedEvents.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <EyeOffIcon className="h-4 w-4"/>
              Blocked Events ({blockedEvents.length})
            </h4>
            {blockedEvents.map((event) => (
              <div
                key={`blocked-${event.original.uid}`}
                className="p-3 border rounded-lg bg-gradient-to-r from-red-50 to-rose-50 border-red-200 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-sm leading-tight">
                    {event.original.summary}
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUnblock(event)}
                    className="border-green-300 text-green-700 hover:bg-green-100"
                  >
                    <EyeIcon className="h-4 w-4"/>
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
                  Blocked from proxy
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Allowlisted Events Section */}
        {allowlistedEvents.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShieldCheckIcon className="h-4 w-4"/>
              Allowlisted Events ({allowlistedEvents.length})
            </h4>
            {allowlistedEvents.map((event) => (
              <div
                key={`allowlisted-${event.original.uid}`}
                className="p-3 border rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-sm leading-tight">
                    {event.original.summary}
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRemoveFromAllowlist(event)}
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    <ShieldXIcon className="h-4 w-4"/>
                    Remove
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

                <Badge
                  variant="secondary"
                  className="text-xs bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300"
                >
                  Protected from rules
                </Badge>
              </div>
            ))}
          </div>
        )}

        {totalEvents === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No manual overrides
          </div>
        )}
      </CardContent>
    </Card>
  );
}
