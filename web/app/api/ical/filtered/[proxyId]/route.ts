import { type NextRequest, NextResponse } from "next/server"

// Mock data - in real implementation, you'd fetch from database
const subscriptions = new Map()
const blockedEvents = new Map<string, Set<string>>()

function generateFilteredICalData(events: any[], blockedEventIds: Set<string>) {
  const filteredEvents = events.filter((event) => !blockedEventIds.has(event.id))

  let icalData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//iCal Stream Filter//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Filtered Calendar
X-WR-TIMEZONE:UTC
`

  filteredEvents.forEach((event) => {
    icalData += `BEGIN:VEVENT
UID:${event.id}
DTSTART:${event.start.replace(/[-:]/g, "").replace(/\.\d{3}/, "")}
DTEND:${event.end.replace(/[-:]/g, "").replace(/\.\d{3}/, "")}
SUMMARY:${event.title}
DESCRIPTION:${event.description || ""}
LOCATION:${event.location || ""}
ORGANIZER:${event.organizer || ""}
CREATED:${new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "")}
LAST-MODIFIED:${new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "")}
END:VEVENT
`
  })

  icalData += "END:VCALENDAR"
  return icalData
}

export async function GET(request: NextRequest, { params }: { params: { proxyId: string } }) {
  try {
    const { proxyId } = params

    // In a real implementation, you'd:
    // 1. Look up the original iCal URL from the proxyId
    // 2. Fetch fresh data from the original URL
    // 3. Apply the current filters and blocks
    // 4. Return the filtered iCal data

    // Mock implementation
    const mockEvents = [
      {
        id: "event-1",
        title: "Team Meeting",
        start: "2024-01-15T10:00:00Z",
        end: "2024-01-15T11:00:00Z",
        description: "Weekly team sync meeting",
        location: "Conference Room A",
        organizer: "john@company.com",
      },
      {
        id: "event-2",
        title: "Project Review",
        start: "2024-01-16T14:00:00Z",
        end: "2024-01-16T15:30:00Z",
        description: "Quarterly project review session",
        location: "Main Office",
        organizer: "sarah@company.com",
      },
    ]

    // Get blocked events for this proxy (mock)
    const mockBlockedEvents = new Set(["event-1"]) // Simulate event-1 being blocked

    const filteredICalData = generateFilteredICalData(mockEvents, mockBlockedEvents)

    return new NextResponse(filteredICalData, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="filtered-calendar.ics"',
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("Error generating filtered iCal:", error)
    return NextResponse.json({ error: "Failed to generate filtered calendar" }, { status: 500 })
  }
}
