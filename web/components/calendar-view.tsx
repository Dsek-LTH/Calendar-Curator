import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeOffIcon,
  ArrowRightIcon,
  ScaleIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { EventDetailsModal } from "@/components/event-details-modal";
import { CalendarEvent } from "@/lib/api";

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
    let sundayFirst = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    // Adjust to make Monday the first day of the week
    return (sundayFirst + 6) % 7;
  };

  const getLastDayOfMonth = (date: Date) => {
    let sundayFirst = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    ).getDay();
    // Adjust to make Monday the first day of the week
    return (sundayFirst + 6) % 7;
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
          new Date(aEvent.start!!).getTime() -
          new Date(bEvent.start!!).getTime()
        );
      });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const generateCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const lastDay = getLastDayOfMonth(currentDate);

    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    for (let i = lastDay + 1; i <= 6; i++) {
      days.push(null);
    }

    return days;
  };

  const calendarDays = generateCalendarGrid();
  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <Card>
        <CardHeader>
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
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("next")}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div
                key={day}
                className="p-2 text-center text-sm font-medium text-muted-foreground border-b"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => (
              <div
                key={index}
                className={`min-h-[120px] p-1 border rounded-lg ${
                  date ? "bg-card hover:bg-muted/50" : "bg-transparent"
                } transition-colors`}
              >
                {date && (
                  <>
                    <div className="text-sm font-medium mb-1 text-center">
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
                            className={`text-xs p-1 rounded cursor-pointer transition-all hover:shadow-sm ${
                              isMatchedByHoveredRule &&
                              ((event.rule_blocked &&
                                !event.manually_allowlisted) ||
                                event.manually_blocked)
                                ? "bg-destructive/40 text-destructive border border-destructive/50"
                                : isMatchedByHoveredRule
                                  ? "bg-primary/30 text-primary border border-primary/40 hover:bg-primary/50"
                                  : (event.rule_blocked &&
                                        !event.manually_allowlisted) ||
                                      event.manually_blocked
                                    ? "bg-destructive/20 text-destructive border border-destructive/30"
                                    : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
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
                            title={`${displayEvent.summary} - ${formatTime(displayEvent.start!!)}`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1 truncate">
                                {hasTransformedTime && (
                                  <span className="text-muted-foreground line-through text-[10px]">
                                    {formatTime(event.original.start!!)}
                                  </span>
                                )}
                                {hasTransformedTime && (
                                  <ArrowRightIcon className="h-2 w-2 text-muted-foreground" />
                                )}
                                <span className="font-medium">
                                  {formatTime(displayEvent.start!!)}
                                </span>
                              </div>
                              <div className="ml-auto" />
                              {event.manually_blocked && (
                                <EyeOffIcon className="h-3 w-3 flex-shrink-0" />
                              )}
                              {event.rule_blocked && (
                                <ScaleIcon className="h-3 w-3 flex-shrink-0" />
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

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Total events: {events.length} | Blocked:{" "}
            {events.filter((e) => e.manually_blocked || e.rule_blocked).length}
          </div>
        </CardContent>
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
    </>
  );
}
