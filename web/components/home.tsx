"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { CalendarView } from "@/components/calendar-view";
import { BlockedEventsPanel } from "@/components/blocked-events-panel";
import { CalendarEvent, fetchClient } from "@/lib/api";
import { CalendarUrlCard } from "@/components/calendar-url-card";
import { Card, CardContent } from "@/components/ui/card";
import { RulesPanel } from "@/components/filter-rules-panel";

export function Home() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendarId, setCalendarId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleBlockEvent = async (event: CalendarEvent) => {
    if (!calendarId) {
      console.error("No calendar ID set");
      return;
    }
    const path = event.blocked
      ? "/calendars/{id}/block/remove"
      : "/calendars/{id}/block/add";

    await fetchClient.POST(path, {
      params: { path: { id: calendarId } },
      body: event.uid,
    });

    setEvents((prev) =>
      prev.map((ev) =>
        ev.uid === event.uid ? { ...ev, blocked: !ev.blocked } : ev,
      ),
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-2">
            <CalendarIcon className="h-8 w-8 text-primary" />
            iCal Stream Filter
          </h1>
          <p className="text-muted-foreground">
            Proxy, filter, and manage your calendar subscriptions
          </p>
        </div>

        {/* URL Input */}
        <CalendarUrlCard
          setEvents={setEvents}
          setCalendarId={setCalendarId}
          setFilteredEvents={setEvents}
          setLoading={setLoading}
          setError={setError}
          loading={loading}
          error={error}
        />

        {events.length > 0 && (
          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-6">
              {/* Filter Rules Panel */}
              <RulesPanel calendarId={calendarId} />
              {/* Blocked Events Panel */}
              <BlockedEventsPanel
                events={events.filter((e) => e.blocked)}
                onUnblock={toggleBlockEvent}
              />
            </div>

            {/* Calendar View */}
            <div className="lg:col-span-3">
              <CalendarView events={events} onToggleBlock={toggleBlockEvent} />
            </div>
          </div>
        )}

        {events.length === 0 && !loading && (
          <Card>
            <CardContent className="text-center py-12">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Enter an iCal URL above to start filtering your calendar
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
