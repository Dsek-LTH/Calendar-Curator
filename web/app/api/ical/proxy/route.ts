import { type NextRequest, NextResponse } from "next/server"

// Mock iCal parser - in real implementation, you'd use a library like node-ical
function parseICalData(icalData: string) {
  // This is a simplified mock parser
  // In reality, you'd use a proper iCal parsing library
  const events = [
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
    {
      id: "event-3",
      title: "Client Presentation",
      start: "2024-01-17T09:00:00Z",
      end: "2024-01-17T10:00:00Z",
      description: "Present new features to client",
      location: "Client Office",
      organizer: "mike@company.com",
    },
    {
      id: "event-4",
      title: "Training Session",
      start: "2024-01-18T13:00:00Z",
      end: "2024-01-18T16:00:00Z",
      description: "New employee training",
      location: "Training Room",
      organizer: "hr@company.com",
    },
    {
      id: "event-5",
      title: "All Hands Meeting",
      start: "2024-01-19T15:00:00Z",
      end: "2024-01-19T16:00:00Z",
      description: "Company-wide meeting",
      location: "Main Auditorium",
      organizer: "ceo@company.com",
    },
  ]

  return events
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // In a real implementation, you would:
    // 1. Fetch the iCal data from the provided URL
    // 2. Parse it using a proper iCal library
    // 3. Store the subscription info in a database

    // Mock fetching iCal data
    console.log(`Fetching iCal data from: ${url}`)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock iCal data
    const mockICalData = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Mock Calendar//EN
BEGIN:VEVENT
UID:event-1
DTSTART:20240115T100000Z
DTEND:20240115T110000Z
SUMMARY:Team Meeting
DESCRIPTION:Weekly team sync meeting
LOCATION:Conference Room A
ORGANIZER:john@company.com
END:VEVENT
END:VCALENDAR
    `

    const events = parseICalData(mockICalData)

    // Generate a unique proxy URL for this subscription
    const proxyId = Buffer.from(url).toString("base64").slice(0, 12)
    const proxyUrl = `${request.nextUrl.origin}/api/ical/filtered/${proxyId}`

    return NextResponse.json({
      events,
      proxyUrl,
      originalUrl: url,
    })
  } catch (error) {
    console.error("Error processing iCal proxy request:", error)
    return NextResponse.json({ error: "Failed to process calendar" }, { status: 500 })
  }
}
