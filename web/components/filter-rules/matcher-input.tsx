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
import { TrashIcon } from "lucide-react";
import { Matcher, Field } from "@/lib/api";

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
    matcher.field === "StartDate" || matcher.field === "EndDate";

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
            <SelectItem value="Summary">Title</SelectItem>
            <SelectItem value="Description">Description</SelectItem>
            <SelectItem value="Location">Location</SelectItem>
            <SelectItem value="StartDate">Start Date</SelectItem>
            <SelectItem value="EndDate">End Date</SelectItem>
          </SelectContent>
        </Select>

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
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Second row for date fields */}
      {isDateField && (
        <div className="flex items-center gap-2">
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
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
