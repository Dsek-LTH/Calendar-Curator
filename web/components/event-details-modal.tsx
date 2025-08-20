"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CalendarIcon,
  ClockIcon,
  EyeOffIcon,
  FileTextIcon,
  MapPinIcon,
  ArrowRightIcon,
  EditIcon,
  ShieldCheckIcon,
  ScaleIcon,
} from "lucide-react";
import { CalendarEvent } from "@/lib/api";

interface EventDetailsModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleBlock: (eventId: CalendarEvent) => void;
  onToggleAllowlist: (eventId: CalendarEvent) => void;
}

export function EventDetailsModal({
  event,
  isOpen,
  onClose,
  onToggleBlock,
  onToggleAllowlist,
}: EventDetailsModalProps) {
  if (!event) return null;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12:
          localStorage.getItem("calendar-time-format") === "12-hour" || false,
      }),
    };
  };

  const displayEvent = event.transformed ? event.transformed : event.original;

  const startDateTime = displayEvent.start
    ? formatDateTime(displayEvent.start)
    : null;
  const endDateTime = displayEvent.end
    ? formatDateTime(displayEvent.end)
    : null;
  const isSameDay = startDateTime?.date === endDateTime?.date;

  const originalStartDateTime = event.original.start
    ? formatDateTime(event.original.start)
    : null;
  const originalEndDateTime = event.original.end
    ? formatDateTime(event.original.end)
    : null;

  const hasChangedFields =
    event.changed_fields && event.changed_fields.length > 0;

  const renderFieldWithTransformation = (
    label: string,
    fieldName: string,
    originalValue: string | null | undefined,
    transformedValue: string | null | undefined,
    icon: React.ReactNode,
  ) => {
    const isChanged = event.changed_fields.includes(fieldName);

    if (!originalValue && !transformedValue) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon}
          {label}
          {isChanged && (
            <Badge variant="secondary" className="text-xs">
              <EditIcon className="h-3 w-3 mr-1" />
              Transformed
            </Badge>
          )}
        </div>
        <div className="pl-6">
          {isChanged ? (
            <div className="space-y-2">
              <div className="text-muted-foreground line-through text-sm">
                {originalValue}
              </div>
              <div className="flex items-center gap-2">
                <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
                <div className="font-medium">{transformedValue}</div>
              </div>
            </div>
          ) : (
            <div className="font-medium">
              {originalValue || transformedValue}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-start gap-3 text-left">
            <CalendarIcon className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
            <div className="flex-1">
              <div className="space-y-2">
                {event.changed_fields.includes("summary") ? (
                  <div>
                    <div className="text-muted-foreground line-through text-sm">
                      {event.original.summary}
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
                      <h2 className="text-xl font-semibold leading-tight">
                        {displayEvent.summary}
                      </h2>
                    </div>
                  </div>
                ) : (
                  <h2 className="text-xl font-semibold leading-tight">
                    {displayEvent.summary}
                  </h2>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                {event.manually_allowlisted && (
                  <Badge variant="default" className="bg-green-600">
                    <ShieldCheckIcon className="h-3 w-3 mr-1" />
                    Allowlisted
                  </Badge>
                )}
                {!event.manually_allowlisted && event.rule_blocked && (
                  <Badge variant="destructive">
                    <ScaleIcon className="h-3 w-3 mr-1" />
                    Blocked by Rule
                  </Badge>
                )}
                {!event.manually_allowlisted &&
                  !event.rule_blocked &&
                  event.manually_blocked && (
                    <Badge variant="destructive">
                      <EyeOffIcon className="h-3 w-3 mr-1" />
                      Manually Blocked
                    </Badge>
                  )}
                {hasChangedFields && (
                  <Badge variant="secondary">
                    <EditIcon className="h-3 w-3 mr-1" />
                    {event.changed_fields.length} field
                    {event.changed_fields.length !== 1 ? "s" : ""} transformed
                  </Badge>
                )}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date and Time */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ClockIcon className="h-4 w-4" />
              Date & Time
              {(event.changed_fields.includes("start") ||
                event.changed_fields.includes("end")) && (
                <Badge variant="secondary" className="text-xs">
                  <EditIcon className="h-3 w-3 mr-1" />
                  Transformed
                </Badge>
              )}
            </div>
            {startDateTime && endDateTime && (
              <div className="pl-6">
                {event.changed_fields.includes("start") ||
                event.changed_fields.includes("end") ? (
                  <div className="space-y-2">
                    <div className="text-muted-foreground line-through text-sm">
                      <div className="font-medium">
                        {originalStartDateTime?.date}
                      </div>
                      <div className="text-sm">
                        {originalStartDateTime?.time} -{" "}
                        {originalStartDateTime?.date ===
                        originalEndDateTime?.date
                          ? originalEndDateTime?.time
                          : `${originalEndDateTime?.date} ${originalEndDateTime?.time}`}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <ArrowRightIcon className="h-4 w-4 text-muted-foreground mt-1" />
                      <div>
                        <div className="font-medium">{startDateTime.date}</div>
                        <div className="text-sm text-muted-foreground">
                          {startDateTime.time} -{" "}
                          {isSameDay
                            ? endDateTime.time
                            : `${endDateTime.date} ${endDateTime.time}`}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="font-medium">{startDateTime.date}</div>
                    <div className="text-sm text-muted-foreground">
                      {startDateTime.time} -{" "}
                      {isSameDay
                        ? endDateTime.time
                        : `${endDateTime.date} ${endDateTime.time}`}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Location */}
          {(event.original.location || displayEvent.location) && (
            <>
              <Separator />
              {renderFieldWithTransformation(
                "Location",
                "location",
                event.original.location,
                displayEvent.location,
                <MapPinIcon className="h-4 w-4" />,
              )}
            </>
          )}

          {/* Description */}
          {(event.original.description || displayEvent.description) && (
            <>
              <Separator />
              {renderFieldWithTransformation(
                "Description",
                "description",
                event.original.description,
                displayEvent.description,
                <FileTextIcon className="h-4 w-4" />,
              )}
            </>
          )}

          {/* Transformation Summary */}
          {hasChangedFields && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <EditIcon className="h-4 w-4" />
                  Applied Transformations
                </div>
                <div className="pl-6">
                  <div className="text-sm">
                    The following fields were modified by filtering rules:
                  </div>
                  <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                    {event.changed_fields.map((field) => (
                      <li key={field} className="capitalize">
                        {field === "start" || field === "end"
                          ? `${field} time`
                          : field}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <Separator />
          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-muted-foreground">
              {event.manually_allowlisted
                ? "This event is allowlisted and will always appear in the filtered calendar."
                : event.manually_blocked || event.rule_blocked
                  ? "This event is blocked and won't appear in the filtered calendar."
                  : "This event will appear in the filtered calendar."}
            </div>
            <div className="flex gap-2">
              {event.rule_blocked && !event.manually_allowlisted ? (
                <Button
                  variant="default"
                  onClick={() => onToggleAllowlist(event)}
                >
                  <ShieldCheckIcon className="h-4 w-4 mr-2" />
                  Add to Allowlist
                </Button>
              ) : event.manually_allowlisted ? (
                <Button
                  variant="outline"
                  onClick={() => onToggleAllowlist(event)}
                >
                  <ShieldCheckIcon className="h-4 w-4 mr-2" />
                  Remove from Allowlist
                </Button>
              ) : (
                <Button
                  variant={event.manually_blocked ? "destructive" : "outline"}
                  onClick={() => onToggleBlock(event)}
                >
                  <EyeOffIcon className="h-4 w-4 mr-2" />
                  {event.manually_blocked ? "Unblock Event" : "Block Event"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
