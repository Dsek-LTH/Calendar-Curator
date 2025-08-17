"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CalendarIcon, LinkIcon } from "lucide-react"
import { CalendarView } from "@/components/calendar-view"
import { FilterPanel } from "@/components/filter-panel"
import { BlockedEventsPanel } from "@/components/blocked-events-panel"
import { FilterRulesPanel, type FilterRule } from "@/components/filter-rules-panel"

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

export default function Home() {
  const [icalUrl, setIcalUrl] = useState("")
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([])
  const [blockedEventIds, setBlockedEventIds] = useState<Set<string>>(new Set())
  const [filterRules, setFilterRules] = useState<FilterRule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [proxyUrl, setProxyUrl] = useState("")

  const applyFilterRules = (events: CalendarEvent[], rules: FilterRule[]) => {
    const newBlockedIds = new Set(blockedEventIds)

    events.forEach((event) => {
      rules.forEach((rule) => {
        const fieldValue = event[rule.field]?.toLowerCase() || ""
        const ruleValue = rule.value.toLowerCase()

        let matches = false
        switch (rule.operator) {
          case "contains":
            matches = fieldValue.includes(ruleValue)
            break
          case "equals":
            matches = fieldValue === ruleValue
            break
          case "starts_with":
            matches = fieldValue.startsWith(ruleValue)
            break
          case "ends_with":
            matches = fieldValue.endsWith(ruleValue)
            break
          case "not_contains":
            matches = !fieldValue.includes(ruleValue)
            break
        }

        if (matches && rule.action === "block") {
          newBlockedIds.add(event.id)
        }
      })
    })

    setBlockedEventIds(newBlockedIds)
  }

  const loadCalendar = async () => {
    if (!icalUrl.trim()) {
      setError("Please enter a valid iCal URL")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/ical/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: icalUrl }),
      })

      if (!response.ok) {
        throw new Error("Failed to load calendar")
      }

      const data = await response.json()
      setEvents(data.events)
      setFilteredEvents(data.events)
      setProxyUrl(data.proxyUrl)
      applyFilterRules(data.events, filterRules)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load calendar")
    } finally {
      setLoading(false)
    }
  }

  const toggleBlockEvent = async (eventId: string) => {
    try {
      const response = await fetch("/api/ical/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          blocked: !blockedEventIds.has(eventId),
          icalUrl,
        }),
      })

      if (response.ok) {
        const newBlockedIds = new Set(blockedEventIds)
        if (newBlockedIds.has(eventId)) {
          newBlockedIds.delete(eventId)
        } else {
          newBlockedIds.add(eventId)
        }
        setBlockedEventIds(newBlockedIds)
      }
    } catch (err) {
      console.error("Failed to toggle block status:", err)
    }
  }

  const handleFilterRulesChange = (rules: FilterRule[]) => {
    setFilterRules(rules)
    if (events.length > 0) {
      applyFilterRules(events, rules)
    }
  }

  return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold flex items-center justify-center gap-2">
              <CalendarIcon className="h-8 w-8 text-primary" />
              iCal Stream Filter
            </h1>
            <p className="text-muted-foreground">Proxy, filter, and manage your calendar subscriptions</p>
          </div>

          {/* URL Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Calendar Subscription
              </CardTitle>
              <CardDescription>Enter your iCal subscription URL to get started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                    placeholder="https://calendar.google.com/calendar/ical/..."
                    value={icalUrl}
                    onChange={(e) => setIcalUrl(e.target.value)}
                    className="flex-1"
                />
                <Button onClick={loadCalendar} disabled={loading}>
                  {loading ? "Loading..." : "Load Calendar"}
                </Button>
              </div>
              {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
              {proxyUrl && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Filtered Proxy URL:</p>
                    <div className="flex gap-2">
                      <Input value={proxyUrl} readOnly className="flex-1 font-mono text-xs" />
                      <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(proxyUrl)}>
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

          {events.length > 0 && (
              <div className="grid lg:grid-cols-4 gap-6">
                {/* Filter Panel */}
                <div className="lg:col-span-1 space-y-6">
                  <FilterPanel events={events} onFilterChange={setFilteredEvents} blockedEventIds={blockedEventIds} />
                  {/* Filter Rules Panel */}
                  <FilterRulesPanel rules={filterRules} onRulesChange={handleFilterRulesChange} />
                </div>

                {/* Calendar View */}
                <div className="lg:col-span-3">
                  <CalendarView
                      events={filteredEvents}
                      blockedEventIds={blockedEventIds}
                      onToggleBlock={toggleBlockEvent}
                  />
                </div>

                {/* Blocked Events Panel */}
                <div className="lg:col-span-1">
                  <BlockedEventsPanel
                      events={events.filter((e) => blockedEventIds.has(e.id))}
                      onUnblock={toggleBlockEvent}
                  />
                </div>
              </div>
          )}

          {events.length === 0 && !loading && (
              <Card>
                <CardContent className="text-center py-12">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Enter an iCal URL above to start filtering your calendar</p>
                </CardContent>
              </Card>
          )}
        </div>
      </div>
  )
}