"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FilterIcon, SearchIcon } from "lucide-react";
import { CalendarEvent } from "@/lib/api";

export function FilterPanel({
  events,
  onFilterChangeAction,
}: {
  events: CalendarEvent[];
  onFilterChangeAction: (filteredEvents: CalendarEvent[]) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [hideBlocked, setHideBlocked] = useState(false);

  useEffect(() => {
    let filtered = events;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.summary.toLowerCase().includes(term) ||
          event.description?.toLowerCase().includes(term) ||
          event.location?.toLowerCase().includes(term),
      );
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(
        (event) =>
          event.start && new Date(event.start) >= new Date(dateRange.start),
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(
        (event) =>
          event.start &&
          new Date(event.start) <= new Date(dateRange.end + "T23:59:59"),
      );
    }

    // Hide blocked events
    if (hideBlocked) {
      filtered = filtered.filter((event) => !event.blocked);
    }

    onFilterChangeAction(filtered);
  }, [searchTerm, dateRange, hideBlocked, events, onFilterChangeAction]);

  const clearFilters = () => {
    setSearchTerm("");
    setDateRange({ start: "", end: "" });
    setHideBlocked(false);
  };

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
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
              placeholder="Start date"
            />
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
              placeholder="End date"
            />
          </div>
        </div>

        {/* Hide Blocked */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="hide-blocked"
            checked={hideBlocked}
            onCheckedChange={(val) => setHideBlocked(val === true)}
          />
          <Label
            htmlFor="hide-blocked"
            className="text-sm font-normal cursor-pointer"
          >
            Hide blocked events
          </Label>
        </div>

        {/* Clear Filters */}
        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full bg-transparent"
        >
          Clear All Filters
        </Button>
      </CardContent>
    </Card>
  );
}
