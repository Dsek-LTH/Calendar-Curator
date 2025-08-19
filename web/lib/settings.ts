export interface CalendarSettings {
  firstDayOfWeek: "monday" | "sunday";
  timeFormat: "12h" | "24h";
}

const defaultSettings: CalendarSettings = {
  firstDayOfWeek: "monday",
  timeFormat: "12h",
};

export function getCalendarSettings(): CalendarSettings {
  if (typeof window === "undefined") return defaultSettings;

  try {
    const firstDayOfWeek =
      (localStorage.getItem("calendar-first-day-of-week") as
        | "monday"
        | "sunday") || defaultSettings.firstDayOfWeek;
    const timeFormat =
      (localStorage.getItem("calendar-time-format") as "12h" | "24h") ||
      defaultSettings.timeFormat;

    return {
      firstDayOfWeek,
      timeFormat,
    };
  } catch {
    return defaultSettings;
  }
}

export function setCalendarSettings(settings: Partial<CalendarSettings>) {
  if (typeof window === "undefined") return;

  try {
    if (settings.firstDayOfWeek) {
      localStorage.setItem(
        "calendar-first-day-of-week",
        settings.firstDayOfWeek,
      );
    }

    if (settings.timeFormat) {
      localStorage.setItem("calendar-time-format", settings.timeFormat);
    }
  } catch {
    // Silently fail if localStorage is not available
  }
}
