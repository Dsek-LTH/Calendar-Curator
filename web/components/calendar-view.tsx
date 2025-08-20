import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeOffIcon,
  ArrowRightIcon,
  ScaleIcon,
  ShieldCheckIcon,
  SettingsIcon,
} from "lucide-react";
import { EventDetailsModal } from "@/components/event-details-modal";
import { CalendarSettingsModal } from "@/components/calendar-settings-modal";
import { CalendarEvent } from "@/lib/api";
import {
  CalendarSettings,
  getCalendarSettings,
  setCalendarSettings,
} from "@/lib/settings";

interface CalendarViewProps {
  events: CalendarEvent[];
  onToggleBlock: (eventId: CalendarEvent) => void;
  onToggleAllowlist: (eventId: CalendarEvent) => void;
  hoveredRuleId?: string | null;
}

export function CalendarView({
  events,
  onToggleBlock,
  onToggleAllowlist,
  hoveredRuleId,
}: CalendarViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
  const [currentDate, setCurrentDate] = useState(new Date());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [calendarSettings, setCalendarSettingsState] =
    useState<CalendarSettings>(getCalendarSettings());

  useEffect(() => {
    if (selectedEvent) {
      const updated = events.find(
        (e) => e.original.uid === selectedEvent.original.uid,
      );
      if (updated) {
        setSelectedEvent(updated);
      }
    }
  }, [events, selectedEvent]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const sundayFirst = new Date(
      date.getFullYear(),
      date.getMonth(),
      1,
    ).getDay();
    // Adjust based on user preference
    if (calendarSettings.firstDayOfWeek === "monday") {
      return (sundayFirst + 6) % 7;
    } else {
      return sundayFirst;
    }
  };

  const getLastDayOfMonth = (date: Date) => {
    const sundayFirst = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    ).getDay();
    // Adjust based on user preference
    if (calendarSettings.firstDayOfWeek === "monday") {
      return (sundayFirst + 6) % 7;
    } else {
      return sundayFirst;
    }
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getEventsForDate = (date: Date) => {
    return events
      .filter((event) => {
        const eventToCheck = event.transformed || event.original;
        if (!eventToCheck.start) return false;
        const eventDate = new Date(eventToCheck.start);
        return eventDate.toDateString() === date.toDateString();
      })
      .sort((a, b) => {
        const aEvent = a.transformed || a.original;
        const bEvent = b.transformed || b.original;
        return (
          new Date(aEvent.start!).getTime() - new Date(bEvent.start!).getTime()
        );
      });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: calendarSettings.timeFormat === "12h",
    });
  };

  // The boolean value indicates if the date is outside the current month
  const generateCalendarGrid = (): [Date, boolean][] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const lastDay = getLastDayOfMonth(currentDate);

    const days: [Date, boolean][] = [];

    for (let i = 0; i < firstDay; i++) {
      // Negative days
      days.push([new Date(year, month, -firstDay + i + 1), true]);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push([new Date(year, month, day), false]);
    }

    for (let i = 1; i <= 6 - lastDay; i++) {
      days.push([new Date(year, month + 1, i), true]);
    }

    return days;
  };

  const calendarDays = generateCalendarGrid();
  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Generate day headers based on user preference
  const dayHeaders =
    calendarSettings.firstDayOfWeek === "monday"
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Handle settings changes and persist them
  const handleSettingsChange = (newSettings: Partial<CalendarSettings>) => {
    const updatedSettings = { ...calendarSettings, ...newSettings };
    setCalendarSettingsState(updatedSettings);
    setCalendarSettings(newSettings);
  };

  return (
    <>
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
        <CardHeader className="">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {monthName}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("prev")}
                className="shadow border-white/20  hover:bg-slate-50"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("next")}
                className="shadow border-white/20  hover:bg-slate-50"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSettingsOpen(true)}
                className="shadow border-white/20  hover:bg-slate-50"
              >
                <SettingsIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-1 mb-4">
            {dayHeaders.map((day) => (
              <div
                key={day}
                className="p-2 text-center text-sm font-medium text-slate-600 border-b border-slate-200"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(([date, isOutsideMonth], index) => (
              <div
                key={index}
                className={`min-h-[120px] p-1 border rounded-lg ${
                  date ? "bg-card" : "bg-transparent"
                } transition-colors`}
              >
                {date && (
                  <>
                    <div
                      className={`text-sm font-medium mb-1 text-center ${isOutsideMonth ? "text-slate-400" : "text-slate-700"}`}
                    >
                      {date.getDate()}
                    </div>

                    <div className="space-y-1">
                      {getEventsForDate(date).map((event) => {
                        const isMatchedByHoveredRule =
                          hoveredRuleId &&
                          event.filtered_by?.includes(hoveredRuleId);
                        const hasTransformedTitle =
                          event.changed_fields.includes("summary");
                        const hasTransformedTime =
                          event.changed_fields.includes("start");

                        // Use transformed data if available and not blocked
                        const displayEvent = event.transformed
                          ? event.transformed
                          : event.original;

                        return (
                          <div
                            key={event.original.uid}
                            className={`border-0 shadow-md text-xs p-1 rounded cursor-pointer transition-all duration-200 hover:shadow-lg ${
                              isMatchedByHoveredRule &&
                              ((event.rule_blocked &&
                                !event.manually_allowlisted) ||
                                event.manually_blocked)
                                ? "bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-300 hover:from-red-200 hover:to-rose-200"
                                : isMatchedByHoveredRule
                                  ? "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-300 hover:from-blue-200 hover:to-indigo-200"
                                  : (event.rule_blocked &&
                                        !event.manually_allowlisted) ||
                                      event.manually_blocked
                                    ? "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200 hover:from-red-100 hover:to-rose-100"
                                    : "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 hover:from-blue-100 hover:to-indigo-100"
                            }`}
                            onClick={(e) => {
                              if (e.shiftKey) {
                                if (event.manually_blocked) {
                                  onToggleBlock(event);
                                } else if (event.manually_allowlisted) {
                                  onToggleAllowlist(event);
                                } else if (event.rule_blocked) {
                                  onToggleAllowlist(event);
                                } else {
                                  onToggleBlock(event);
                                }
                                e.preventDefault();
                                window.getSelection()?.removeAllRanges();
                              } else {
                                setSelectedEvent(event);
                              }
                              e.stopPropagation();
                            }}
                            title={`${displayEvent.summary} - ${formatTime(displayEvent.start!)}`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1 truncate">
                                {hasTransformedTime && (
                                  <span className="text-muted-foreground line-through text-[10px]">
                                    {formatTime(event.original.start!)}
                                  </span>
                                )}
                                {hasTransformedTime && (
                                  <ArrowRightIcon className="h-2 w-2 text-muted-foreground" />
                                )}
                                <span className="font-medium">
                                  {formatTime(displayEvent.start!)}
                                </span>
                              </div>
                              <div className="ml-auto" />
                              {event.rule_blocked && (
                                <ScaleIcon className="h-3 w-3 flex-shrink-0" />
                              )}
                              {event.manually_blocked && (
                                <EyeOffIcon className="h-3 w-3 flex-shrink-0" />
                              )}
                              {event.manually_allowlisted && (
                                <ShieldCheckIcon className="h-3 w-3 flex-shrink-0 text-green-600" />
                              )}
                            </div>
                            <div className="truncate">
                              {hasTransformedTitle && (
                                <>
                                  <span className="text-muted-foreground line-through text-[10px] block">
                                    {event.original.summary}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <ArrowRightIcon className="h-2 w-2 text-muted-foreground" />
                                    <span>{displayEvent.summary}</span>
                                  </div>
                                </>
                              )}
                              {!hasTransformedTitle && displayEvent.summary}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <div className="mt-4 text-center text-sm text-slate-600 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-3 border border-slate-200">
            Total events: {events.length} | Blocked:{" "}
            {events.filter((e) => e.manually_blocked || e.rule_blocked).length}
          </div>
        </CardFooter>
      </Card>

      <EventDetailsModal
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => {
          setSelectedEvent(null);
        }}
        onToggleBlock={onToggleBlock}
        onToggleAllowlist={onToggleAllowlist}
      />

      <CalendarSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={calendarSettings}
        onSettingsChange={handleSettingsChange}
      />
    </>
  );
}
