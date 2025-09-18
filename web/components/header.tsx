import { CalendarIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { $api } from "@/lib/api";
import { Credit } from "@/components/credit";

export function Header() {
  const [activeCalendars, setActiveCalendars] = useState<number | null>(null);

  let { data: stats } = $api.useQuery("get", "/stats", {
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  useEffect(() => {
    if (stats) {
      setActiveCalendars(stats.active_calendars);
    }
  }, [stats]);

  return (
    <>
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-2 ">
          <div className="gap-2 flex items-center justify-center bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            <CalendarIcon className="h-8 w-8 text-blue-600" />
            Calendar Curator
          </div>
        </h1>
        {!!activeCalendars && activeCalendars != 0 && (
          <p className="text-slate-600">
            Currently helping{" "}
            <b>
              {activeCalendars} {activeCalendars === 1 ? "person" : "people"}
            </b>{" "}
            manage their calendars
          </p>
        )}
      </div>
      <Credit className="absolute right-[30px] top-4 text-sm text-slate-500 font-semibold"/>
    </>
  );
}
