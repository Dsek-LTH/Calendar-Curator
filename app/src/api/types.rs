use crate::processing::event::Event;
use serde::Serialize;
use utoipa::ToSchema;

#[derive(Serialize, ToSchema)]
pub struct EventResponse {
    pub original: Event,
    pub transformed: Option<Event>,
    pub manually_blocked: bool,
    /// List of rule IDs that matched this event.
    pub filtered_by: Vec<String>,
    /// Which fields were changed by transformations
    pub changed_fields: Vec<String>,
    pub rule_blocked: bool,
    /// Whether this event is allowlisted (immune from rule blocking)
    pub manually_allowlisted: bool,
}

#[derive(Serialize, ToSchema)]
pub struct CalendarStatsResponse {
    pub(crate) active_calendars: i32,
}
