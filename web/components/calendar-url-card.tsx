import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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

  // Check if the current hostname is local
  const isLocalHost = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    const hostname = window.location.hostname;
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.") ||
      hostname.endsWith(".local")
    );
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
            setProxyUrl(`/api/calendars/${calendarId}/feed`);
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
        params: { path: { id: calendar_id! } },
      });
      const eventsData = eventsRes.data;
      if (!eventsRes.response.ok || !eventsData)
        throw new Error("Failed to load calendar");

      setEvents(eventsData || []);
      setFilteredEvents(eventsData || []);
      setProxyUrl(`/api/calendars/${calendar_id}/feed`);
      if (typeof window !== "undefined") {
        window.history.pushState(null, "", `?calendarId=${calendar_id}`);
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
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
      <CardHeader className="">
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          Calendar Subscription
        </CardTitle>
        <CardDescription className="">
          Enter your iCal subscription or proxy feed URL to get started
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="flex gap-2">
          <Input
            placeholder={
              windowLocation
                ? `https://calendar.google.com/calendar/ical/... OR ${windowLocation}/api/calendars/<id>/feed`
                : "https://calendar.google.com/calendar/ical/... OR /api/calendars/<id>/feed"
            }
            value={icalUrl}
            onChange={(e) => setIcalUrl(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
          />
          <Button
            onClick={() => loadCalendar(icalUrl)}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            {loading ? "Loading..." : "Load Calendar"}
          </Button>
          {calendarId && !isChangingUrl && (
            <Button
              variant="outline"
              onClick={() => setIsChangingUrl(true)}
              disabled={loading}
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              Change URL
            </Button>
          )}
        </div>
        {isChangingUrl && (
          <div className="space-y-2 p-3 border rounded-md bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <p className="text-sm font-medium text-blue-800">
              Update Calendar URL:
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Enter new iCal URL"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="flex-1 border-blue-200 focus:border-blue-400"
                disabled={loading}
              />
              <Button
                onClick={handleChangeUrl}
                disabled={loading || !newUrl.trim()}
                size="sm"
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                {loading ? "Updating..." : "Update"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={cancelChangeUrl}
                disabled={loading}
                className="border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
        {error && (
          <div className="text-sm text-red-700 bg-gradient-to-r from-red-50 to-rose-50 p-3 rounded-md border border-red-200">
            {error}
          </div>
        )}
        {proxyUrl && (
          <div
            className={`space-y-2 p-4 rounded-lg border ${
              isLocalHost
                ? "bg-gradient-to-r from-red-50 to-rose-50 border-red-200"
                : "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
            }`}
          >
            <p
              className={`text-sm font-medium ${
                isLocalHost ? "text-red-800" : "text-green-800"
              }`}
            >
              Filtered Proxy URL:
            </p>
            <div className="flex gap-2">
              <Input
                value={`${windowLocation}${proxyUrl}`}
                readOnly
                className={`flex-1 font-mono text-xs bg-white ${
                  isLocalHost ? "border-red-200" : "border-green-200"
                }`}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigator.clipboard.writeText(`${windowLocation}${proxyUrl}`)
                }
                className={
                  isLocalHost
                    ? "border-red-300 text-red-700 hover:bg-red-100"
                    : "border-green-300 text-green-700 hover:bg-green-100"
                }
              >
                Copy
              </Button>
            </div>
            <p
              className={`text-xs ${
                isLocalHost ? "text-red-700" : "text-green-700"
              }`}
            >
              {isLocalHost
                ? "Warning: This is a local URL and won't work from other devices. You need to access this page from a public IP/domain."
                : "Use this URL in your calendar app to get the filtered events"}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {calendarId && (
          <p className="text-xs text-slate-600">
            Calendar ID:{" "}
            <span className="font-mono text-slate-800">{calendarId}</span>
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
