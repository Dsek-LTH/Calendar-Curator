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
  const [hoveredRuleId, setHoveredRuleId] = useState<string | null>(null);

  const reloadEvents = async () => {
    if (!calendarId) return;

    try {
      const response = await fetchClient.GET("/calendars/{id}/get_events", {
        params: { path: { id: calendarId } },
      });

      if (response.data) {
        setEvents(response.data);
      }
    } catch (err) {
      console.error("Failed to reload events:", err);
    }
  };

  const toggleBlockEvent = async (event: CalendarEvent) => {
    if (!calendarId) {
      console.error("No calendar ID set");
      return;
    }
    const path = event.manually_blocked
      ? "/calendars/{id}/block/remove"
      : "/calendars/{id}/block/add";

    await fetchClient.POST(path, {
      params: { path: { id: calendarId } },
      body: event.original.uid,
    });

    setEvents((prev) =>
      prev.map((ev) =>
        ev.original.uid === event.original.uid
          ? {
              ...ev,
              manually_blocked: !ev.manually_blocked,
              manually_allowlisted: false,
            }
          : ev,
      ),
    );
  };

  const toggleAllowlistEvent = async (event: CalendarEvent) => {
    if (!calendarId) {
      console.error("No calendar ID set");
      return;
    }
    const path = event.manually_allowlisted
      ? "/calendars/{id}/allowlist/remove"
      : "/calendars/{id}/allowlist/add";

    await fetchClient.POST(path, {
      params: { path: { id: calendarId } },
      body: event.original.uid,
    });

    setEvents((prev) =>
      prev.map((ev) =>
        ev.original.uid === event.original.uid
          ? {
              ...ev,
              manually_allowlisted: !ev.manually_allowlisted,
              manually_blocked: false,
            }
          : ev,
      ),
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-2 ">
            <div className="gap-2 flex items-center justify-center bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            <CalendarIcon className="h-8 w-8 text-blue-600" />
            Calendar Curator
            </div>
          </h1>
          <p className="text-slate-600">
            Curate your calendar events with custom rules
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
          calendarId={calendarId}
        />

        {events.length > 0 && (
          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-6">
              {/* Filter Rules Panel */}
              <RulesPanel
                calendarId={calendarId}
                onRuleHover={setHoveredRuleId}
                onRuleChange={reloadEvents}
              />
              {/* Blocked Events Panel */}
              <BlockedEventsPanel
                events={events}
                onUnblock={toggleBlockEvent}
                onRemoveFromAllowlist={toggleAllowlistEvent}
              />
            </div>

            {/* Calendar View */}
            <div className="lg:col-span-3">
              <CalendarView
                events={events}
                onToggleBlock={toggleBlockEvent}
                onToggleAllowlist={toggleAllowlistEvent}
                hoveredRuleId={hoveredRuleId}
              />
            </div>
          </div>
        )}

        {events.length === 0 && !loading && (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50">
            <CardContent className="text-center py-12">
              <CalendarIcon className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <p className="text-slate-600">
                Enter an iCal URL above to start filtering your calendar
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
