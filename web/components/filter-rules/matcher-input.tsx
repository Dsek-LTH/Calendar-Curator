import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Matcher, Field } from "@/lib/api";
import { parseTimeFromUTC, parseTimeToUTC } from "@/lib/utils";
import { getCalendarSettings } from "@/lib/settings";
import { TrashIcon } from "lucide-react";

interface MatcherInputProps {
  matcher: Matcher;
  onUpdate: (updates: Partial<Matcher>) => void;
  onRemove: () => void;
  showRemove?: boolean;
}

export function MatcherInput({
  matcher,
  onUpdate,
  onRemove,
}: MatcherInputProps) {
  const isDateField =
    matcher.field === "StartTime" || matcher.field === "EndTime";
  const isWeekdayMatch = matcher.match_type === "Weekdays";
  const isTimeMatch = matcher.match_type === "TimeOfDay";
  const isBetweenDatesMatch = matcher.match_type === "BetweenDates";

  // Get calendar settings to determine first day of week
  const settings = getCalendarSettings();

  // Define weekdays based on first day of week preference
  const weekdays =
    settings.firstDayOfWeek === "monday"
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Parse current selected weekdays
  const selectedWeekdays = new Set(
    (matcher.value || "")
      .split(",")
      .map((day) => day.trim())
      .filter(Boolean),
  );

  const handleWeekdayToggle = (weekday: string, checked: boolean | string) => {
    const newSelected = new Set(selectedWeekdays);
    if (checked) {
      newSelected.add(weekday);
    } else {
      newSelected.delete(weekday);
    }
    onUpdate({ value: Array.from(newSelected).join(",") });
  };

  return (
    <div className="space-y-2 p-2 border rounded-lg bg-card">
      <div className="flex items-center gap-2">
        <Checkbox
          checked={matcher.negated}
          onCheckedChange={(checked) =>
            onUpdate({ negated: checked as boolean })
          }
        />
        <Label className="text-sm">NOT</Label>

        <Select
          value={matcher.field}
          onValueChange={(value) => onUpdate({ field: value as Field })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Title">Title</SelectItem>
            <SelectItem value="Description">Description</SelectItem>
            <SelectItem value="Location">Location</SelectItem>
            <SelectItem value="StartTime">Start Time</SelectItem>
            <SelectItem value="EndTime">End Time</SelectItem>
          </SelectContent>
        </Select>

        {/* Show match type selector for date fields */}
        {isDateField && (
          <Select
            value={matcher.match_type}
            onValueChange={(value) =>
              onUpdate({
                match_type: value as Matcher["match_type"],
                value: "", // Reset value when changing match type
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BetweenDates">Between Dates</SelectItem>
              <SelectItem value="TimeOfDay">Between Times</SelectItem>
              <SelectItem value="Weekdays">Days of Week</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Only show match type selector for non-date fields */}
        {!isDateField && (
          <Select
            value={matcher.match_type}
            onValueChange={(value) =>
              onUpdate({
                match_type: value as Matcher["match_type"],
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Exact">Exact</SelectItem>
              <SelectItem value="Contains">Contains</SelectItem>
              <SelectItem value="StartsWith">Starts with</SelectItem>
              <SelectItem value="EndsWith">Ends with</SelectItem>
              <SelectItem value="Regex">Regex</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Second row for value input (non-date fields) and trash button */}
      {!isDateField && (
        <div className="flex items-center gap-2">
          <Input
            placeholder="Value"
            value={matcher.value || ""}
            onChange={(e) => onUpdate({ value: e.target.value })}
            className="flex-1"
          />
          <DeleteButton onClick={onRemove} />
        </div>
      )}

      {/* Second row for between dates */}
      {isDateField && isBetweenDatesMatch && (
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium whitespace-nowrap">From:</Label>
          <Input
            type="date"
            placeholder="Start date"
            value={matcher.value?.split(",")[0] || ""}
            onChange={(e) => {
              const endDate = matcher.value?.split(",")[1] || "";
              onUpdate({ value: `${e.target.value},${endDate}` });
            }}
            className="flex-1"
          />
          <Label className="text-sm font-medium whitespace-nowrap">To:</Label>
          <Input
            type="date"
            placeholder="End date"
            value={matcher.value?.split(",")[1] || ""}
            onChange={(e) => {
              const startDate = matcher.value?.split(",")[0] || "";
              onUpdate({ value: `${startDate},${e.target.value}` });
            }}
            className="flex-1"
          />
          <DeleteButton onClick={onRemove} />
        </div>
      )}

      {/* Second row for weekdays */}
      {isDateField && isWeekdayMatch && (
        <div className="flex items-center gap-2">
          <div className="flex grid-cols-7 gap-5">
            {weekdays.map((weekday) => (
              <div
                key={weekday}
                className="grid grid-rows-2 justify-items-center text-center gap-1"
              >
                <Label className="text-sm text-center font-mono">
                  {weekday}
                </Label>
                <Checkbox
                  checked={selectedWeekdays.has(weekday)}
                  onCheckedChange={(checked) =>
                    handleWeekdayToggle(weekday, checked)
                  }
                />
              </div>
            ))}
          </div>
          <DeleteButton onClick={onRemove} />
        </div>
      )}

      {/* Second row for time of day */}
      {isDateField && isTimeMatch && (
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium whitespace-nowrap">From:</Label>
          <Input
            type="time"
            placeholder="Start time"
            value={parseTimeFromUTC(matcher.value?.split(",")[0] || "")}
            onChange={(e) => {
              const endTime = matcher.value?.split(",")[1] || "";
              const timeUTC = parseTimeToUTC(e.target.value);
              onUpdate({ value: `${timeUTC},${endTime}` });
            }}
            className="flex-1"
          />
          <Label className="text-sm font-medium whitespace-nowrap">To:</Label>
          <Input
            type="time"
            placeholder="End time"
            value={parseTimeFromUTC(matcher.value?.split(",")[1] || "")}
            onChange={(e) => {
              console.log("Time change:", e.target.value);
              const startTime = matcher.value?.split(",")[0] || "";
              const timeUTC = parseTimeToUTC(e.target.value);
              onUpdate({ value: `${startTime},${timeUTC}` });
            }}
            className="flex-1"
          />
          <DeleteButton onClick={onRemove} />
        </div>
      )}
    </div>
  );
}

export function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" className="ml-auto" onClick={onClick}>
      <TrashIcon className="h-4 w-4" />
    </Button>
  );
}
