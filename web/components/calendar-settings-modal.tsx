import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SettingsIcon } from "lucide-react";
import { CalendarSettings } from "@/lib/settings";

interface CalendarSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CalendarSettings;
  onSettingsChange: (settings: Partial<CalendarSettings>) => void;
}

export function CalendarSettingsModal({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}: CalendarSettingsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Calendar Settings
          </DialogTitle>
          <DialogDescription>
            Customize your calendar display preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* First Day of Week Setting */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">First day of week</Label>
            <RadioGroup
              value={settings.firstDayOfWeek}
              onValueChange={(value) =>
                onSettingsChange({
                  firstDayOfWeek: value as "monday" | "sunday",
                })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monday" id="monday" />
                <Label htmlFor="monday">Monday</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sunday" id="sunday" />
                <Label htmlFor="sunday">Sunday</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Time Format Setting */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Time format</Label>
            <RadioGroup
              value={settings.timeFormat}
              onValueChange={(value) =>
                onSettingsChange({ timeFormat: value as "12h" | "24h" })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="12h" id="12h" />
                <Label htmlFor="12h">12-hour (2:30 PM)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="24h" id="24h" />
                <Label htmlFor="24h">24-hour (14:30)</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
