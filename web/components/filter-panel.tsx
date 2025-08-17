"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { FilterIcon, SearchIcon } from "lucide-react"

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

interface FilterPanelProps {
  events: CalendarEvent[]
  onFilterChange: (filteredEvents: CalendarEvent[]) => void
  blockedEventIds: Set<string>
}

export function FilterPanel({ events, onFilterChange, blockedEventIds }: FilterPanelProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState({ start: "", end: "" })
  const [selectedOrganizers, setSelectedOrganizers] = useState<Set<string>>(new Set())
  const [hideBlocked, setHideBlocked] = useState(false)

  // Get unique organizers
  const organizers = Array.from(new Set(events.map((e) => e.organizer).filter(Boolean))).sort()

  useEffect(() => {
    let filtered = events

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(term) ||
          event.description?.toLowerCase().includes(term) ||
          event.location?.toLowerCase().includes(term),
      )
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter((event) => new Date(event.start) >= new Date(dateRange.start))
    }
    if (dateRange.end) {
      filtered = filtered.filter((event) => new Date(event.start) <= new Date(dateRange.end + "T23:59:59"))
    }

    // Organizer filter
    if (selectedOrganizers.size > 0) {
      filtered = filtered.filter((event) => event.organizer && selectedOrganizers.has(event.organizer))
    }

    // Hide blocked events
    if (hideBlocked) {
      filtered = filtered.filter((event) => !blockedEventIds.has(event.id))
    }

    onFilterChange(filtered)
  }, [searchTerm, dateRange, selectedOrganizers, hideBlocked, events, blockedEventIds, onFilterChange])

  const toggleOrganizer = (organizer: string) => {
    const newSelected = new Set(selectedOrganizers)
    if (newSelected.has(organizer)) {
      newSelected.delete(organizer)
    } else {
      newSelected.add(organizer)
    }
    setSelectedOrganizers(newSelected)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setDateRange({ start: "", end: "" })
    setSelectedOrganizers(new Set())
    setHideBlocked(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FilterIcon className="h-5 w-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search Events</Label>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search title, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <Label>Date Range</Label>
          <div className="space-y-2">
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
              placeholder="Start date"
            />
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
              placeholder="End date"
            />
          </div>
        </div>

        {/* Organizers */}
        {organizers.length > 0 && (
          <div className="space-y-2">
            <Label>Organizers</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {organizers.map((organizer) => (
                <div key={organizer} className="flex items-center space-x-2">
                  <Checkbox
                    id={`organizer-${organizer}`}
                    checked={selectedOrganizers.has(organizer)}
                    onCheckedChange={() => toggleOrganizer(organizer)}
                  />
                  <Label htmlFor={`organizer-${organizer}`} className="text-sm font-normal cursor-pointer">
                    {organizer}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hide Blocked */}
        <div className="flex items-center space-x-2">
          <Checkbox id="hide-blocked" checked={hideBlocked} onCheckedChange={setHideBlocked} />
          <Label htmlFor="hide-blocked" className="text-sm font-normal cursor-pointer">
            Hide blocked events
          </Label>
        </div>

        {/* Clear Filters */}
        <Button variant="outline" onClick={clearFilters} className="w-full bg-transparent">
          Clear All Filters
        </Button>
      </CardContent>
    </Card>
  )
}
