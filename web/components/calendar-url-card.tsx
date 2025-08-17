import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LinkIcon } from "lucide-react";
import React, { useState } from "react";
import { CalendarEvent, fetchClient } from "@/lib/api";
import queryString from "query-string";

interface CalendarUrlCardProps {
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  setCalendarId: React.Dispatch<React.SetStateAction<string | null>>;
  setFilteredEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  error: string;
}

export function CalendarUrlCard({
                                  setEvents,
                                  setCalendarId,
                                  setFilteredEvents,
                                  setLoading,
                                  setError,
                                  loading,
                                  error,
                                }: CalendarUrlCardProps) {
  const [icalUrl, setIcalUrl] = useState("");
  const [proxyUrl, setProxyUrl] = useState("");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const queryStringParams = queryString.parse(window.location.search);
      let calendarId = queryStringParams.calendarId;
      if (Array.isArray(calendarId)) {
        console.error("calendarId should not be an array");
        calendarId = "";
      }
      if (calendarId && calendarId !== "") {
        setCalendarId(calendarId as string);
        fetchClient
          .GET(`/calendars/{id}/get_url`, {
            params: { path: { id: calendarId } },
          })
          .then((res) => {
            if (res.response.ok && res.data) {
              setIcalUrl(res.data);
              loadCalendar(res.data, calendarId);
              setProxyUrl(`/calendars/${calendarId}/feed`);
            } else {
              setError("Failed to load calendar URL");
            }
          })
          .catch((err) => {
            setError("Failed to load calendar URL: " + err.message);
          });
      }
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCalendar = async (icalUrl: string, calendar_id?: string) => {
    setLoading(true);
    setError("");

    if (!icalUrl.trim()) {
      setError("Please enter a valid iCal URL");
      setLoading(false);
      return;
    }

    try {
      if (!calendar_id) {
        // Create calendar
        const createRes = await fetchClient.POST("/calendars/create", {
          headers: { "Content-Type": "application/json" },
          body: { url: icalUrl },
        });
        calendar_id = createRes.data?.id;
        if (!createRes.response.ok || !calendar_id)
          throw new Error(
            "Failed to create calendar: " + createRes.response.statusText,
          );
      }

      setCalendarId(calendar_id || null);

      // Get events
      const eventsRes = await fetchClient.GET(`/calendars/{id}/get_events`, {
        params: { path: { id: calendar_id } },
      });
      const eventsData = eventsRes.data;
      if (!eventsRes.response.ok || !eventsData)
        throw new Error("Failed to load calendar");

      setEvents(eventsData || []);
      setFilteredEvents(eventsData || []);
      setProxyUrl(`/calendars/${calendar_id}/feed`);
      if (window !== undefined) {
        window.history.replaceState(null, "", `?calendarId=${calendar_id}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load calendar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5"/>
          Calendar Subscription
        </CardTitle>
        <CardDescription>
          Enter your iCal subscription URL to get started
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="https://calendar.google.com/calendar/ical/..."
            value={icalUrl}
            onChange={(e) => setIcalUrl(e.target.value)}
            className="flex-1"
          />
          <Button onClick={() => loadCalendar(icalUrl)} disabled={loading}>
            {loading ? "Loading..." : "Load Calendar"}
          </Button>
        </div>
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}
        {proxyUrl && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Filtered Proxy URL:</p>
            <div className="flex gap-2">
              <Input
                value={proxyUrl}
                readOnly
                className="flex-1 font-mono text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(proxyUrl)}
              >
                Copy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use this URL in your calendar app to get the filtered events
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
