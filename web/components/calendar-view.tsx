"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, EyeOffIcon } from "lucide-react"
import { EventDetailsModal } from "@/components/event-details-modal"

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  description?: string
  location?: string
  organizer?: string
  isBlocked?: boolean
}

interface CalendarViewProps {
  events: CalendarEvent[]
  blockedEventIds: Set<string>
  onToggleBlock: (eventId: string) => void
}

export function CalendarView({ events, blockedEventIds, onToggleBlock }: CalendarViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const getEventsForDate = (date: Date) => {
    return events
      .filter((event) => {
        const eventDate = new Date(event.start)
        return eventDate.toDateString() === date.toDateString()
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const generateCalendarGrid = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)

    const days = []

    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const calendarDays = generateCalendarGrid()
  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })

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
              <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-b">
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
                    <div className="text-sm font-medium mb-1 text-center">{date.getDate()}</div>

                    <div className="space-y-1">
                      {getEventsForDate(date).map((event) => {
                        const isBlocked = blockedEventIds.has(event.id)

                        return (
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded cursor-pointer transition-all hover:shadow-sm ${
                              isBlocked
                                ? "bg-destructive/20 text-destructive border border-destructive/30"
                                : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                            }`}
                            onClick={() => setSelectedEvent(event)}
                            title={`${event.title} - ${formatTime(event.start)}`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="truncate font-medium">{formatTime(event.start)}</span>
                              {isBlocked && <EyeOffIcon className="h-3 w-3 flex-shrink-0" />}
                            </div>
                            <div className="truncate">{event.title}</div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Total events: {events.length} | Blocked: {blockedEventIds.size}
          </div>
        </CardContent>
      </Card>

      <EventDetailsModal
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onToggleBlock={onToggleBlock}
        isBlocked={selectedEvent ? blockedEventIds.has(selectedEvent.id) : false}
      />
    </>
  )
}
