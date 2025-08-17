use crate::error::SyntaxError;
use crate::utils::{DateFormat, parse_datetime};
use serde::Serialize;
use std::error::Error;
use utoipa::ToSchema;

#[derive(ToSchema, Serialize)]
pub struct Event {
    pub(crate) start: Option<DateFormat>,
    pub(crate) end: Option<DateFormat>,
    pub(crate) uid: String,
    timestamp: String,
    last_modified: String,
    pub(crate) summary: String,
    pub(crate) location: String,
    pub(crate) description: String,
}

impl Event {
    fn from_string(event_str: &str) -> Result<Event, SyntaxError> {
        let mut event = Event {
            start: None,
            end: None,
            uid: String::new(),
            timestamp: String::new(),
            last_modified: String::new(),
            summary: String::new(),
            location: String::new(),
            description: String::new(),
        };

        for (i, line) in event_str.lines().enumerate() {
            if line.starts_with("DTSTART") {
                event.start = Some(
                    parse_datetime(&line.replace("DTSTART", "").trim())
                        .map_err(|e| e.with_line(i + 1))?,
                );
            } else if line.starts_with("DTEND") {
                event.end = Some(
                    parse_datetime(&line.replace("DTEND", "").trim())
                        .map_err(|e| e.with_line(i + 1))?,
                );
            } else if line.starts_with("UID:") {
                event.uid = line.replace("UID:", "").trim().to_string();
            } else if line.starts_with("DTSTAMP:") {
                event.timestamp = line.replace("DTSTAMP:", "").trim().to_string();
            } else if line.starts_with("LAST-MODIFIED:") {
                event.last_modified = line.replace("LAST-MODIFIED:", "").trim().to_string();
            } else if line.starts_with("SUMMARY:") {
                event.summary = line.replace("SUMMARY:", "").trim().to_string();
            } else if line.starts_with("LOCATION:") {
                event.location = line.replace("LOCATION:", "").trim().to_string();
            } else if line.starts_with("DESCRIPTION:") {
                event.description = line
                    .replace("DESCRIPTION:", "")
                    .replace("\\n", "\n")
                    .trim()
                    .to_string();
            }
        }
        Ok(event)
    }
}

#[derive(ToSchema, Serialize)]
pub struct Calendar {
    name: String,
    description: String,
    method: String,
    version: String,
    prodid: String,
    calscale: String,
    published_ttl: String,
    pub events: Vec<Event>,
}

impl Calendar {
    pub fn from_string(calendar_str: &str) -> Result<Calendar, Box<dyn Error>> {
        let mut calendar = Calendar {
            name: String::new(),
            description: String::new(),
            method: String::new(),
            version: String::new(),
            prodid: String::new(),
            calscale: String::new(),
            published_ttl: String::new(),
            events: Vec::new(),
        };

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
