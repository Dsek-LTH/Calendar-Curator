use crate::error::SyntaxError;
use crate::processing::event::Event;
use serde::{Deserialize, Serialize};
use std::error::Error;
use utoipa::ToSchema;

/// This is a representation of an iCalendar object from an iCal file. There is also [Calendar] which is the calendar object used internally when processing
#[derive(Debug, Clone, ToSchema, Serialize, Deserialize)]
pub struct ICalendar {
    pub(crate) name: String,
    pub(crate) description: String,
    pub(crate) method: String,
    pub(crate) version: String,
    pub(crate) prodid: String,
    pub(crate) calscale: String,
    pub(crate) published_ttl: String,
    pub events: Vec<Event>,
}

impl Default for ICalendar {
    fn default() -> ICalendar {
        ICalendar {
            name: String::new(),
            description: String::new(),
            method: String::new(),
            version: String::new(),
            prodid: String::new(),
            calscale: String::new(),
            published_ttl: String::new(),
            events: Vec::new(),
        }
    }
}

impl ICalendar {
    pub fn from_string(calendar_str: &str) -> Result<ICalendar, Box<dyn Error>> {
        let mut calendar = ICalendar::default();

        let mut event_str = String::new();
        let mut in_event = false;

        // Iterate through each line of the calendar string and put folded lines together
        // to handle multi-line properties correctly.
        let mut unfolded_lines = String::new();
        for line in calendar_str.lines() {
            if line.starts_with(" ") || line.starts_with("\t") {
                // This line is a continuation of the previous line
                unfolded_lines.push_str(line.trim_start());
            } else {
                unfolded_lines.push('\n'); // Add a newline before the new line
                unfolded_lines.push_str(line);
            }
        }
        let calendar_str = unfolded_lines.replace("\\,", ",").replace("\\;", ";");

        for (i, line) in calendar_str.lines().enumerate() {
            if in_event {
                if line.starts_with("BEGIN:VEVENT") {
                    // If we encounter another BEGIN:VEVENT while already in an event, we should not process it
                    return Err(SyntaxError::new(
                        "Nested BEGIN:VEVENT found".to_string(),
                        Some(i + 1),
                    )
                    .into());
                }

                if line.starts_with("END:VEVENT") {
                    // End of the current event, process it
                    calendar
                        .events
                        .push(Event::from_string(&event_str).map_err(|e| {
                            if let Some(line_num) = e.line {
                                dbg!(line_num, i);
                                e.with_line(line_num + i) // Adjust line number based on current index
                            } else {
                                e
                            }
                        })?);
                    in_event = false; // Reset in_event flag
                    continue;
                }

                event_str.push_str(line);
                event_str.push('\n');
            }

            if line.starts_with("BEGIN:VCALENDAR") {
                continue;
            } else if line.starts_with("END:VCALENDAR") {
                break;
            } else if line.starts_with("X-WR-CALNAME:") {
                calendar.name = line.replace("X-WR-CALNAME:", "").trim().to_string();
            } else if line.starts_with("X-WR-CALDESC:") {
                calendar.description = line
                    .replace("X-WR-CALDESC:", "")
                    .trim()
                    .to_string()
                    .replace("\\n", "\n");
            } else if line.starts_with("METHOD:") {
                calendar.method = line.replace("METHOD:", "").trim().to_string();
            } else if line.starts_with("VERSION:") {
                calendar.version = line.replace("VERSION:", "").trim().to_string();
            } else if line.starts_with("PRODID:") {
                calendar.prodid = line.replace("PRODID:", "").trim().to_string();
            } else if line.starts_with("CALSCALE:") {
                calendar.calscale = line.replace("CALSCALE:", "").trim().to_string();
            } else if line.starts_with("X-PUBLISHED-TTL:") {
                calendar.published_ttl = line.replace("X-PUBLISHED-TTL:", "").trim().to_string();
            } else if line.starts_with("BEGIN:VEVENT") {
                event_str.clear(); // Start a new event
                in_event = true;
            }
        }
        Ok(calendar)
    }

    pub fn to_string(&self) -> String {
        let mut calendar_str = String::new();
        calendar_str.push_str("BEGIN:VCALENDAR\n");
        calendar_str.push_str(&format!("X-WR-CALNAME:{}\n", self.name));
        calendar_str.push_str(&format!("X-WR-CALDESC:{}\n", self.description));
        calendar_str.push_str(&format!("METHOD:{}\n", self.method));
        calendar_str.push_str(&format!("VERSION:{}\n", self.version));
        calendar_str.push_str(&format!("PRODID:{}\n", self.prodid));
        calendar_str.push_str(&format!("CALSCALE:{}\n", self.calscale));
        calendar_str.push_str(&format!("X-PUBLISHED-TTL:{}\n", self.published_ttl));
        calendar_str.push_str(&format!("NAME:{}\n", self.name));

        for event in &self.events {
            calendar_str.push_str("BEGIN:VEVENT\n");
            if let Some(start) = &event.start {
                calendar_str.push_str(&format!("DTSTART{}\n", start.to_ical_str()));
            }
            if let Some(end) = &event.end {
                calendar_str.push_str(&format!("DTEND{}\n", end.to_ical_str()));
            }
            calendar_str.push_str(&format!("UID:{}\n", event.uid));
            calendar_str.push_str(&format!("DTSTAMP:{}\n", event.timestamp));
            calendar_str.push_str(&format!("LAST-MODIFIED:{}\n", event.last_modified));
            calendar_str.push_str(&format!("SUMMARY:{}\n", event.summary));
            calendar_str.push_str(&format!("LOCATION:{}\n", event.location));
            calendar_str.push_str(&format!(
                "DESCRIPTION:{}\n",
                event.description.replace("\n", "\\n")
            ));
            calendar_str.push_str("END:VEVENT\n");
        }

        calendar_str.push_str("END:VCALENDAR\n");
        calendar_str
    }
}
