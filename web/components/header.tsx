import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { $api } from "@/lib/api";

export function Header() {
  const [recentCalendars, setActiveCalendars] = useState<number | null>(null);

  let { data: stats } = $api.useQuery("get", "/stats", {
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  useEffect(() => {
    if (stats) {
      setActiveCalendars(stats.active_calendars);
    }
  }, [stats]);

  if (recentCalendars === null) {
    return null;
  }

  return (
    <>
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-2 ">
          <div className="gap-2 flex items-center justify-center bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            <CalendarIcon className="h-8 w-8 text-blue-600" />
            Calendar Curator
          </div>
        </h1>
        {recentCalendars && (
          <p className="text-slate-600">
            Currently helping{" "}
            <b>
              {recentCalendars} {recentCalendars === 1 ? "person" : "people"}
            </b>{" "}
            manage their calendars
          </p>
        )}
      </div>
      <p className="absolute left-[90%] top-4 text-sm text-slate-500">
        Made with ❤️ by{" "}
        <a
          href="https://github.com/confusinguser/calendar-curator"
          className="text-blue-500 hover:underline"
        >
          Mostafa Kerim
        </a>
      </p>
    </>
  );
}
