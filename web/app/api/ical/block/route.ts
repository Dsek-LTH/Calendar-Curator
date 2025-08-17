import { type NextRequest, NextResponse } from "next/server"

// In a real implementation, you'd store this in a database
const blockedEvents = new Map<string, Set<string>>()

export async function POST(request: NextRequest) {
  try {
    const { eventId, blocked, icalUrl } = await request.json()

    if (!eventId || !icalUrl) {
      return NextResponse.json({ error: "Event ID and iCal URL are required" }, { status: 400 })
    }

    // Use the iCal URL as the key to group blocked events by calendar
    if (!blockedEvents.has(icalUrl)) {
      blockedEvents.set(icalUrl, new Set())
    }

    const calendarBlockedEvents = blockedEvents.get(icalUrl)!

    if (blocked) {
      calendarBlockedEvents.add(eventId)
    } else {
      calendarBlockedEvents.delete(eventId)
    }

    console.log(`Event ${eventId} ${blocked ? "blocked" : "unblocked"} for calendar ${icalUrl}`)

    return NextResponse.json({
      success: true,
      eventId,
      blocked,
      totalBlocked: calendarBlockedEvents.size,
    })
  } catch (error) {
    console.error("Error updating block status:", error)
    return NextResponse.json({ error: "Failed to update block status" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const icalUrl = searchParams.get("icalUrl")

    if (!icalUrl) {
      return NextResponse.json({ blockedEvents: [] })
    }

    const calendarBlockedEvents = blockedEvents.get(icalUrl) || new Set()

    return NextResponse.json({
      blockedEvents: Array.from(calendarBlockedEvents),
    })
  } catch (error) {
    console.error("Error fetching blocked events:", error)
    return NextResponse.json({ error: "Failed to fetch blocked events" }, { status: 500 })
  }
}
