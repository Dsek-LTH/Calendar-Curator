import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseTimeToUTC(time: string): string {
  if (!time) return "";
  const [hours, minutes] = time.split(":").map(Number);

  // Create a "dummy" date at UTC midnight + given time
  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);

  // Pull back out as HH:MM in UTC
  return date.toISOString().substring(11, 16);
}

export function parseTimeFromUTC(
  utcTime: string,
  hour12: boolean = false,
): string {
  if (!utcTime) return "";
  const [hours, minutes] = utcTime.split(":").map(Number);

  // Create a "dummy" date at UTC midnight + given time
  const date = new Date();
  date.setUTCHours(hours);
  date.setUTCMinutes(minutes);

  // Pull back out as HH:MM in local time
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: hour12,
  });
}
