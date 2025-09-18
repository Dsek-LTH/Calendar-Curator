"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { CalendarView } from "@/components/calendar-view";
import { BlockedEventsPanel } from "@/components/blocked-events-panel";
import { CalendarEvent, fetchClient } from "@/lib/api";
import { CalendarUrlCard } from "@/components/calendar-url-card";
import { Card, CardContent } from "@/components/ui/card";
import { RulesPanel } from "@/components/filter-rules-panel";
import { Header } from "@/components/header";

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
        <Header />

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

        {/* Main Content Area with conditional blur */}
        <div className={`relative ${!calendarId ? "pointer-events-none" : ""}`}>
          {/* Blur overlay when no calendar is loaded */}
          {!calendarId && (
            <div className="absolute inset-0 bg-white/30 z-10 flex items-center justify-center rounded-lg">
              <Card className="p-6 shadow-lg bg-white/90">
                <CardContent className="text-center space-y-2">
                  <CalendarIcon className="h-12 w-12 mx-auto text-slate-400" />
                  <h3 className="text-lg font-semibold text-slate-700">
                    No Calendar Loaded
                  </h3>
                  <p className="text-slate-500 text-sm">
                    Please enter a calendar URL above to get started
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <div
            className={`grid lg:grid-cols-4 gap-6 ${!calendarId ? "blur-sm" : ""}`}
          >
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
        </div>
      </div>
    </div>
  );
}
