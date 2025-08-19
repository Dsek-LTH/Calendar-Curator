import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  calendarId?: string | null;
}

export function CalendarUrlCard({
  setEvents,
  setCalendarId,
  setFilteredEvents,
  setLoading,
  setError,
  loading,
  error,
  calendarId,
}: CalendarUrlCardProps) {
  const [icalUrl, setIcalUrl] = useState("");
  const [proxyUrl, setProxyUrl] = useState("");
  const [windowLocation, setWindowLocation] = useState("");
  const [isChangingUrl, setIsChangingUrl] = useState(false);
  const [newUrl, setNewUrl] = useState("");

  // UUID regex pattern
  const uuidRegex =
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

  // Set window location state on mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowLocation(`${window.location.protocol}//${window.location.host}`);
    }
  }, []);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const queryStringParams = queryString.parse(window.location.search);
      let calendarId = queryStringParams.calendarId;
      if (Array.isArray(calendarId)) {
        console.error("calendarId should not be an array");
        calendarId = "";
      }
      if (calendarId) {
        checkAndLoadExistingCalendar(calendarId);
      }

      // Check URL for UUID and verify if calendar exists
      const currentUrl = window.location.href;
      const uuidMatch = currentUrl.match(uuidRegex);
      if (uuidMatch && uuidMatch[0] && !calendarId) {
        const potentialCalendarId = uuidMatch[0];
        checkAndLoadExistingCalendar(potentialCalendarId);
      }
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAndLoadExistingCalendar = async (calendarId: string) => {
    if (calendarId !== "") {
      setCalendarId(calendarId as string);
      return fetchClient
        .GET(`/calendars/{id}/get_url`, {
          params: { path: { id: calendarId } },
        })
        .then((res) => {
          if (res.response.ok && res.data) {
            setIcalUrl(res.data);
            loadCalendar(res.data, calendarId);
            setProxyUrl(`/calendars/${calendarId}/feed`);
            if (typeof window !== "undefined") {
              window.history.replaceState(
                null,
                "",
                `?calendarId=${calendarId}`,
              );
            }
            return true;
          } else {
            setError("Failed to load calendar URL");
          }
          return false;
        })
        .catch((err) => {
          setError("Failed to load calendar URL: " + err.message);
          return false;
        });
    }
    return false;
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading && icalUrl.trim()) {
      loadCalendar(icalUrl);
    }
  };

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
        let calendar_id_is_in_url = false;
        const uuidMatch = icalUrl.match(uuidRegex);
        if (uuidMatch && uuidMatch[0]) {
          const potentialCalendarId = uuidMatch[0];
          calendar_id_is_in_url =
            await checkAndLoadExistingCalendar(potentialCalendarId);
          if (calendar_id_is_in_url) {
            calendar_id = potentialCalendarId;
          }
        }

        if (!calendar_id_is_in_url) {
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
      }

      setCalendarId(calendar_id || null);

      // Get events
      const eventsRes = await fetchClient.GET(`/calendars/{id}/get_events`, {
        params: { path: { id: calendar_id!! } },
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

  const handleChangeUrl = async () => {
    if (!calendarId || !newUrl.trim()) {
      setError("Please enter a valid URL");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const updateRes = await fetchClient.PUT("/calendars/{id}/update_url", {
        params: { path: { id: calendarId } },
        body: { url: newUrl },
      });

      if (!updateRes.response.ok) {
        throw new Error(
          "Failed to update calendar URL: " + updateRes.response.statusText,
        );
      }

      // Update the current URL and reload calendar events
      setIcalUrl(newUrl);
      setNewUrl("");
      setIsChangingUrl(false);

      // Reload events with the new URL
      await loadCalendar(newUrl, calendarId);
    } catch (err: any) {
      setError(err.message || "Failed to update calendar URL");
    } finally {
      setLoading(false);
    }
  };

  const cancelChangeUrl = () => {
    setNewUrl("");
    setIsChangingUrl(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          Calendar Subscription
        </CardTitle>
        <CardDescription>
          Enter your iCal subscription or proxy feed URL to get started
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder={
              windowLocation
                ? `https://calendar.google.com/calendar/ical/... OR ${windowLocation}/calendars/<id>/feed`
                : "https://calendar.google.com/calendar/ical/... OR /calendars/<id>/feed"
            }
            value={icalUrl}
            onChange={(e) => setIcalUrl(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={() => loadCalendar(icalUrl)} disabled={loading}>
            {loading ? "Loading..." : "Load Calendar"}
          </Button>
          {calendarId && !isChangingUrl && (
            <Button
              variant="outline"
              onClick={() => setIsChangingUrl(true)}
              disabled={loading}
            >
              Change URL
            </Button>
          )}
        </div>
        {isChangingUrl && (
          <div className="space-y-2 p-3 border rounded-md bg-muted/50">
            <p className="text-sm font-medium">Update Calendar URL:</p>
            <div className="flex gap-2">
              <Input
                placeholder="Enter new iCal URL"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="flex-1"
                disabled={loading}
              />
              <Button
                onClick={handleChangeUrl}
                disabled={loading || !newUrl.trim()}
                size="sm"
              >
                {loading ? "Updating..." : "Update"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={cancelChangeUrl}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
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
                value={`${windowLocation}${proxyUrl}`}
                readOnly
                className="flex-1 font-mono text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigator.clipboard.writeText(`${windowLocation}${proxyUrl}`)
                }
              >
                Copy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use this URL in your calendar app to get the filtered events
            </p>
          </div>
        )}
        {calendarId && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Calendar ID: <span className="font-mono">{calendarId}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
